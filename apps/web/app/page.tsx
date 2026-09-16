"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Sparkles, Gamepad2, Video, Heart } from "lucide-react";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:4000");

    socket.on("connect", () => {
      setIsConnected(true);
      setSocketId(socket.id || null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setSocketId(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="min-h-screen arcade-grid-bg flex flex-col items-center justify-center p-6">
      <div className="bg-orbit-surface border-2 border-orbit-border rounded-boxy p-8 shadow-arcadeLg max-w-lg w-full transition-all">
        
        {/* Header with Pixel Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gamepad2 className="w-8 h-8 text-orbit-accent" />
          <h1 className="font-pixel text-3xl font-bold tracking-wider text-orbit-text">
            ORBIT
          </h1>
          <Sparkles className="w-6 h-6 text-orbit-arcadeYellow animate-bounce" />
        </div>
        
        <p className="text-orbit-muted text-sm font-medium mb-6 text-center">
          A cozy, private 2-person space for video calls &amp; synced games
        </p>

        {/* Real-time Connection Badge */}
        <div className="bg-orbit-subsurface border-2 border-orbit-border rounded-boxy p-4 mb-6 shadow-arcadeSm">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-xs tracking-wider text-orbit-text">
              SIGNALING STATUS:
            </span>
            <span
              className={`font-pixel text-xs px-2 py-1 rounded border border-orbit-border flex items-center gap-1.5 ${
                isConnected
                  ? "bg-orbit-mint text-white"
                  : "bg-orbit-coral text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {socketId && (
            <p className="text-xs text-orbit-muted font-mono mt-2 truncate text-left">
              Session Socket: {socketId}
            </p>
          )}
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border-2 border-orbit-border rounded-boxy p-3 flex items-center gap-2.5 shadow-arcadeSm">
            <Video className="w-5 h-5 text-orbit-accent" />
            <span className="text-xs font-semibold">1:1 Video Call</span>
          </div>
          <div className="bg-white border-2 border-orbit-border rounded-boxy p-3 flex items-center gap-2.5 shadow-arcadeSm">
            <Heart className="w-5 h-5 text-orbit-coral" />
            <span className="text-xs font-semibold">5 Synced Games</span>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full py-3.5 px-4 bg-orbit-accent hover:bg-violet-600 text-white font-pixel text-sm tracking-wider rounded-boxy border-2 border-orbit-border shadow-arcade hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-arcadeSm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
          CREATE PRIVATE ROOM
        </button>
      </div>
    </main>
  );
}