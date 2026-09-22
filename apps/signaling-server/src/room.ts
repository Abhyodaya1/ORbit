import { prisma } from "@orbit/db";

interface Participant {
    token: string;
    role: 'HOST' | 'PEER';
    socketId: string;
    connected: boolean;
}

interface ActiveRoom {
  code: string;
  host?: Participant;
  peer?: Participant;
  selectedGame: string;
  disconnectTimers: Map<string, NodeJS.Timeout>; // token -> timeout
}

export class RoomManager {

    private rooms = new Map<string, ActiveRoom>();
    private socketToUser = new Map<string, { roomCode: string; token: string }>();

    async join(roomCode: string, token: string, socketId: string)
    {
        let dbRoom = await prisma.room.findUnique({
            where: { code: roomCode },
        });
        if (!dbRoom) {
            throw new Error("Room not found");
        }

        let role: 'HOST' | 'PEER';
        if (dbRoom.hostToken === token) {
            role = 'HOST';
        } else if (dbRoom.peerToken === token) {
            role = 'PEER';
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

    const participant: Participant = {
      token,
      socketId,
      role,
      connected: true,
    };
    if (role === "HOST") {
      room.host = participant;
    } else {
      room.peer = participant;
    }
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
    const lookup = this.socketToUser.get(socketId);
    if (!lookup) return null;
    const { roomCode, token } = lookup;
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
    // 60-Second Reconnection Grace Period!
    const timer = setTimeout(() => {
      console.log(`💀 [Grace Period Expired] Tearing down inactive slot for ${token}`);
      if (room.host?.token === token) delete room.host;
      if (room.peer?.token === token) delete room.peer;
      room.disconnectTimers.delete(token);
      // If both left, prune room from RAM
      if (!room.host && !room.peer) {
        this.rooms.delete(roomCode);
        console.log(`🧹 [Cleanup] Pruned empty room: ${roomCode}`);
      }
    }, 60000); // 60 seconds
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
}