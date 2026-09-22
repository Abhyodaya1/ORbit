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

  
}