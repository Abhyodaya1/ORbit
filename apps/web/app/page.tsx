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
  ArrowRight,
  Flame,
  Terminal,
  Activity,
  Radio,
  Trophy,
  Palette,
  HelpCircle,
  Zap,
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

  // 1. Host Room Creation
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const res = await fetch("/api/invite", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create room");
      }

      // Tab-isolated session storage
      sessionStorage.setItem(`orbit_token_${data.code}`, data.hostToken);
      sessionStorage.setItem(`orbit_role_${data.code}`, "HOST");
      localStorage.setItem(`orbit_token_${data.code}`, data.hostToken);
      localStorage.setItem(`orbit_role_${data.code}`, "HOST");

      router.push(`/room/${data.code}`);
    } catch (err) {
      console.error(err);
      alert("Could not create room. Please check your database connection!");
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Peer Join via Code Input
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim().toLowerCase();
    if (!clean) return;
    setIsJoining(true);

    // Wipe stale tokens for this tab
    sessionStorage.removeItem(`orbit_token_${clean}`);
    sessionStorage.removeItem(`orbit_role_${clean}`);
    localStorage.removeItem(`orbit_token_${clean}`);
    localStorage.removeItem(`orbit_role_${clean}`);

    router.push(`/room/${clean}`);
  };

  // 3. One-Click Email Copy
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(DEVELOPER_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 md:p-12 overflow-x-hidden selection:bg-orbit-accent selection:text-white">
      {/* 🌌 Atmospheric Backdrop */}
      <CosmicArcadeBackground />

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center gap-10 py-4">
        
        {/* ── TOP TELEMETRY STATUS CAPSULE ── */}
        <div className="inline-flex items-center gap-2.5 bg-white border-2 border-orbit-border px-3.5 py-1.5 rounded-boxy shadow-arcadeSm text-telemetry font-mono font-medium text-orbit-text">
          <span className="flex h-2.5 w-2.5 relative">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orbit-mint opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? "bg-orbit-mint" : "bg-orbit-coral"
              }`}
            />
          </span>
          <span className="font-pixel text-pixel-xs tracking-pixel-wide pt-0.5 leading-none">
            [SYS.STATUS: {isConnected ? "ONLINE" : "DISCONNECTED"}]
          </span>
          <span className="text-orbit-borderMuted select-none">/</span>
          <span className="text-telemetry font-mono font-semibold tracking-pixel-snug text-orbit-muted leading-none">
            {socketId ? `SOCKET:${socketId.slice(0, 6)}` : "STANDBY"}
          </span>
        </div>

        {/* ── HERO BANNER: NEO-BRUTALIST TITLES ── */}
        <header className="text-center flex flex-col items-center max-w-2xl px-2">
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3.5 mb-2">
            <div className="p-2.5 sm:p-3 bg-orbit-arcadeYellow border-[3px] border-orbit-border rounded-boxy shadow-arcade transform -rotate-3 hover:rotate-0 transition-transform duration-200">
              <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-orbit-border" />
            </div>
            <h1 className="font-pixel text-display-hero font-bold tracking-pixel-wide text-orbit-text drop-shadow-sm select-none pt-1">
              ORBIT
            </h1>
            <div className="p-2.5 sm:p-3 bg-orbit-coral border-[3px] border-orbit-border rounded-boxy shadow-arcade transform rotate-3 hover:rotate-0 transition-transform duration-200">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>

          <div className="inline-block bg-orbit-subsurface border-2 border-orbit-border px-3.5 py-1.5 rounded-boxy shadow-arcadeSm mt-2 mb-3">
            <p className="font-pixel text-pixel-xs sm:text-pixel-sm font-bold text-orbit-text tracking-pixel-wide uppercase leading-none pt-0.5">
              ★ The 2-Player Virtual Living Room ★
            </p>
          </div>

          <p className="text-orbit-muted text-sm sm:text-base font-sans font-medium leading-arcade-relaxed max-w-[50ch] text-balance mt-1">
            Ultra-low latency 1:1 encrypted video calls, synchronized whiteboard, and 5 retro arcade battles. 
            Zero downloads. Zero accounts. Instant peer-to-peer connection.
          </p>
        </header>

        {/* ── CENTRAL TACTILE ARCADE CONSOLE CHASSIS ── */}
        <div className="relative bg-white border-[3px] border-orbit-border rounded-boxy p-6 sm:p-8 shadow-arcadeLg max-w-lg w-full transition-transform">
          {/* Mechanical Chassis Corner Rivets */}
          <span className="absolute top-2 left-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
          <span className="absolute top-2 right-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
          <span className="absolute bottom-2 left-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
          <span className="absolute bottom-2 right-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>

          {/* Console Header Bar */}
          <div className="flex items-center justify-between pb-3.5 mb-5 border-b-2 border-orbit-border">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-orbit-accent animate-pulse" />
              <span className="font-pixel text-pixel-xs font-bold text-orbit-text tracking-pixel-wide pt-0.5 leading-none">
                CHASSIS.LOBBY
              </span>
            </div>
            <span className="font-mono text-telemetry px-2 py-0.5 bg-orbit-subsurface border border-orbit-border rounded font-bold text-orbit-text tracking-pixel-snug leading-none">
              P2P MESH READY
            </span>
          </div>

          {/* PRIMARY TACTILE BUTTON: CREATE ROOM */}
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="group relative w-full h-14 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-base tracking-pixel-wide rounded-boxy border-[3px] border-orbit-border shadow-arcade hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#2d264f] active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-[0.99] transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-accent focus-visible:ring-offset-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="pt-0.5 leading-none">INITIALIZING ENGINE...</span>
              </>
            ) : (
              <>
                <span className="pt-0.5 leading-none">SPAWN PRIVATE ROOM</span>
                <span className="text-lg group-hover:scale-125 transition-transform duration-150 leading-none">🚀</span>
              </>
            )}
          </button>

          {/* Neo-Brutalist Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-orbit-borderMuted" />
            <span className="absolute bg-white px-3 font-pixel text-pixel-xs font-bold text-orbit-muted tracking-pixel-wide pt-0.5 leading-none">
              // OR JOIN FRIEND //
            </span>
          </div>

          {/* JOIN WITH CODE FORM */}
          <form onSubmit={handleJoinWithCode} className="flex gap-2.5 items-stretch">
            <input
              type="text"
              placeholder="e.g. cozy-pikachu-42"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="flex-1 h-12 bg-orbit-bg border-2 border-orbit-border rounded-boxy px-4 font-mono text-sm font-semibold tracking-pixel-snug text-orbit-text placeholder:text-orbit-muted/50 focus:outline-none focus:ring-2 focus:ring-orbit-accent shadow-inner leading-none"
            />
            <button
              type="submit"
              disabled={isJoining || !joinCodeInput.trim()}
              className="h-12 px-5 bg-orbit-arcadeYellow hover:bg-amber-300 active:bg-amber-400 disabled:opacity-40 text-orbit-border font-pixel text-pixel-xs font-bold tracking-pixel-wide border-2 border-orbit-border rounded-boxy shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center gap-1.5 cursor-pointer pt-0.5 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-border"
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>ENTER</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Technical Affordances */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t-2 border-orbit-border/30">
            <div className="h-11 bg-orbit-subsurface/60 border-2 border-orbit-border rounded-boxy px-3 flex items-center gap-2 shadow-arcadeSm">
              <Video className="w-4 h-4 text-orbit-accent flex-shrink-0" />
              <span className="text-telemetry font-bold text-orbit-text font-mono tracking-pixel-snug leading-none">
                1:1 WebRTC Video
              </span>
            </div>
            <div className="h-11 bg-orbit-subsurface/60 border-2 border-orbit-border rounded-boxy px-3 flex items-center gap-2 shadow-arcadeSm">
              <Heart className="w-4 h-4 text-orbit-coral flex-shrink-0" />
              <span className="text-telemetry font-bold text-orbit-text font-mono tracking-pixel-snug leading-none">
                5 Synced Games
              </span>
            </div>
          </div>
        </div>

        {/* ── THE 5 ARCADE EXPERIENCES: ASYMMETRIC BENTO GRID ── */}
        <section className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orbit-coral" />
              <h2 className="font-pixel text-sm sm:text-base tracking-pixel-wide text-orbit-text uppercase font-bold pt-0.5 leading-none">
                Synchronized Arcade Arenas
              </h2>
            </div>
            <span className="font-mono text-telemetry text-orbit-muted font-bold tracking-pixel-snug leading-none">
              [SERVER-AUTHORITATIVE]
            </span>
          </div>

          {/* BENTO LAYOUT (6-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            
            {/* 🏓 1. HERO BENTO CARD: RETRO PONG (Spans 4 columns) */}
            <div className="md:col-span-4 bg-white border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade hover:-translate-y-1 hover:shadow-arcadeLg transition-[transform,box-shadow] duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">🏓</span>
                    <h3 className="font-pixel text-base font-bold text-orbit-text tracking-pixel-wide pt-0.5 leading-none">
                      Retro Pong Engine
                    </h3>
                  </div>
                  <span className="font-pixel text-pixel-tag tracking-pixel-widest px-2 py-0.5 bg-emerald-100 border border-orbit-border text-emerald-800 rounded font-bold shadow-arcadeSm leading-none inline-flex items-center pt-1 whitespace-nowrap">
                    60 FPS RAF LOCKED
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-orbit-muted font-sans font-medium leading-arcade-normal max-w-md">
                  Decoupled HTML5 canvas with 0ms client prediction and 30Hz monotonic sync. 
                  Zero input lag regardless of network latency.
                </p>
              </div>

              {/* Mini Interactive Pong Court Graphic */}
              <div className="relative mt-4 h-16 w-full bg-[#141226] border-2 border-orbit-border rounded-boxy overflow-hidden flex items-center justify-between px-3">
                <div className="w-1.5 h-8 bg-orbit-coral rounded-sm" />
                <div className="w-2.5 h-2.5 bg-orbit-arcadeYellow rounded-full shadow-[0_0_8px_#fdcb6e] animate-bounce" />
                <div className="w-1.5 h-8 bg-orbit-mint rounded-sm" />
              </div>
            </div>

            {/* 🎭 2. CELEBRITY MYSTERY (Spans 2 columns) */}
            <div className="md:col-span-2 bg-[#fdf2f8] border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade hover:-translate-y-1 hover:shadow-arcadeLg transition-[transform,box-shadow] duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl leading-none">🎭</span>
                  <span className="font-pixel text-pixel-tag tracking-pixel-widest px-2 py-0.5 bg-pink-200 border border-orbit-border text-pink-900 rounded font-bold leading-none inline-flex items-center pt-1">
                    PRE-WARMED
                  </span>
                </div>
                <h3 className="font-pixel text-sm font-bold text-orbit-text tracking-pixel-wide mb-1 pt-0.5 leading-snug">
                  Celebrity Guess
                </h3>
                <p className="text-xs text-orbit-muted font-sans leading-arcade-normal font-medium">
                  20-questions co-op with dynamic Wikipedia portrait streaming and anti-cheat role partitioning.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-orbit-border/30 flex items-center gap-1.5 text-telemetry font-mono font-bold text-pink-800 tracking-pixel-snug leading-none">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>SPEAKER VS GUESSER</span>
              </div>
            </div>

            {/* 🎨 3. COLLABORATIVE WHITEBOARD (Spans 2 columns) */}
            <div className="md:col-span-2 bg-[#fffbeb] border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade hover:-translate-y-1 hover:shadow-arcadeLg transition-[transform,box-shadow] duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl leading-none">🎨</span>
                  <span className="font-pixel text-pixel-tag tracking-pixel-widest px-2 py-0.5 bg-amber-200 border border-orbit-border text-amber-900 rounded font-bold leading-none inline-flex items-center pt-1">
                    VECTOR
                  </span>
                </div>
                <h3 className="font-pixel text-sm font-bold text-orbit-text tracking-pixel-wide mb-1 pt-0.5 leading-snug">
                  Shared Canvas
                </h3>
                <p className="text-xs text-orbit-muted font-sans leading-arcade-normal font-medium">
                  Real-time freehand brush strokes broadcast instantaneously over Socket.IO relays.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-orbit-border/30 flex items-center gap-1.5 text-telemetry font-mono font-bold text-amber-800 tracking-pixel-snug leading-none">
                <Palette className="w-3.5 h-3.5" />
                <span>MULTI-COLOR PALETTE</span>
              </div>
            </div>

            {/* ⚔️ 4. TIC-TAC-TOE DUEL (Spans 2 columns) */}
            <div className="md:col-span-2 bg-[#f0fdf4] border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade hover:-translate-y-1 hover:shadow-arcadeLg transition-[transform,box-shadow] duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl leading-none">⚔️</span>
                  <span className="font-pixel text-pixel-tag tracking-pixel-widest px-2 py-0.5 bg-emerald-200 border border-orbit-border text-emerald-900 rounded font-bold leading-none inline-flex items-center pt-1">
                    TURN-BASED
                  </span>
                </div>
                <h3 className="font-pixel text-sm font-bold text-orbit-text tracking-pixel-wide mb-1 pt-0.5 leading-snug">
                  Tactical Grid
                </h3>
                <p className="text-xs text-orbit-muted font-sans leading-arcade-normal font-medium">
                  Deterministic win-streak tracking with immediate diagonal line detection.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-orbit-border/30 flex items-center gap-1.5 text-telemetry font-mono font-bold text-emerald-800 tracking-pixel-snug leading-none">
                <Trophy className="w-3.5 h-3.5" />
                <span>WINNER TAKES ALL</span>
              </div>
            </div>

            {/* ⚡ 5. WOULD YOU RATHER (Spans 2 columns) */}
            <div className="md:col-span-2 bg-[#f0f9ff] border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade hover:-translate-y-1 hover:shadow-arcadeLg transition-[transform,box-shadow] duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl leading-none">⚡</span>
                  <span className="font-pixel text-pixel-tag tracking-pixel-widest px-2 py-0.5 bg-sky-200 border border-orbit-border text-sky-900 rounded font-bold leading-none inline-flex items-center pt-1">
                    ICEBREAKER
                  </span>
                </div>
                <h3 className="font-pixel text-sm font-bold text-orbit-text tracking-pixel-wide mb-1 pt-0.5 leading-snug">
                  Dilemma Showdown
                </h3>
                <p className="text-xs text-orbit-muted font-sans leading-arcade-normal font-medium">
                  Synchronized choice reveal mechanics designed to spark late-night debates.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-orbit-border/30 flex items-center gap-1.5 text-telemetry font-mono font-bold text-sky-800 tracking-pixel-snug leading-none">
                <Zap className="w-3.5 h-3.5" />
                <span>SIMULTANEOUS REVEAL</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── TELEMETRY & ARCHITECTURE HIGHLIGHTS ── */}
        <div className="w-full max-w-3xl bg-white border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade">
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-orbit-border">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orbit-accent" />
              <h3 className="font-pixel text-pixel-xs sm:text-pixel-sm font-bold text-orbit-text uppercase tracking-pixel-wide pt-0.5 leading-none">
                Production Engine Telemetry
              </h3>
            </div>
            <span className="font-mono text-telemetry text-orbit-muted font-bold tracking-pixel-snug leading-none">
              [LATENCY &lt; 15MS]
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded p-3 shadow-arcadeSm flex flex-col justify-between">
              <span className="font-mono font-bold text-orbit-text block text-sm sm:text-base tracking-pixel-snug leading-none">
                ⚡ 60 FPS
              </span>
              <span className="text-telemetry text-orbit-muted font-medium tracking-normal mt-1 leading-snug">
                RAF Loop Decoupled
              </span>
            </div>
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded p-3 shadow-arcadeSm flex flex-col justify-between">
              <span className="font-mono font-bold text-orbit-text block text-sm sm:text-base tracking-pixel-snug leading-none">
                🛡️ Token Bucket
              </span>
              <span className="text-telemetry text-orbit-muted font-medium tracking-normal mt-1 leading-snug">
                Per-Socket Limiter
              </span>
            </div>
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded p-3 shadow-arcadeSm flex flex-col justify-between">
              <span className="font-mono font-bold text-orbit-text block text-sm sm:text-base tracking-pixel-snug leading-none">
                🧹 Auto-Reaper
              </span>
              <span className="text-telemetry text-orbit-muted font-medium tracking-normal mt-1 leading-snug">
                15m Cascade Sweeper
              </span>
            </div>
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded p-3 shadow-arcadeSm flex flex-col justify-between">
              <span className="font-mono font-bold text-orbit-text block text-sm sm:text-base tracking-pixel-snug leading-none">
                🔒 WebRTC Mesh
              </span>
              <span className="text-telemetry text-orbit-muted font-medium tracking-normal mt-1 leading-snug">
                End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* ── DEVELOPER CONTACT CHASSIS ── */}
        <footer className="w-full max-w-3xl bg-white border-[3px] border-orbit-border rounded-boxy p-6 sm:p-7 shadow-arcadeLg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-boxy bg-orbit-text text-orbit-arcadeYellow flex items-center justify-center font-pixel text-lg font-bold border-2 border-orbit-border shadow-arcadeSm flex-shrink-0 pt-0.5 select-none leading-none">
                AS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-orbit-text font-pixel tracking-pixel-snug pt-0.5 leading-none">
                    Abhyodaya Singh
                  </h4>
                  <span className="font-pixel text-pixel-tag tracking-pixel-wide px-2 py-0.5 bg-orbit-arcadeYellow border border-orbit-border rounded font-bold text-orbit-border leading-none inline-flex items-center pt-1">
                    ARCHITECT
                  </span>
                </div>
                <p className="text-xs text-orbit-muted font-sans font-medium mt-1 leading-arcade-normal">
                  Have ideas, questions, or want to collaborate on real-time systems?
                </p>
              </div>
            </div>

            {/* Tactile Contact Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleCopyEmail}
                className="flex-1 sm:flex-initial h-11 px-4 bg-orbit-subsurface hover:bg-violet-100 text-orbit-text font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow] duration-150 flex items-center justify-center gap-1.5 cursor-pointer pt-0.5 leading-none"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-orbit-mint stroke-[3]" />
                    <span className="text-orbit-mint font-bold">COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-orbit-accent" />
                    <span>COPY EMAIL</span>
                  </>
                )}
              </button>

              <a
                href={`mailto:${DEVELOPER_EMAIL}?subject=Orbit%20Arcade%20Feedback`}
                className="flex-1 sm:flex-initial h-11 px-4 bg-orbit-text hover:bg-slate-800 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow] duration-150 flex items-center justify-center gap-1.5 cursor-pointer pt-0.5 leading-none"
              >
                <Mail className="w-3.5 h-3.5 text-orbit-arcadeYellow" />
                <span>SEND MAIL</span>
              </a>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t-2 border-orbit-border/20 flex flex-col sm:flex-row items-center justify-between text-telemetry text-orbit-muted gap-2 font-mono">
            <span className="break-all sm:break-normal">
              Contact:{" "}
              <a href={`mailto:${DEVELOPER_EMAIL}`} className="text-orbit-accent font-bold hover:underline">
                {DEVELOPER_EMAIL}
              </a>
            </span>
            <span className="text-telemetry font-mono tracking-normal text-orbit-muted/90">
              Next.js 15 • React 19 • Socket.IO • WebRTC • Caddy
            </span>
          </div>
        </footer>

      </div>
    </main>
  );
}