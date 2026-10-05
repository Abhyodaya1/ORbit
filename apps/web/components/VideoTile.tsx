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
    <div className="relative flex-1 w-full bg-[#181428] border-[3px] border-orbit-border rounded-boxy shadow-arcade overflow-hidden flex flex-col justify-between p-2.5 min-h-[150px] sm:min-h-[180px] lg:min-h-0 aspect-video sm:aspect-[4/3] lg:aspect-auto">
      {/* ── Retro Arcade Monitor Corner Brackets ── */}
      <span className="absolute top-1.5 left-2 font-mono text-xs font-bold text-white/40 select-none z-20 pointer-events-none">
        ⌜
      </span>
      <span className="absolute top-1.5 right-2 font-mono text-xs font-bold text-white/40 select-none z-20 pointer-events-none">
        ⌝
      </span>
      <span className="absolute bottom-1.5 left-2 font-mono text-xs font-bold text-white/40 select-none z-20 pointer-events-none">
        ⌞
      </span>
      <span className="absolute bottom-1.5 right-2 font-mono text-xs font-bold text-white/40 select-none z-20 pointer-events-none">
        ⌟
      </span>

      {/* ── 1. Top Bar: Player Badge & Controls ── */}
      <div className="flex items-center justify-between z-10 gap-1.5">
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md border-2 border-orbit-border px-2.5 py-1 rounded-boxy shadow-arcadeSm">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected"
                ? "bg-orbit-mint animate-pulse"
                : status === "connecting"
                ? "bg-orbit-arcadeYellow animate-bounce"
                : "bg-orbit-coral"
            }`}
          />
          <span className="font-pixel text-pixel-xs font-bold tracking-pixel-wide text-white pt-0.5 leading-none">
            {label}
          </span>
        </div>

        {/* Local Hardware Controls (Mic / Camera Rockers) */}
        {isLocal && (
          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md border-2 border-orbit-border p-1 rounded-boxy shadow-arcadeSm">
            <button
              onClick={onToggleAudio}
              className={`h-7 w-7 rounded border-2 border-orbit-border flex items-center justify-center shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none active:scale-[0.95] transition-[transform,box-shadow,background-color] duration-150 cursor-pointer ${
                isMuted
                  ? "bg-orbit-coral text-white"
                  : "bg-white text-orbit-border hover:bg-orbit-subsurface"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
            <button
              onClick={onToggleVideo}
              className={`h-7 w-7 rounded border-2 border-orbit-border flex items-center justify-center shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none active:scale-[0.95] transition-[transform,box-shadow,background-color] duration-150 cursor-pointer ${
                isVideoMuted
                  ? "bg-orbit-coral text-white"
                  : "bg-white text-orbit-border hover:bg-orbit-subsurface"
              }`}
              title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoMuted ? (
                <VideoOff className="w-3.5 h-3.5" />
              ) : (
                <Video className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Screen: Live Video Feed OR Arcade Standby Screen ── */}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141124] p-4 text-center z-0">
          <div className="w-10 h-10 rounded-boxy border-2 border-dashed border-white/40 flex items-center justify-center text-white/60 mb-2.5 bg-black/30 shadow-inner">
            <Video className="w-5 h-5" />
          </div>
          <p className="font-pixel text-pixel-xs text-white/80 tracking-pixel-wide uppercase mb-3 pt-0.5 leading-tight">
            {isLocal ? "STARTING CAMERA..." : "WAITING FOR PARTNER..."}
          </p>

          {!isLocal && onCopyLink && (
            <button
              onClick={onCopyLink}
              className="h-9 px-4 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white border-2 border-orbit-border rounded-boxy shadow-arcade hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcadeLg active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-[0.98] transition-[transform,box-shadow,background-color] duration-150 flex items-center gap-2 font-pixel text-pixel-xs tracking-pixel-wide pt-0.5 leading-none cursor-pointer z-10"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-orbit-mint stroke-[3]" />
                  <span>COPIED LINK! ✨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>INVITE PARTNER</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── 3. Bottom Corner Tag ── */}
      <div className="z-10 flex justify-between items-end">
        <span className="text-telemetry font-mono text-white/50 tracking-pixel-wide uppercase">
          {isLocal ? "CH-01" : "CH-02"}
        </span>
        <span className="font-pixel text-pixel-tag text-white bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 pt-0.5 leading-none">
          {isLocal ? "YOU" : "PARTNER"}
        </span>
      </div>
    </div>
  );
}