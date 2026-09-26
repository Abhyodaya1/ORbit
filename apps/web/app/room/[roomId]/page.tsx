"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { usewebRTC as useWebRTC } from "@/useWebRTC";
import VideoTile from "@/components/VideoTile";
import GamePanel from "@/components/GamePanel";
import EmojiRow from "@/components/EmojiRow";
import ChatBar from "@/components/ChatBar";
import { Copy, Sparkles, ArrowLeft, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [role, setRole] = useState<"HOST" | "PEER" | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Live presence state from server
  const [presence, setPresence] = useState({
    hostConnected: false,
    peerConnected: false,
  });

  // 1. Authenticate & Join the Room via our API
  useEffect(() => {
    async function initRoom() {
      try {
        const storedToken = localStorage.getItem(`orbit_token_${roomId}`);

        // Call our Join endpoint to verify room and claim slot
        const res = await fetch(`/room/${roomId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: storedToken }),
        });

        const data = await res.json();

        if (!data.success) {
          setErrorMessage(data.error || "Unable to join room");
          return;
        }

        // Save our verified token in localStorage
        localStorage.setItem(`orbit_token_${roomId}`, data.token);
        setToken(data.token);
        setRole(data.role);

        // 2. Connect to Socket.IO Signaling Server
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const socketInstance: Socket = io(`http://${host}:4000`);
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
          console.log(`🔌 Connected to signaling server, joining room: ${roomId}`);
          socketInstance.emit("join_room", {
            roomCode: roomId,
            token: data.token,
          });
        });

        // Server broadcasts live presence updates
        socketInstance.on("presence_update", (updatedPresence) => {
          console.log("👥 [Presence Update]:", updatedPresence);
          setPresence(updatedPresence);
        });

        return () => {
          socketInstance.disconnect();
        };
      } catch (err) {
        console.error("Room init failed:", err);
        setErrorMessage("Network error connecting to room");
      }
    }

    initRoom();
  }, [roomId]);

  // Is our partner currently in the room?
  const isPeerConnected = role === "HOST" ? presence.peerConnected : presence.hostConnected;

  // 3. Initialize WebRTC Hook
  const {
    localStream,
    remoteStream,
    connectionState,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
  } = useWebRTC({
    socket,
    roomCode: roomId,
    isHost: role === "HOST",
    isPeerConnected,
  });

const fullInviteUrl = `${window.location.origin}/room/${roomId}`;
navigator.clipboard.writeText(fullInviteUrl);

  // Copy Invite Link to Clipboard
   // Copy the complete clickable invite link to clipboard
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const fullInviteUrl = `${window.location.origin}/room/${roomId}`;
      navigator.clipboard.writeText(fullInviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };
  // If room is full or error occurred:
  if (errorMessage) {
    return (
      <main className="h-screen w-full arcade-grid-bg flex items-center justify-center p-6">
        <div className="bg-orbit-surface border-2 border-orbit-border rounded-boxy p-8 shadow-arcadeLg max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-orbit-coral mx-auto mb-3" />
          <h2 className="font-pixel text-lg font-bold text-orbit-text mb-2">
            ACCESS DENIED
          </h2>
          <p className="text-sm text-orbit-muted mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-orbit-accent hover:bg-violet-600 text-white font-pixel text-xs rounded-boxy border-2 border-orbit-border shadow-arcade"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen max-h-screen w-full arcade-grid-bg flex flex-col p-2.5 sm:p-4 md:p-6 overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcadeSm hover:bg-orbit-subsurface transition-colors"
            title="Back to Lobby"
          >
            <ArrowLeft className="w-4 h-4 text-orbit-text" />
          </Link>
          <div className="flex items-center gap-1.5">
            <h1 className="font-pixel text-base font-bold text-orbit-text">
              ORBIT
            </h1>
            <Sparkles className="w-4 h-4 text-orbit-accent" />
          </div>
        </div>

        {/* Room Code Badge & Copy Link Button */}
        <div className="flex items-center gap-2">
          <div className="bg-white border-2 border-orbit-border px-3 py-1 rounded-boxy shadow-arcadeSm flex items-center gap-2">
            <span className="font-pixel text-[10px] text-orbit-muted">ROOM:</span>
            <span className="font-pixel text-xs font-bold text-orbit-accent">
              {roomId}
            </span>
          </div>

                 {/* Room Code Badge & Copy Link Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="bg-white hover:bg-orbit-subsurface border-2 border-orbit-border px-3 py-1 rounded-boxy shadow-arcadeSm flex items-center gap-2 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="Click to copy full invite link"
          >
            <span className="font-pixel text-[10px] text-orbit-muted">ROOM:</span>
            <span className="font-pixel text-xs font-bold text-orbit-accent">
              {roomId}
            </span>
          </button>

          <button
            onClick={handleCopyLink}
            className="bg-orbit-surface hover:bg-orbit-subsurface border-2 border-orbit-border p-1.5 rounded-boxy shadow-arcadeSm text-orbit-text active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 text-xs font-semibold px-2.5"
            title="Copy Full Invite Link"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-orbit-mint" />
                <span className="text-[10px] text-orbit-mint font-pixel">LINK COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[10px] font-pixel">COPY LINK</span>
              </>
            )}
          </button>
        </div>
        </div>
      </header>

      {/* Main Responsive Grid/Flex Body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 mb-3">
        
        {/* Left Column: Stacked Video Tiles */}
        <section className="w-full lg:w-80 xl:w-96 flex flex-row lg:flex-col gap-3 flex-shrink-0 min-h-0">
          {/* Local User Video (V1) */}
          <VideoTile
            label={role === "HOST" ? "HOST (YOU)" : "PEER (YOU)"}
            stream={localStream}
            isLocal={true}
            status="connected"
            isMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
          />

          {/* Remote Partner Video (V2) */}
          <VideoTile
            label={role === "HOST" ? "PARTNER (PEER)" : "PARTNER (HOST)"}
            stream={remoteStream}
            isLocal={false}
            status={
              isPeerConnected
                ? connectionState === "connected"
                  ? "connected"
                  : "connecting"
                : "disconnected"
            }
             onCopyLink={handleCopyLink}
            isCopied={isCopied}
          />
        </section>

        {/* Right Column: Arcade Game Arena */}
        <section className="flex-1 flex flex-col min-h-0">
          <GamePanel />
        </section>
      </div>

      {/* Bottom Full-Width Bar: Emoji Strip + Chat Bar */}
      <footer className="w-full flex flex-col gap-2 flex-shrink-0">
        <EmojiRow />
        <ChatBar />
      </footer>
    </main>
  );
}