"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Copy, Check } from "lucide-react";

interface VideoTileProps {
  label: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  status: "connected" | "connecting" | "disconnected";
  isMuted?: boolean;
  isVideoMuted?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onCopyLink?: () => void;
  isCopied?: boolean;
}

export default function VideoTile({
  label,
  stream,
  isLocal = false,
  status,
  isMuted = false,
  isVideoMuted = false,
  onToggleAudio,
  onToggleVideo,
  onCopyLink,
  isCopied = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Plug the live MediaStream into the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex-1 w-full bg-[#1e1935] border-2 border-orbit-border rounded-boxy shadow-arcadeSm overflow-hidden flex flex-col justify-between p-2.5 min-h-[150px] sm:min-h-[180px] lg:min-h-0 aspect-video sm:aspect-[4/3] lg:aspect-auto">
      {/* ── Retro Arcade Monitor Corner Brackets ── */}
      <span className="absolute top-1 left-1.5 font-mono text-[9px] text-white/30 select-none z-20 pointer-events-none">
        ⌜
      </span>
      <span className="absolute top-1 right-1.5 font-mono text-[9px] text-white/30 select-none z-20 pointer-events-none">
        ⌝
      </span>
      <span className="absolute bottom-1 left-1.5 font-mono text-[9px] text-white/30 select-none z-20 pointer-events-none">
        ⌞
      </span>
      <span className="absolute bottom-1 right-1.5 font-mono text-[9px] text-white/30 select-none z-20 pointer-events-none">
        ⌟
      </span>

      {/* ── 1. Top Bar: Player Badge & Controls ── */}
      <div className="flex items-center justify-between z-10 gap-1.5">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-boxy shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected"
                ? "bg-orbit-mint animate-pulse"
                : status === "connecting"
                ? "bg-orbit-arcadeYellow animate-bounce"
                : "bg-orbit-coral"
            }`}
          />
          <span className="font-pixel text-[10px] font-bold tracking-wide text-white">
            {label}
          </span>
        </div>

        {/* Local Hardware Controls (Mic / Camera) */}
        {isLocal && (
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/20 p-0.5 rounded-boxy shadow-sm">
            <button
              onClick={onToggleAudio}
              className={`p-1 rounded transition-colors ${
                isMuted
                  ? "bg-orbit-coral text-white"
                  : "text-white hover:bg-white/20"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onToggleVideo}
              className={`p-1 rounded transition-colors ${
                isVideoMuted
                  ? "bg-orbit-coral text-white"
                  : "text-white hover:bg-white/20"
              }`}
              title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoMuted ? (
                <VideoOff className="w-3.5 h-3.5" />
              ) : (
                <Video className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Screen: Live Video Feed OR Arcade Waiting Screen ── */}
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Avoid feedback screech
            className={`absolute inset-0 w-full h-full object-cover z-0 ${
              isLocal ? "scale-x-[-1]" : "" // Natural webcam mirror
            }`}
          />
          {/* Subtle CRT Scanline Shader */}
          <div
            className="absolute inset-0 pointer-events-none z-[1] opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
              backgroundSize: "100% 4px",
            }}
          />
        </>
      ) : (
        /* Arcade Standby Screen */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151226] p-4 text-center z-0">
          <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 mb-2">
            <Video className="w-4 h-4" />
          </div>
          <p className="font-pixel text-[9px] text-white/70 tracking-wider uppercase mb-2">
            {isLocal ? "STARTING CAMERA..." : "WAITING FOR PARTNER..."}
          </p>

          {!isLocal && onCopyLink && (
            <button
              onClick={onCopyLink}
              className="bg-orbit-accent hover:bg-violet-600 text-white border-2 border-orbit-border px-3 py-1.5 rounded-boxy shadow-arcadeSm text-[9px] font-pixel active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 z-10"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-orbit-mint" />
                  <span>COPIED LINK! ✨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>INVITE PARTNER</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── 3. Bottom Corner Tag ── */}
      <div className="z-10 flex justify-between items-end">
        <span className="text-[9px] font-pixel text-white/40 tracking-widest uppercase">
          {isLocal ? "CH-01" : "CH-02"}
        </span>
        <span className="text-[9px] font-pixel text-white/90 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/20">
          {isLocal ? "YOU" : "PARTNER"}
        </span>
      </div>
    </div>
  );
}