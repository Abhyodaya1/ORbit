import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { RoomManager } from './room';

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
  transports: ["websocket"],
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`🔌 [Connected] Socket: ${socket.id}`);

  // 1. Join Room
  socket.on('join_room', async ({ roomCode, token }) => {
    const result = await roomManager.join(roomCode, token, socket.id);

    if (!result.success) {
      socket.emit('join_error', { message: result.error });
      return;
    }

    socket.join(roomCode);
    console.log(`👤 [Room Joined] ${result.role} in ${roomCode} (${socket.id})`);
      const currentState = roomManager.getGameState(roomCode, token);
  if (currentState) {
    socket.emit('game_state_update', currentState);
  }
    io.to(roomCode).emit('presence_update', result.presence);
    socket.emit('joined_successfully', { role: result.role });
  });

  // 2. WebRTC Signaling Relays (using 'sdp' so it matches useWebRTC.ts!)
  socket.on('webrtc_offer', ({ roomCode, sdp }) => {
    socket.to(roomCode).emit('webrtc_offer', { sdp });
  });

  socket.on('webrtc_answer', ({ roomCode, sdp }) => {
    socket.to(roomCode).emit('webrtc_answer', { sdp });
  });

  socket.on('webrtc_ice_candidate', ({ roomCode, candidate }) => {
    socket.to(roomCode).emit('webrtc_ice_candidate', { candidate });
  });

  // 3. Game: Start Game
  socket.on('start_game', ({ roomCode, gameType }) => {
    console.log(`🎮 [Game Starting] ${gameType} in room ${roomCode}`);
    const result = roomManager.startGame(roomCode, gameType);

    if (result.error) {
      socket.emit('game_error', { message: result.error });
      return;
    }

    const room = roomManager.getRoom(roomCode);
    if (!room || !room.host || !room.peer) return;

    // Send each player their masked state view
    io.to(room.host.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.host.token));
    io.to(room.peer.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.peer.token));

    console.log("📡 Server sending state to Host socket:", room.host.socketId);
console.log("📡 Server sending state to Peer socket:", room.peer.socketId);
  });

  // 4. Game: Player Action (Guess)
  socket.on('game_action', ({ roomCode, token, action }) => {
    console.log(`🎯 [Game Action] In ${roomCode}:`, action);
    const result = roomManager.handleGameAction(roomCode, token, action);

    if (result.error) {
      socket.emit('game_error', { message: result.error });
      return;
    }

    const room = roomManager.getRoom(roomCode);
    if (!room || !room.host || !room.peer) return;

    io.to(room.host.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.host.token));
    io.to(room.peer.socketId).emit('game_state_update', roomManager.getGameState(roomCode, room.peer.token));
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
    const result = roomManager.handleDisconnect(socket.id);
    if (result) {
      console.log(`⚠️ [User Disconnected] ${result.disconnectedRole} left ${result.roomCode}`);
      io.to(result.roomCode).emit('presence_update', result.presence);
      socket.to(result.roomCode).emit('peer_disconnected');
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Orbit Signaling Server running on port ${PORT}`);
});