"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useState } from "react";

interface VideoTileProps {
  label: string;
  isLocal?: boolean;
  status: "connected" | "connecting" | "disconnected";
}

export default function VideoTile({
  label,
  isLocal = false,
  status,
}: VideoTileProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  return (
    <div className="relative flex-1 w-full bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcadeSm overflow-hidden flex flex-col justify-between p-3 min-h-[140px] md:min-h-0">
      
      {/* Top Bar: Player Label + Real-Time Presence Indicator */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-orbit-border px-2.5 py-1 rounded-boxy shadow-sm">
          {/* Glowing Status Dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === "connected"
                ? "bg-orbit-mint animate-pulse"
                : status === "connecting"
                ? "bg-orbit-arcadeYellow animate-bounce"
                : "bg-orbit-coral"
            }`}
          />
          <span className="font-pixel text-[11px] font-bold tracking-wide text-orbit-text">
            {label}
          </span>
        </div>

        {/* Media Controls for Local User */}
        {isLocal && (
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-orbit-border p-1 rounded-boxy">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded hover:bg-orbit-subsurface transition-colors ${
                isMuted ? "text-orbit-coral" : "text-orbit-text"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsCameraOff(!isCameraOff)}
              className={`p-1.5 rounded hover:bg-orbit-subsurface transition-colors ${
                isCameraOff ? "text-orbit-coral" : "text-orbit-text"
              }`}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Camera Video Placeholder (will hold <video> stream in Phase 3) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-orbit-subsurface/40">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-orbit-border flex items-center justify-center text-orbit-muted">
          <Video className="w-6 h-6" />
        </div>
        <p className="font-pixel text-[10px] text-orbit-muted mt-2 tracking-wider uppercase">
          {status === "connected" ? "Live Camera" : "Waiting for stream..."}
        </p>
      </div>

      {/* Bottom tag */}
      <div className="z-10 text-right">
        <span className="text-[10px] font-semibold text-orbit-muted bg-white/80 px-2 py-0.5 rounded border border-orbit-borderMuted">
          {isLocal ? "YOU" : "PARTNER"}
        </span>
      </div>
    </div>
  );
}