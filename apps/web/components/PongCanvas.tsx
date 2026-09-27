"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface PongState {
  gameType: "PONG";
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  paddles: { hostY: number; peerY: number; width: number; height: number };
  court: { width: number; height: number };
  scores: { HOST: number; PEER: number };
  status: "PLAYING" | "FINISHED";
  winner: "HOST" | "PEER" | null;
}

interface PongCanvasProps {
  socket: Socket | null;
  roomCode: string;
  token: string | null;
  role: "HOST" | "PEER" | null;
  onPlayAgain: () => void;
}

export default function PongCanvas({
  socket,
  roomCode,
  token,
  role,
  onPlayAgain,
}: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Authoritative server state stored in a Ref (Zero React Virtual DOM diffing during gameplay)
  const latestStateRef = useRef<PongState | null>(null);

  // 2. Client-Side Prediction: local paddle position updates at 0ms latency
  const localPaddleYRef = useRef<number>(205); // (500 - 90) / 2
  const lastEmitTimeRef = useRef<number>(0);

  // 3. Declarative state: ONLY for terminal events (Score display & Game Over banner)
  const [gameOverInfo, setGameOverInfo] = useState<{
    isOver: boolean;
    winner: "HOST" | "PEER" | null;
    scores: { HOST: number; PEER: number };
  }>({
    isOver: false,
    winner: null,
    scores: { HOST: 0, PEER: 0 },
  });

  // Listen to Server Game State Updates directly without triggering parent React re-renders
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (state: any) => {
      if (!state || state.gameType !== "PONG") return;

      latestStateRef.current = state;

      // Only trigger React state update when match terminates or resumes
      if (state.status === "FINISHED") {
        setGameOverInfo({
          isOver: true,
          winner: state.winner,
          scores: state.scores,
        });
      } else if (gameOverInfo.isOver && state.status === "PLAYING") {
        setGameOverInfo({
          isOver: false,
          winner: null,
          scores: state.scores,
        });
      }
    };

    socket.on("game_state_update", handleUpdate);

    return () => {
      socket.off("game_state_update", handleUpdate);
    };
  }, [socket, gameOverInfo.isOver]);

  // High-Performance requestAnimationFrame Rendering Engine (Runs at monitor's native 60/120Hz)
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const state = latestStateRef.current;

      if (canvas && state && state.gameType === "PONG") {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { ball, paddles, court, scores } = state;

          // Background (Dark Retro Arcade Felt)
          ctx.fillStyle = "#141226";
          ctx.fillRect(0, 0, court.width, court.height);

          // Center Dashed Net Line
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(court.width / 2, 0);
          ctx.lineTo(court.width / 2, court.height);
          ctx.stroke();
          ctx.setLineDash([]);

          // Big Center Field Score
          ctx.font = "bold 56px 'Silkscreen', monospace";
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.textAlign = "center";
          ctx.fillText(
            `${scores.HOST}   ${scores.PEER}`,
            court.width / 2,
            court.height / 2 + 20
          );

          // Determine Paddles: Use local predicted position for own paddle, server pos for partner
          const isHost = role === "HOST";
          const hostY = isHost ? localPaddleYRef.current : paddles.hostY;
          const peerY = !isHost ? localPaddleYRef.current : paddles.peerY;

          // Left Paddle (Host - Mint Green Glow)
          ctx.fillStyle = "#10b981";
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 10;
          ctx.fillRect(15, hostY, paddles.width, paddles.height);

          // Right Paddle (Peer - Neon Violet Glow)
          ctx.fillStyle = "#7c5ce7";
          ctx.shadowColor = "#7c5ce7";
          ctx.shadowBlur = 10;
          ctx.fillRect(
            court.width - 15 - paddles.width,
            peerY,
            paddles.width,
            paddles.height
          );

          // Ball (Glowing Arcade Orb)
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 12;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();

          // Reset shadow
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [role]);

  // Client-Side Prediction & Monotonic 30Hz Socket Throttle
  const syncPaddle = useCallback(
    (normalizedY: number) => {
      const clampedY = Math.max(0, Math.min(1, normalizedY));

      // Instant local update (0ms latency!)
      localPaddleYRef.current = clampedY * (500 - 90);

      // Throttled network sync: max once every 30ms (~33 packets/sec)
      const now = performance.now();
      if (now - lastEmitTimeRef.current >= 30) {
        lastEmitTimeRef.current = now;
        if (socket && token) {
          socket.emit("game_action", {
            roomCode,
            token,
            action: { type: "PADDLE_MOVE", y: clampedY },
          });
        }
      }
    },
    [socket, roomCode, token]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedY = (e.clientY - rect.top) / rect.height;
    syncPaddle(normalizedY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedY = (e.touches[0].clientY - rect.top) / rect.height;
    syncPaddle(normalizedY);
  };

  return (
    <div className="flex-1 flex flex-col gap-3 max-w-2xl mx-auto w-full relative z-10">
      {/* Arena Header */}
      <div className="bg-orbit-subsurface border-2 border-orbit-border p-2.5 rounded-boxy shadow-arcadeSm flex items-center justify-between">
        <div>
          <span className="font-pixel text-[10px] text-orbit-muted">
            {role === "HOST" ? "🟢 YOU: LEFT PADDLE" : "🟣 YOU: RIGHT PADDLE"}
          </span>
          <h3 className="font-pixel text-xs font-bold text-orbit-accent mt-0.5">
            FIRST TO 5 POINTS WINS!
          </h3>
        </div>
        <div className="text-xs font-pixel text-orbit-muted hidden sm:block">
          Move mouse or finger up/down to defend!
        </div>
      </div>

      {/* Retro Pong Canvas */}
      <div className="relative w-full aspect-[8/5] bg-black border-2 border-orbit-border rounded-boxy shadow-arcade overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="w-full h-full cursor-none touch-none"
        />

        {/* Game Over Overlay */}
        {gameOverInfo.isOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 animate-in fade-in zoom-in duration-300">
            <h2 className="font-pixel text-xl font-bold text-white tracking-widest">
              {gameOverInfo.winner === role ? "🏆 MATCH WON!" : "💀 MATCH LOST!"}
            </h2>
            <p className="font-pixel text-sm text-orbit-mint">
              FINAL SCORE: {gameOverInfo.scores.HOST} - {gameOverInfo.scores.PEER}
            </p>
            <button
              onClick={onPlayAgain}
              className="py-2.5 px-6 bg-orbit-accent hover:bg-violet-600 text-white font-pixel text-xs rounded-boxy border-2 border-white shadow-arcade hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
