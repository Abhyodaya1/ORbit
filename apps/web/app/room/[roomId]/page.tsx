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

    // Floating reactions array
  const [reactions, setReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // Live presence state from server
  const [presence, setPresence] = useState({
    hostConnected: false,
    peerConnected: false,
  });

  // 1. Authenticate & Join the Room via our API
  useEffect(() => {
    let isCancelled = false;
    let socketInstance: Socket | null = null;

    async function initRoom() {
      try {
        // Read tab-isolated sessionStorage first so tabs on the same browser have independent identities
        const storedToken =
          sessionStorage.getItem(`orbit_token_${roomId}`) ||
          localStorage.getItem(`orbit_token_${roomId}`);

        // Call our Join endpoint to verify room and claim slot
        const res = await fetch(`/room/${roomId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: storedToken }),
        });

        const data = await res.json();

        if (isCancelled) return;

        if (!data.success) {
          setErrorMessage(data.error || "Unable to join room");
          return;
        }

        // Save verified token in this tab's sessionStorage and localStorage
        sessionStorage.setItem(`orbit_token_${roomId}`, data.token);
        sessionStorage.setItem(`orbit_role_${roomId}`, data.role);
        localStorage.setItem(`orbit_token_${roomId}`, data.token);
        setToken(data.token);
        setRole(data.role);

        // 2. Connect to Socket.IO Signaling Server
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        socketInstance = io(`http://${host}:4000`, {
          transports: ["websocket"],
          reconnectionDelay: 500,
        });

        if (isCancelled) {
          socketInstance.disconnect();
          return;
        }

        setSocket(socketInstance);

        socketInstance.on("connect", () => {
          console.log(`🔌 Connected to signaling server, joining room: ${roomId}`);
          socketInstance?.emit("join_room", {
            roomCode: roomId,
            token: data.token,
          });
        });

        // Server broadcasts live presence updates
        socketInstance.on("presence_update", (updatedPresence) => {
          console.log("👥 [Presence Update]:", updatedPresence);
          setPresence(updatedPresence);
        });

        // Real-time floating emoji listener with guaranteed unique React keys
        socketInstance.on("emoji_reaction", ({ emoji, id }) => {
          const uniqueId = `${id || Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const randomLeft = Math.floor(Math.random() * 70) + 15; // 15% to 85% of screen width

          setReactions((prev) => {
            if (prev.some((r) => r.id === uniqueId)) return prev;
            return [...prev, { id: uniqueId, emoji, left: randomLeft }];
          });

          // Auto garbage-collect after 2.2s animation finishes
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== uniqueId));
          }, 2200);
        });
      } catch (err) {
        if (isCancelled) return;
        console.error("Room init failed:", err);
        setErrorMessage("Network error connecting to room");
      }
    }

    initRoom();

    return () => {
      isCancelled = true;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [roomId]);

  // Is our partner currently in the room?
  const isPeerConnected = role === "HOST" ? presence.peerConnected : presence.hostConnected;

    const handleSendEmoji = (emoji: string) => {
    if (!socket) return;
    socket.emit("send_reaction", { roomCode: roomId, emoji });
  };
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
      <main className="h-screen w-full arcade-grid-bg flex items-center justify-center p-6 selection:bg-orbit-accent selection:text-white">
        <div className="relative bg-white border-[3px] border-orbit-border rounded-boxy p-8 shadow-arcadeLg max-w-md w-full text-center">
          {/* Rivets */}
          <span className="absolute top-2 left-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
          <span className="absolute top-2 right-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
          <span className="absolute bottom-2 left-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
          <span className="absolute bottom-2 right-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>

          <div className="w-14 h-14 bg-orbit-coral/15 border-2 border-orbit-border rounded-boxy mx-auto mb-4 flex items-center justify-center shadow-arcadeSm">
            <AlertCircle className="w-7 h-7 text-orbit-coral" />
          </div>

          <h2 className="font-pixel text-display-title font-bold text-orbit-text mb-2 pt-0.5 leading-tight">
            ACCESS DENIED
          </h2>
          <p className="text-sm font-sans text-orbit-muted font-medium mb-6 leading-arcade-normal">
            {errorMessage}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-[3px] border-orbit-border shadow-arcade hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcadeLg active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-[0.99] transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center pt-0.5 leading-none cursor-pointer"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen lg:h-screen lg:max-h-screen w-full arcade-grid-bg flex flex-col p-2.5 sm:p-3 md:p-4 overflow-y-auto lg:overflow-hidden selection:bg-orbit-accent selection:text-white">
      {/* ── Top Header Bar ── */}
      <header className="flex items-center justify-between pb-2.5 sm:pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            onClick={(e) => {
              if (!window.confirm("Leave Orbit room and return to lobby?")) {
                e.preventDefault();
              }
            }}
            className="h-9 w-9 bg-white border-2 border-orbit-border rounded-boxy shadow-arcadeSm hover:bg-orbit-subsurface hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none active:scale-[0.96] transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center"
            title="Leave Room"
          >
            <ArrowLeft className="w-4 h-4 text-orbit-text stroke-[2.5]" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-pixel text-lg sm:text-xl font-bold tracking-pixel-wide text-orbit-text pt-0.5 leading-none">
              ORBIT
            </h1>
            <Sparkles className="w-4 h-4 text-orbit-accent animate-pulse" />
          </div>
        </div>

        {/* Room Code Badge & Copy Link Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="h-9 px-3 bg-white hover:bg-orbit-subsurface border-2 border-orbit-border rounded-boxy shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center gap-1.5 cursor-pointer"
            title="Click to copy full invite link"
          >
            <span className="font-pixel text-pixel-tag text-orbit-muted tracking-pixel-wide pt-0.5 leading-none">
              ROOM:
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-orbit-accent tracking-pixel-snug leading-none">
              {roomId}
            </span>
          </button>

          <button
            onClick={handleCopyLink}
            className="h-9 px-3 sm:px-3.5 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white border-2 border-orbit-border rounded-boxy shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center gap-1.5 cursor-pointer pt-0.5"
            title="Copy Full Invite Link"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-orbit-mint stroke-[3]" />
                <span className="font-pixel text-pixel-tag text-white tracking-pixel-wide uppercase leading-none hidden sm:inline">
                  COPIED!
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-pixel text-pixel-tag text-white tracking-pixel-wide uppercase leading-none hidden sm:inline">
                  INVITE
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Responsive Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2.5 sm:gap-3 min-h-0 mb-2.5 sm:mb-3">
        {/* Left Column: Stacked Definite-Rectangle Video Tiles */}
        <section className="w-full lg:w-72 xl:w-80 2xl:w-96 flex flex-row lg:flex-col gap-2.5 sm:gap-3 flex-shrink-0 min-h-0">
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
          <GamePanel
            socket={socket}
            roomCode={roomId}
            token={token}
            role={role}
          />
        </section>
      </div>

      {/* ── Bottom Full-Width Bar: Emoji Strip + Chat Bar ── */}
      <footer className="w-full flex flex-col gap-2 flex-shrink-0">
        <EmojiRow onSendEmoji={handleSendEmoji} />
        <ChatBar
          socket={socket}
          roomCode={roomId}
          token={token}
          role={role}
        />
      </footer>

      {/* 🎈 Global Floating Emoji Reaction Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.left}%`, bottom: "85px" }}
            className="absolute text-4xl select-none animate-float-up"
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </main>
  );
}