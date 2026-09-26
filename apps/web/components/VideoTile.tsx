"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

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

  // Plug the live MediaStream firehose into the <video> element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex-1 w-full bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcadeSm overflow-hidden flex flex-col justify-between p-3 min-h-[160px] md:min-h-0">
      
      {/* 1. Top Bar: Player Badge & Live Presence Indicator */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-orbit-border px-2.5 py-1 rounded-boxy shadow-sm">
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

        {/* 2. Hardware Mute/Camera Controls for Local User */}
        {isLocal && (
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-orbit-border p-1 rounded-boxy shadow-sm">
            <button
              onClick={onToggleAudio}
              className={`p-1.5 rounded hover:bg-orbit-subsurface transition-colors ${
                isMuted ? "text-orbit-coral" : "text-orbit-text"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggleVideo}
              className={`p-1.5 rounded hover:bg-orbit-subsurface transition-colors ${
                isVideoMuted ? "text-orbit-coral" : "text-orbit-text"
              }`}
              title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoMuted ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 3. Real HTML Video Element OR Waiting Placeholder */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // CRITICAL: Mute local to avoid audio feedback screech!
          className={`absolute inset-0 w-full h-full object-cover ${
            isLocal ? "scale-x-[-1]" : "" // Mirror effect for local webcam
          }`}
        />
      ) : (
        /* Placeholder when stream is not active */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-orbit-subsurface/60 p-4 text-center z-0">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-orbit-border flex items-center justify-center text-orbit-muted mb-2">
            <Video className="w-5 h-5" />
          </div>
          <p className="font-pixel text-[10px] text-orbit-muted tracking-wider uppercase mb-2">
            {isLocal ? "Starting Camera..." : "Waiting for partner..."}
          </p>

          {/* Clickable button directly inside partner's video box! */}
          {!isLocal && onCopyLink && (
            <button
              onClick={onCopyLink}
              className="bg-white hover:bg-orbit-subsurface border-2 border-orbit-border px-3 py-1.5 rounded-boxy shadow-arcadeSm text-[10px] font-pixel text-orbit-accent active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 z-10"
            >
              {isCopied ? "COPIED FULL LINK! ✨" : "📋 COPY INVITE LINK"}
            </button>
          )}
        </div>
      )}

      {/* 4. Bottom Corner Badge */}
      <div className="z-10 text-right">
        <span className="text-[10px] font-semibold text-orbit-muted bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded border border-orbit-borderMuted">
          {isLocal ? "YOU" : "PARTNER"}
        </span>
      </div>
    </div>
  );
}