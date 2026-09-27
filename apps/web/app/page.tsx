"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Sparkles, Gamepad2, Video, Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import CosmicArcadeBackground from "@/components/CosmicArcadeBackground";

export default function Home() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const socket: Socket = io(`http://${host}:4000`, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 500,
    });

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

  // Handle Room Creation
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const res = await fetch("/api/invite", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create room");
      }

      // Store the stable hostToken in this browser's localStorage
      localStorage.setItem(`orbit_token_${data.code}`, data.hostToken);
      localStorage.setItem(`orbit_role_${data.code}`, "HOST");

      // Redirect host to their private room!
      router.push(`/room/${data.code}`);
    } catch (err) {
      console.error(err);
      alert("Could not create room. Please check your database connection!");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* 🌌 Dreamy Lavender & Baby Pink Cosmic Arcade Background with Animated Planets & Stars */}
      <CosmicArcadeBackground />

      {/* 🎮 Central Tactile Arcade Console Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border-2 border-orbit-border rounded-boxy p-6 sm:p-8 shadow-arcadeLg max-w-md w-full transition-all">
        {/* Header with Pixel Title */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <Gamepad2 className="w-8 h-8 text-orbit-accent" />
          <h1 className="font-pixel text-3xl sm:text-4xl font-bold tracking-wider text-orbit-text">
            ORBIT
          </h1>
          <Sparkles className="w-6 h-6 text-orbit-arcadeYellow animate-bounce" />
        </div>

        <p className="text-orbit-muted text-xs sm:text-sm font-medium mb-6 text-center leading-relaxed">
          A cozy, private 2-person space for video calls &amp; synced games
        </p>

        {/* Real-time Connection Badge */}
        <div className="bg-orbit-subsurface/80 border-2 border-orbit-border rounded-boxy p-3.5 mb-5 shadow-arcadeSm">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[11px] tracking-wider text-orbit-text">
              SIGNALING STATUS:
            </span>
            <span
              className={`font-pixel text-[10px] px-2 py-0.5 rounded border border-orbit-border flex items-center gap-1.5 ${
                isConnected ? "bg-orbit-mint text-white" : "bg-orbit-coral text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {socketId && (
            <p className="text-[10px] text-orbit-muted font-mono mt-1.5 truncate text-left">
              Session: {socketId}
            </p>
          )}
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white hover:bg-pink-50/50 transition-colors border-2 border-orbit-border rounded-boxy p-3 flex items-center gap-2 shadow-arcadeSm">
            <Video className="w-4 h-4 text-orbit-accent flex-shrink-0" />
            <span className="text-xs font-semibold text-orbit-text">1:1 WebRTC Video</span>
          </div>
          <div className="bg-white hover:bg-violet-50/50 transition-colors border-2 border-orbit-border rounded-boxy p-3 flex items-center gap-2 shadow-arcadeSm">
            <Heart className="w-4 h-4 text-orbit-coral flex-shrink-0" />
            <span className="text-xs font-semibold text-orbit-text">5 Synced Games</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full py-4 px-5 bg-orbit-accent hover:bg-violet-600 disabled:opacity-50 text-white font-pixel text-xs sm:text-sm tracking-wider rounded-boxy border-2 border-orbit-border shadow-arcade hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-arcadeSm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>GENERATING ROOM...</span>
            </>
          ) : (
            <span>CREATE PRIVATE ROOM 🚀</span>
          )}
        </button>
      </div>
    </main>
  );
}