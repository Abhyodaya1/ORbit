import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { RoomManager } from './room';
import { prisma } from '@orbit/db';
import { startReaper } from "./reaper";
import { RateLimiter } from './rateLimiter';
import { preloadCelebrityImages } from './games/celebrityGuess';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());



// ── 1. Production Healthcheck (Liveness & Readiness Probe) ──
app.get('/health', async (req, res) => {
  try {
    // ⚡ Ultra-fast 0.5ms TCP & Auth Heartbeat ping against PostgreSQL
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (error: any) {
    console.error('❌ [Healthcheck Failed] Database unreachable:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ── 2. Live Telemetry & System Metrics ──
app.get('/api/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

  res.status(200).json({
    status: 'ok',
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    },
    rooms: {
      activeCount: roomManager.getActiveRoomCount(),
      activeCodes: roomManager.getActiveRoomCodes(),
    },
    network: {
      connectedSockets: io.engine ? io.engine.clientsCount : 0,
    },
    memory: {
      heapUsedMB: toMB(mem.heapUsed),
      heapTotalMB: toMB(mem.heapTotal),
      rssMB: toMB(mem.rss), // Total physical RAM allocated by OS
      externalMB: toMB(mem.external),
    },
    timestamp: new Date().toISOString(),
  });
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

// ── 3. Real-Time Room Presence Status Check ──
app.get('/api/room/:code/status', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(200).json({
      exists: false,
      hostConnected: false,
      peerConnected: false,
    });
  }

  return res.status(200).json({
    exists: true,
    hostConnected: !!room.host?.connected,
    peerConnected: !!room.peer?.connected,
  });
});
// 📸 Pre-warm Wikipedia image cache in memory on boot (0ms game latency)
preloadCelebrityImages();
// 🧹 Start the background Database Reaper daemon (sweeps every 15 mins)
startReaper(roomManager, 15);

const rateLimiter = new RateLimiter();

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

     if (rateLimiter.isRateLimited(`${socket.id}:reaction`, 8, 2000)) {
      return; // Silently drop reaction spam
    }
    io.to(roomCode).emit('emoji_reaction', {
      emoji,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
  });

  socket.on("send_message", async ({ roomCode, token, text }) =>{
    if(!text || text.trim() === "") return;

     if (rateLimiter.isRateLimited(`${socket.id}:chat`, 5, 2000)) {
      socket.emit("error_alert", { message: "Slow down! You are sending messages too fast." });
      return;
    }

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
      rateLimiter.cleanup(socket.id);
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

// ── 7. Graceful Process Lifecycle (SIGINT / SIGTERM Clean Drain) ──
async function handleGracefulShutdown(signal: string) {
  console.log(`\n🛑 [${signal}] Received. Starting graceful shutdown sequence...`);

  try {
    // 1. Inform connected clients and close WebSockets cleanly (Code 1001)
    io.emit("server_alert", { message: "Server is restarting. Reconnecting shortly..." });
    io.disconnectSockets(true);

    // 2. Stop accepting new HTTP requests
    httpServer.close(() => {
      console.log("🔒 [HTTP] Server stopped listening for new connections.");
    });

    // 3. Disconnect PostgreSQL connection pool safely
    await prisma.$disconnect();
    console.log("🔌 [Database] Prisma connection pool closed safely.");

    console.log("👋 [Shutdown Complete] Exiting with Code 0.");
    process.exit(0);
  } catch (err: any) {
    console.error("⚠️ [Shutdown Error]:", err.message);
    process.exit(1);
  }
}

// OS Process Signals
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM')); // Cloud orchestrator shutdown (Railway, Render, AWS)
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));   // Terminal Ctrl + C