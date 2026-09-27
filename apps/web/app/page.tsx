"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Sparkles,
  Gamepad2,
  Video,
  Heart,
  Loader2,
  Copy,
  Check,
  Mail,
  Send,
  ExternalLink,
  Shield,
  Zap,
  Activity,
  ArrowRight,
  Flame,
  Star,
  Users,
  Terminal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CosmicArcadeBackground from "@/components/CosmicArcadeBackground";

export default function Home() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const DEVELOPER_EMAIL = "abhyodayasingh00@gmail.com";

  useEffect(() => {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
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

  // 1. Create a New Room (Host Flow)
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const res = await fetch("/api/invite", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create room");
      }

      // Store the stable hostToken in this browser tab's sessionStorage
      sessionStorage.setItem(`orbit_token_${data.code}`, data.hostToken);
      sessionStorage.setItem(`orbit_role_${data.code}`, "HOST");
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

  // 2. Join Existing Room by Code
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim().toLowerCase();
    if (!clean) return;
    setIsJoining(true);

    // Deliberate peer join: purge any old host token in this tab
    sessionStorage.removeItem(`orbit_token_${clean}`);
    sessionStorage.removeItem(`orbit_role_${clean}`);
    localStorage.removeItem(`orbit_token_${clean}`);
    localStorage.removeItem(`orbit_role_${clean}`);

    router.push(`/room/${clean}`);
  };

  // 3. Copy Email to Clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(DEVELOPER_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 overflow-x-hidden">
      {/* 🌌 Dreamy Lavender & Baby Pink Cosmic Arcade Background with Animated Planets & Stars */}
      <CosmicArcadeBackground />

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center gap-8 py-6">
        
        {/* ── TOP BADGE: REALTIME ENGINE STATUS ── */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-2 border-orbit-border px-3.5 py-1.5 rounded-full shadow-arcadeSm text-xs font-semibold text-orbit-text animate-in fade-in slide-in-from-top-4 duration-500">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? "bg-orbit-mint animate-pulse" : "bg-orbit-coral"
            }`}
          />
          <span className="font-pixel text-[11px] tracking-wide">
            {isConnected ? "WEBSOCKET ENGINE ONLINE" : "CONNECTING TO SIGNALING..."}
          </span>
          <span className="text-orbit-borderMuted">•</span>
          <span className="text-[11px] text-orbit-muted font-mono">v1.0-PROD</span>
        </div>

        {/* ── HERO BANNER: BRAND & INTRO ── */}
        <div className="text-center flex flex-col items-center max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2.5 bg-orbit-accent/10 border-2 border-orbit-border rounded-boxy shadow-arcadeSm">
              <Gamepad2 className="w-8 h-8 text-orbit-accent animate-pulse" />
            </div>
            <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl font-black tracking-wider text-orbit-text drop-shadow-sm">
              ORBIT
            </h1>
            <Sparkles className="w-7 h-7 text-orbit-arcadeYellow animate-bounce" />
          </div>

          <p className="text-base sm:text-lg font-bold text-orbit-text mt-1 mb-2 tracking-tight">
            The Cozy Two-Player Virtual Living Room
          </p>

          <p className="text-orbit-muted text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
            Ultra-low latency 1:1 encrypted video calls, collaborative whiteboard,
            and 5 synchronized real-time games. No accounts, no downloads, zero friction.
          </p>
        </div>

        {/* ── CENTRAL TACTILE ARCADE CONSOLE CARD ── */}
        <div className="bg-white/95 backdrop-blur-md border-2 border-orbit-border rounded-boxy p-6 sm:p-8 shadow-arcadeLg max-w-lg w-full transition-all">
          
          {/* Header Status Inside Card */}
          <div className="bg-orbit-subsurface/80 border-2 border-orbit-border rounded-boxy p-3.5 mb-5 shadow-arcadeSm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orbit-accent" />
              <span className="font-pixel text-[11px] tracking-wider text-orbit-text">
                SIGNALING STATUS:
              </span>
            </div>
            <span
              className={`font-pixel text-[10px] px-2.5 py-0.5 rounded border border-orbit-border flex items-center gap-1.5 ${
                isConnected ? "bg-orbit-mint text-white" : "bg-orbit-coral text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {/* Primary Action Button (Host Room) */}
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full py-4 px-5 bg-orbit-accent hover:bg-violet-600 disabled:opacity-50 text-white font-pixel text-xs sm:text-sm tracking-wider rounded-boxy border-2 border-orbit-border shadow-arcade hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-arcadeSm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SPAWNING PRIVATE ROOM...</span>
              </>
            ) : (
              <>
                <span>CREATE PRIVATE ROOM</span>
                <span className="text-base">🚀</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-[2px] bg-orbit-borderMuted" />
            <span className="font-pixel text-[10px] text-orbit-muted tracking-wider">
              OR JOIN EXISTING
            </span>
            <div className="flex-1 h-[2px] bg-orbit-borderMuted" />
          </div>

          {/* Join with Code Form */}
          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. cozy-pikachu-42"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="flex-1 bg-orbit-bg border-2 border-orbit-border rounded-boxy px-3.5 py-2.5 text-xs sm:text-sm font-mono text-orbit-text placeholder:text-orbit-muted/70 focus:outline-none focus:ring-2 focus:ring-orbit-accent"
            />
            <button
              type="submit"
              disabled={isJoining || !joinCodeInput.trim()}
              className="px-4 py-2.5 bg-white hover:bg-orbit-subsurface disabled:opacity-50 text-orbit-text font-pixel text-xs tracking-wider border-2 border-orbit-border rounded-boxy shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
            >
              {isJoining ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>JOIN</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orbit-accent" />
                </>
              )}
            </button>
          </form>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t-2 border-orbit-borderMuted/60">
            <div className="bg-white/80 hover:bg-pink-50/50 transition-colors border-2 border-orbit-border rounded-boxy p-2.5 flex items-center gap-2 shadow-arcadeSm">
              <Video className="w-4 h-4 text-orbit-accent flex-shrink-0" />
              <span className="text-[11px] font-semibold text-orbit-text">
                1:1 WebRTC Video
              </span>
            </div>
            <div className="bg-white/80 hover:bg-violet-50/50 transition-colors border-2 border-orbit-border rounded-boxy p-2.5 flex items-center gap-2 shadow-arcadeSm">
              <Heart className="w-4 h-4 text-orbit-coral flex-shrink-0" />
              <span className="text-[11px] font-semibold text-orbit-text">
                5 Synced Games
              </span>
            </div>
          </div>
        </div>

        {/* ── THE 5 ARCADE EXPERIENCES SHOWCASE ── */}
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Flame className="w-4 h-4 text-orbit-coral" />
            <h2 className="font-pixel text-xs sm:text-sm tracking-wider text-orbit-text uppercase">
              Synchronized 2-Player Arcade Lineup
            </h2>
            <Flame className="w-4 h-4 text-orbit-coral" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Game 1: Pong */}
            <div className="bg-white/90 border-2 border-orbit-border rounded-boxy p-4 shadow-arcadeSm hover:shadow-arcade transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🏓</span>
                  <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded">
                    60 FPS RAF
                  </span>
                </div>
                <h3 className="font-bold text-sm text-orbit-text mb-1">
                  Retro Pong Canvas
                </h3>
                <p className="text-xs text-orbit-muted leading-relaxed">
                  Decoupled HTML5 canvas engine with 0ms client prediction and 30Hz network sync.
                </p>
              </div>
            </div>

            {/* Game 2: Celebrity Mystery */}
            <div className="bg-white/90 border-2 border-orbit-border rounded-boxy p-4 shadow-arcadeSm hover:shadow-arcade transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🎭</span>
                  <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-purple-100 border border-purple-300 text-purple-800 rounded">
                    WIKI CACHED
                  </span>
                </div>
                <h3 className="font-bold text-sm text-orbit-text mb-1">
                  Celebrity Mystery
                </h3>
                <p className="text-xs text-orbit-muted leading-relaxed">
                  Co-op 20-questions guessing game with live pre-warmed Wikipedia portrait lookups.
                </p>
              </div>
            </div>

            {/* Game 3: Infinite Whiteboard */}
            <div className="bg-white/90 border-2 border-orbit-border rounded-boxy p-4 shadow-arcadeSm hover:shadow-arcade transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🎨</span>
                  <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded">
                    LOW LATENCY
                  </span>
                </div>
                <h3 className="font-bold text-sm text-orbit-text mb-1">
                  Collaborative Canvas
                </h3>
                <p className="text-xs text-orbit-muted leading-relaxed">
                  Real-time freehand brush strokes and instant board synchronization.
                </p>
              </div>
            </div>

            {/* Game 4: Tic-Tac-Toe */}
            <div className="bg-white/90 border-2 border-orbit-border rounded-boxy p-4 shadow-arcadeSm hover:shadow-arcade transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">❌⭕</span>
                  <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 rounded">
                    TURN BASED
                  </span>
                </div>
                <h3 className="font-bold text-sm text-orbit-text mb-1">
                  Tic-Tac-Toe Duel
                </h3>
                <p className="text-xs text-orbit-muted leading-relaxed">
                  Server-authoritative state matrix with instant win-line detection and streaks.
                </p>
              </div>
            </div>

            {/* Game 5: Would You Rather */}
            <div className="bg-white/90 border-2 border-orbit-border rounded-boxy p-4 shadow-arcadeSm hover:shadow-arcade transition-all flex flex-col justify-between sm:col-span-2 lg:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-sky-100 border border-sky-300 text-sky-800 rounded">
                    ICE BREAKER
                  </span>
                </div>
                <h3 className="font-bold text-sm text-orbit-text mb-1">
                  Would You Rather &amp; Dilemmas
                </h3>
                <p className="text-xs text-orbit-muted leading-relaxed">
                  Synchronized choice reveal mechanism designed to spark lively late-night debates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ENGINEERING & ARCHITECTURE SPECS ── */}
        <div className="w-full max-w-3xl bg-orbit-subsurface/60 border-2 border-orbit-border rounded-boxy p-5 shadow-arcadeSm">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-orbit-accent" />
            <h3 className="font-pixel text-[11px] tracking-wider text-orbit-text uppercase">
              Production Architecture Highlights
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/90 border border-orbit-border rounded p-2.5">
              <span className="font-bold text-orbit-text block">⚡ Sub-15ms</span>
              <span className="text-[10px] text-orbit-muted">WebSocket Latency</span>
            </div>
            <div className="bg-white/90 border border-orbit-border rounded p-2.5">
              <span className="font-bold text-orbit-text block">🛡️ Token Bucket</span>
              <span className="text-[10px] text-orbit-muted">Sliding Rate Limiter</span>
            </div>
            <div className="bg-white/90 border border-orbit-border rounded p-2.5">
              <span className="font-bold text-orbit-text block">🧹 Auto-Reaper</span>
              <span className="text-[10px] text-orbit-muted">Cascade Ghost Sweeper</span>
            </div>
            <div className="bg-white/90 border border-orbit-border rounded p-2.5">
              <span className="font-bold text-orbit-text block">🔒 WebRTC Mesh</span>
              <span className="text-[10px] text-orbit-muted">Encrypted P2P Media</span>
            </div>
          </div>
        </div>

        {/* ── DEVELOPER CONTACT & FEEDBACK SECTION ── */}
        <div className="w-full max-w-3xl bg-white/95 border-2 border-orbit-border rounded-boxy p-6 sm:p-7 shadow-arcade transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Developer Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-boxy bg-orbit-accent text-white flex items-center justify-center font-pixel text-lg font-bold border-2 border-orbit-border shadow-arcadeSm flex-shrink-0">
                AS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-orbit-text">
                    Abhyodaya Singh
                  </h4>
                  <span className="font-pixel text-[9px] px-2 py-0.5 bg-orbit-subsurface border border-orbit-border rounded text-orbit-accent">
                    CREATOR &amp; ARCHITECT
                  </span>
                </div>
                <p className="text-xs text-orbit-muted font-medium mt-0.5">
                  Have ideas, bug reports, or want to collaborate on real-time systems?
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for Mail */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Copy Email Button */}
              <button
                onClick={handleCopyEmail}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-orbit-subsurface hover:bg-purple-100 text-orbit-text font-pixel text-[11px] tracking-wider rounded-boxy border-2 border-orbit-border shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
                title="Copy developer email"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-orbit-mint" />
                    <span className="text-orbit-mint">COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-orbit-accent" />
                    <span>COPY EMAIL</span>
                  </>
                )}
              </button>

              {/* Direct Mailto Button */}
              <a
                href={`mailto:${DEVELOPER_EMAIL}?subject=Orbit%20Feedback%20%26%20Inquiry`}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-orbit-text hover:bg-slate-800 text-white font-pixel text-[11px] tracking-wider rounded-boxy border-2 border-orbit-border shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-orbit-arcadeYellow" />
                <span>SEND MAIL</span>
              </a>
            </div>
          </div>

          {/* Email Display Bar */}
          <div className="mt-4 pt-3 border-t border-orbit-borderMuted flex flex-col sm:flex-row items-center justify-between text-xs text-orbit-muted gap-2">
            <span className="font-mono text-[11px]">
              Direct Contact:{" "}
              <a
                href={`mailto:${DEVELOPER_EMAIL}`}
                className="text-orbit-accent font-bold hover:underline"
              >
                {DEVELOPER_EMAIL}
              </a>
            </span>
            <span className="text-[11px]">
              Built with Next.js 15 • React 19 • Socket.IO • WebRTC • Prisma
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}