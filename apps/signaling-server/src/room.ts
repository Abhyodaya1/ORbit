import { prisma } from "@orbit/db";
import { HigherLowerGame } from "./games/higherlower";
import { DrawGuessGame } from "./games/drawGuess";
import { CelebrityGuessGame } from "./games/celebrityGuess";
import { RockPaperScissorsGame } from "./games/rps";
import { PongGame, PongState } from "./games/pong";

interface Participant {
  token: string;
  role: "HOST" | "PEER";
  socketId: string;
  connected: boolean;
}

interface ActiveRoom {
  code: string;
  host?: Participant;
  peer?: Participant;
  selectedGame: string;
  currentGame?: HigherLowerGame;
  currentDrawGame?: DrawGuessGame;
  currentCelebrityGame?: CelebrityGuessGame;
  currentRPSGame?: RockPaperScissorsGame;
  currentPongGame?: PongGame;
  disconnectTimers: Map<string, NodeJS.Timeout>;
}

export class RoomManager {
  private rooms = new Map<string, ActiveRoom>();
  private socketToUser = new Map<string, { roomCode: string; token: string }>();
   
getActiveRoomCodes(): string[] {
    return Array.from(this.rooms.keys());
  }

   getActiveRoomCount(): number {
    return this.rooms.size;
  }

  async join(roomCode: string, token: string, socketId: string) {
    let dbRoom = await prisma.room.findUnique({
      where: { code: roomCode },
    });
    if (!dbRoom) throw new Error("Room not found");

    let role: "HOST" | "PEER";
    if (dbRoom.hostToken === token) {
      role = "HOST";
    } else if (dbRoom.peerToken === token) {
      role = "PEER";
    } else {
      throw new Error("Invalid token");
    }

    let room = this.rooms.get(roomCode);
    if (!room) {
      room = {
        code: roomCode,
        selectedGame: "HIGHER_LOWER",
        disconnectTimers: new Map(),
      };
      this.rooms.set(roomCode, room);
    }

    const existingTimer = room.disconnectTimers.get(token);
    if (existingTimer) {
      clearTimeout(existingTimer);
      room.disconnectTimers.delete(token);
      console.log(`⏱️ [Grace Period] Cancelled disconnect timer for ${role} in ${roomCode}`);
    }

    const participant: Participant = { token, role, socketId, connected: true };
    if (role === "HOST") room.host = participant;
    else room.peer = participant;

    this.socketToUser.set(socketId, { roomCode, token });

    return {
      success: true,
      role,
      presence: {
        hostConnected: !!room.host?.connected,
        peerConnected: !!room.peer?.connected,
      },
    };
  }

  handleDisconnect(socketId: string) {
    const mapping = this.socketToUser.get(socketId);
    if (!mapping) return null;

    const { roomCode, token } = mapping;
    this.socketToUser.delete(socketId);

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    let disconnectedRole: "HOST" | "PEER" | null = null;
    if (room.host?.token === token) {
      room.host.connected = false;
      disconnectedRole = "HOST";
    } else if (room.peer?.token === token) {
      room.peer.connected = false;
      disconnectedRole = "PEER";
    }

    const timer = setTimeout(() => {
      console.log(`💀 [Grace Period Expired] Tearing down inactive slot for ${token}`);
      if (room.host?.token === token) delete room.host;
      if (room.peer?.token === token) delete room.peer;
      room.disconnectTimers.delete(token);

      if (!room.host && !room.peer) {
        // 1. Halt any running game intervals to stop CPU leaks
        room.currentPongGame?.stop();
        // 2. Remove the room from Node's in-memory Map
        this.rooms.delete(roomCode);
        console.log(`🧹 [Cleanup] Pruned empty room from memory: ${roomCode}`);
        // 3. Atomically cascade delete from PostgreSQL database (Safe non-blocking Promise)
        prisma.room
          .delete({
            where: { code: roomCode },
          })
          .then(() => {
            console.log(`🗑️ [Database] Cascade deleted room & chat from DB: ${roomCode}`);
          })
          .catch((err) => {
            console.error(`⚠️ [Database] Failed to delete room ${roomCode} from DB:`, err.message);
          });
      }
    }, 60000);

    room.disconnectTimers.set(token, timer);
    return {
      roomCode,
      disconnectedRole,
      presence: {
        hostConnected: !!room.host?.connected,
        peerConnected: !!room.peer?.connected,
      },
    };
  }

  getPeerSocketId(roomCode: string, myRole: "HOST" | "PEER"): string | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const target = myRole === "HOST" ? room.peer : room.host;
    return target?.connected ? target.socketId : null;
  }

  startGame(roomCode: string, gameType: string, onPongTick?: (state: PongState) => void) {
    const room = this.rooms.get(roomCode);
    if (!room || !room.host || !room.peer) {
      return { error: "Both players must be in the room to start!" };
    }

    // Stop active Pong tick loop if switching games
    if (room.currentPongGame) {
      room.currentPongGame.stop();
    }

    room.selectedGame = gameType;
    if (gameType === "HIGHER_LOWER") {
      room.currentGame = new HigherLowerGame(room.host.token, room.peer.token);
    } else if (gameType === "DRAW_GUESS") {
      room.currentDrawGame = new DrawGuessGame(room.host.token, room.peer.token);
    } else if (gameType === "CELEBRITY_GUESS") {
      room.currentCelebrityGame = new CelebrityGuessGame(room.host.token, room.peer.token);
    } else if (gameType === "ROCK_PAPER_SCISSORS") {
      room.currentRPSGame = new RockPaperScissorsGame(room.host.token, room.peer.token);
    } else if (gameType === "PONG") {
      room.currentPongGame = new PongGame(room.host.token, room.peer.token, onPongTick);
    }

    return { success: true, room };
  }

  handleGameAction(roomCode: string, token: string, action: { type: string; guess?: number | string; choice?: any; y?: number }) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: "No active game in this room!" };

    // 1. Draw & Guess
    if (room.selectedGame === "DRAW_GUESS" && room.currentDrawGame) {
      if (action.type === "GUESS" && action.guess !== undefined) {
        return room.currentDrawGame.handleGuess(token, String(action.guess));
      }
    }
    // 2. Higher or Lower
    else if (room.selectedGame === "HIGHER_LOWER" && room.currentGame) {
      if (action.type === "GUESS" && action.guess !== undefined) {
        return room.currentGame.handleGuess(token, Number(action.guess));
      }
    }
    // 3. Celebrity Mystery
    else if (room.selectedGame === "CELEBRITY_GUESS" && room.currentCelebrityGame) {
      if (action.type === "GUESS" && action.guess !== undefined) {
        return room.currentCelebrityGame.handleGuess(token, String(action.guess));
      }
      if (action.type === "NEXT_ROUND") {
        room.currentCelebrityGame.nextRound();
        return { success: true };
      }
    }
    // 4. Rock Paper Scissors
    else if (room.selectedGame === "ROCK_PAPER_SCISSORS" && room.currentRPSGame) {
      if (action.type === "CHOOSE" && action.choice) {
        return room.currentRPSGame.handleChoice(token, action.choice);
      }
      if (action.type === "NEXT_ROUND") {
        room.currentRPSGame.nextRound();
        return { success: true };
      }
    }
    // 5. Table Tennis (Pong)
    else if (room.selectedGame === "PONG" && room.currentPongGame) {
      if (action.type === "PADDLE_MOVE" && Number.isFinite(action.y) && typeof action.y === "number") {
        room.currentPongGame.updatePaddle(token, action.y);
        return { success: true };
      }
    }

    return { error: "Unknown action" };
  }

  getGameState(roomCode: string, token: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    if (room.selectedGame === "DRAW_GUESS" && room.currentDrawGame) {
      return room.currentDrawGame.getStateForPlayer(token);
    }
    if (room.selectedGame === "HIGHER_LOWER" && room.currentGame) {
      return room.currentGame.getStateForPlayer(token);
    }
    if (room.selectedGame === "CELEBRITY_GUESS" && room.currentCelebrityGame) {
      return room.currentCelebrityGame.getStateForPlayer(token);
    }
    if (room.selectedGame === "ROCK_PAPER_SCISSORS" && room.currentRPSGame) {
      return room.currentRPSGame.getStateForPlayer(token);
    }
    if (room.selectedGame === "PONG" && room.currentPongGame) {
      return room.currentPongGame.getState();
    }

    return null;
  }

  getRoom(roomCode: string) {
    return this.rooms.get(roomCode);
  }
}