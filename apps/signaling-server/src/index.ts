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
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`🔌 [Connected] Socket: ${socket.id}`);

  // Client requests to join a room with their participant token
  socket.on('join_room', async ({ roomCode, token }) => {
    const result = await roomManager.join(roomCode, token, socket.id);

    if (!result.success) {
      socket.emit('join_error', { message: result.error });
      return;
    }

    // Join Socket.IO isolated room channel
    socket.join(roomCode);

    console.log(`👤 [Room Joined] ${result.role} joined room ${roomCode} (${socket.id})`);

    // Broadcast updated presence to BOTH users in the room
    io.to(roomCode).emit('presence_update', result.presence);
    socket.emit('joined_successfully', { role: result.role });
  });

  socket.on("webrtc_offer", ({ roomCode, offer }) => {
    socket.to(roomCode).emit("webrtc_offer", { offer });
  });

  socket.on("webrtc_answer", ({ roomCode, answer }) => {
    socket.to(roomCode).emit("webrtc_answer", { answer });
  });

  socket.on("webrtc_ice_candidate", ({ roomCode, candidate }) => {
    socket.to(roomCode).emit("webrtc_ice_candidate", { candidate });
  });

  socket.on('disconnect', () => {
    const result = roomManager.handleDisconnect(socket.id);
    if (result) {
      console.log(`⚠️ [User Disconnected] ${result.disconnectedRole} left ${result.roomCode}`);
      // Notify remaining partner that user is disconnected / reconnecting
      io.to(result.roomCode).emit('presence_update', result.presence);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Orbit Signaling Server running on port ${PORT}`);
});