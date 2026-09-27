import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { RoomManager } from './room';
import { prisma } from '@orbit/db';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`🔌 [Connected] Socket: ${socket.id}`);

  // 1. Join Room
  socket.on('join_room', async ({ roomCode, token }) => {
    try {
      const result = await roomManager.join(roomCode, token, socket.id);

      if (!result.success) {
        socket.emit('join_error', { message: 'Could not join room' });
        return;
      }

      socket.join(roomCode);
      console.log(`👤 [Room Joined] ${result.role} in ${roomCode} (${socket.id})`);

      const currentState = roomManager.getGameState(roomCode, token);
      if (currentState) {
        socket.emit('game_state_update', currentState);
      }

     try {
        const history = await prisma.message.findMany({
          where: { room: { code: roomCode } },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });
        socket.emit('chat_history', history);
      } catch (e) {
        console.error('Failed to fetch chat history:', e);
      }

      io.to(roomCode).emit('presence_update', result.presence);
      socket.emit('joined_successfully', { role: result.role });
    } catch (err: any) {
      socket.emit('join_error', { message: err.message });
    }
  });

  // 2. WebRTC Signaling Relays
  socket.on('webrtc_offer', ({ roomCode, sdp }) => {
    socket.to(roomCode).emit('webrtc_offer', { sdp });
  });

  socket.on('webrtc_answer', ({ roomCode, sdp }) => {
    socket.to(roomCode).emit('webrtc_answer', { sdp });
  });

  socket.on('webrtc_ice_candidate', ({ roomCode, candidate }) => {
    socket.to(roomCode).emit('webrtc_ice_candidate', { candidate });
  });


  // 3. Game: Start Game (includes 40 FPS Pong tick callback)
  socket.on('start_game', ({ roomCode, gameType }) => {
    console.log(`🎮 [Game Starting] ${gameType} in room ${roomCode}`);

    const result = roomManager.startGame(roomCode, gameType, (pongTickState) => {
      // 40Hz broadcast to both players for ultra-smooth Pong!
      io.to(roomCode).emit('game_state_update', pongTickState);
    });

    if (result.error) {
      socket.emit('game_error', { message: result.error });
      return;
    }

    const room = roomManager.getRoom(roomCode);
    if (!room || !room.host || !room.peer) return;

    io.to(room.host.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.host.token));
    io.to(room.peer.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.peer.token));
  });

  // 4. Game: Player Action
  socket.on('game_action', ({ roomCode, token, action }) => {
    const result = roomManager.handleGameAction(roomCode, token, action);

    if (result && result.error) {
      socket.emit('game_error', { message: result.error });
      return;
    }

    // High frequency paddle moves are handled by the 40Hz tick loop
    if (action.type === "PADDLE_MOVE") return;

    const room = roomManager.getRoom(roomCode);
    if (!room || !room.host || !room.peer) return;

    io.to(room.host.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.host.token));
    io.to(room.peer.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.peer.token));
  });

  socket.on("send_reaction", ({ roomCode, emoji }) => {
    io.to(roomCode).emit('emoji_reaction', {
      emoji,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
  });

  socket.on("send_message", async ({ roomCode, token, text }) =>{
    if(!text || text.trim() === "") return;
    const room = roomManager.getRoom(roomCode);
    if(!room) return;

     const isHost = room.host?.token === token;
    const isPeer = room.peer?.token === token;
    if (!isHost && !isPeer) return;
    const senderRole: 'HOST' | 'PEER' = isHost ? 'HOST' : 'PEER';
    const senderName = senderRole === 'HOST' ? 'Host' : 'Partner';
  const messagePayload = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderRole,
      senderName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    // ⚡ 1. Instant WebSocket Relay (No waiting for database!)
    io.to(roomCode).emit('new_message', messagePayload);
    // 💾 2. Background Database Write (Non-blocking)
    prisma.room.findUnique({ where: { code: roomCode } }).then((dbRoom) => {
      if (dbRoom) {
        prisma.message.create({
          data: {
            roomId: dbRoom.id,
            senderRole,
            senderName,
            text: text.trim(),
          },
        }).catch((err) => console.error('Error saving message to DB:', err));
      }
    }).catch(console.error);
  });

  // 5. Canvas: Real-time brush strokes
  socket.on('draw_stroke', ({ roomCode, stroke }) => {
    socket.to(roomCode).emit('draw_stroke', stroke);
  });

  socket.on('clear_canvas', ({ roomCode }) => {
    socket.to(roomCode).emit('clear_canvas');
  });

  // 6. Disconnect handling
  socket.on('disconnect', () => {
    console.log(`❌ [Disconnected] Socket: ${socket.id}`);
    const result = roomManager.handleDisconnect(socket.id);
    if (result) {
      io.to(result.roomCode).emit('presence_update', result.presence);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 [Signaling Server] Running at http://localhost:${PORT}`);
});