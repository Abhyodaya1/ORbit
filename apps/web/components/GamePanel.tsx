"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Gamepad2, RotateCcw, Trash2, Send, Check, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import ArcadeShootingStars from "./ArcadeShootingStars";


interface GamePanelProps {
  socket: Socket | null;
  roomCode: string;
  token: string | null;
  role: "HOST" | "PEER" | null;
}

const AVAILABLE_GAMES = [
  { id: "HIGHER_LOWER", name: "Higher or Lower", icon: "🔢" },
  { id: "DRAW_GUESS", name: "Draw & Guess", icon: "🎨" },
  { id: "CELEBRITY_GUESS", name: "Celebrity Mystery", icon: "⭐" },
  { id: "ROCK_PAPER_SCISSORS", name: "RPS Duel", icon: "✂️" },
  { id: "PONG", name: "Table Tennis", icon: "🏓" },
];

const COLORS = ["#2d264f", "#7c5ce7", "#ff7675", "#10b981", "#0984e3", "#fdcb6e"];

const RPS_MOVES = [
  { id: "ROCK", name: "Rock", icon: "🪨", beats: "Scissors" },
  { id: "PAPER", name: "Paper", icon: "📄", beats: "Rock" },
  { id: "SCISSORS", name: "Scissors", icon: "✂️", beats: "Paper" },
];

export default function GamePanel({ socket, roomCode, token, role }: GamePanelProps) {
  const [selectedGame, setSelectedGame] = useState("HIGHER_LOWER");
  const [gameState, setGameState] = useState<any>(null);



  // Inputs
  const [guessInput, setGuessInput] = useState("");
  const [drawGuessInput, setDrawGuessInput] = useState("");
  const [celebGuessInput, setCelebGuessInput] = useState("");

  // Animation Popup State for Higher / Lower
  const [guessAlert, setGuessAlert] = useState<{
    result: "HIGHER" | "LOWER" | "CORRECT";
    guess: number;
    guesserRole: "HOST" | "PEER";
  } | null>(null);

  // Draw & Guess Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#2d264f");
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Pong Canvas
  const pongCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Listen for Server Game Updates
  useEffect(() => {
    if (!socket) return;

    socket.on("game_state_update", (state) => {
      setGameState(state);
      if (state?.gameType) setSelectedGame(state.gameType);
    });

    socket.on("draw_stroke", (stroke) => {
      drawLine(stroke.from, stroke.to, stroke.color);
    });

    socket.on("clear_canvas", () => {
      clearLocalCanvas();
    });

    return () => {
      socket.off("game_state_update");
      socket.off("draw_stroke");
      socket.off("clear_canvas");
    };
  }, [socket]);

  // 2. Pong Canvas Rendering Loop
  useEffect(() => {
    if (selectedGame !== "PONG" || !gameState || gameState.gameType !== "PONG") return;
    const canvas = pongCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { ball, paddles, court, scores } = gameState;

    // Background (Dark Retro Arcade Felt)
    ctx.fillStyle = "#141226";
    ctx.fillRect(0, 0, court.width, court.height);

    // Center Dashed Net Line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(court.width / 2, 0);
    ctx.lineTo(court.width / 2, court.height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Big Center Field Score
    ctx.font = "bold 56px 'Silkscreen', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.textAlign = "center";
    ctx.fillText(`${scores.HOST}   ${scores.PEER}`, court.width / 2, court.height / 2 + 20);

    // Left Paddle (Host - Mint Green Glow)
    ctx.fillStyle = "#10b981";
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 10;
    ctx.fillRect(15, paddles.hostY, paddles.width, paddles.height);

    // Right Paddle (Peer - Neon Violet Glow)
    ctx.fillStyle = "#7c5ce7";
    ctx.shadowColor = "#7c5ce7";
    ctx.shadowBlur = 10;
    ctx.fillRect(court.width - 15 - paddles.width, paddles.peerY, paddles.width, paddles.height);

    // Ball (Glowing Arcade Orb)
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [gameState, selectedGame]);

  // Higher / Lower Alert Banner
  useEffect(() => {
    const latest = gameState?.history?.[0];
    if (!latest || gameState?.gameType !== "HIGHER_LOWER") return;

    setGuessAlert({
      result: latest.result,
      guess: latest.guess,
      guesserRole: latest.guesserRole,
    });

    const timer = setTimeout(() => setGuessAlert(null), 3500);
    return () => clearTimeout(timer);
  }, [gameState?.history]);

  // Draw & Guess Canvas Utilities
  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState?.isDrawer) return;
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPosRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !gameState?.isDrawer || !lastPosRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const currentPos = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    drawLine(lastPosRef.current, currentPos, brushColor);
    if (socket) {
      socket.emit("draw_stroke", {
        roomCode,
        stroke: { from: lastPosRef.current, to: currentPos, color: brushColor },
      });
    }
    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const handleClearCanvas = () => {
    clearLocalCanvas();
    if (socket) socket.emit("clear_canvas", { roomCode });
  };

  const handleStartGame = (gameId = selectedGame) => {
    if (!socket) return;
    socket.emit("start_game", { roomCode, gameType: gameId });
    clearLocalCanvas();
  };

  // Pong Paddle Move (Mouse & Touch)
  const handlePongMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!socket || !token || selectedGame !== "PONG") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedY = (e.clientY - rect.top) / rect.height;

    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "PADDLE_MOVE", y: normalizedY },
    });
  };

  const handlePongTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!socket || !token || selectedGame !== "PONG" || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedY = (e.touches[0].clientY - rect.top) / rect.height;

    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "PADDLE_MOVE", y: normalizedY },
    });
  };

  // Submit Actions
  const handleDrawGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawGuessInput.trim() || !socket || !token) return;
    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "GUESS", guess: drawGuessInput },
    });
    setDrawGuessInput("");
  };

  const handleNumberGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guessInput);
    if (isNaN(num) || !socket || !token) return;
    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "GUESS", guess: num },
    });
    setGuessInput("");
  };

  const handleCelebGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!celebGuessInput.trim() || !socket || !token) return;
    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "GUESS", guess: celebGuessInput },
    });
    setCelebGuessInput("");
  };

  const handleRPSChoose = (choice: string) => {
    if (!socket || !token) return;
    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "CHOOSE", choice },
    });
  };

  const handleNextRound = () => {
    if (!socket || !token) return;
    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "NEXT_ROUND" },
    });
  };

  return (
    <div className="flex-1 w-full bg-white border-[3px] border-orbit-border rounded-boxy shadow-arcade flex flex-col overflow-hidden min-h-0">
      {/* ── Header: Game Title & Scoreboard ── */}
      <div className="bg-orbit-subsurface border-b-[3px] border-orbit-border px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-orbit-accent" />
          <span className="font-pixel text-pixel-xs sm:text-pixel-sm font-bold tracking-pixel-wide text-orbit-text pt-0.5 leading-none">
            GAME ARENA
          </span>
        </div>

        {/* Live Scoreboard */}
        <div className="bg-white border-2 border-orbit-border px-3 py-1.5 rounded-boxy shadow-arcadeSm flex items-center gap-3">
          <span className="font-pixel text-pixel-tag sm:text-pixel-xs text-orbit-text tracking-pixel-wide pt-0.5 leading-none">
            YOU: <strong className="font-mono">{gameState?.scores ? gameState.scores[role || "HOST"] : 0}</strong>
          </span>
          <span className="text-orbit-borderMuted font-bold select-none">|</span>
          <span className="font-pixel text-pixel-tag sm:text-pixel-xs text-orbit-muted tracking-pixel-wide pt-0.5 leading-none">
            PARTNER: <strong className="font-mono">{gameState?.scores ? gameState.scores[role === "HOST" ? "PEER" : "HOST"] : 0}</strong>
          </span>
        </div>
      </div>

      {/* ── Game Selector Tabs (Arcade Cartridges) ── */}
      <div className="flex items-center gap-2 p-2 bg-orbit-bg border-b-2 border-orbit-border overflow-x-auto flex-shrink-0">
        {AVAILABLE_GAMES.map((game) => {
          const isActive = selectedGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => {
                setSelectedGame(game.id);
                handleStartGame(game.id);
              }}
              className={`h-8 px-3 rounded-boxy font-pixel text-pixel-xs tracking-pixel-wide whitespace-nowrap transition-[transform,box-shadow,background-color,border-color] duration-150 flex items-center gap-1.5 pt-0.5 leading-none cursor-pointer select-none ${
                isActive
                  ? "bg-orbit-accent text-white border-2 border-orbit-border shadow-arcade -translate-y-0.5 font-bold"
                  : "bg-white text-orbit-text border-2 border-orbit-border/40 hover:border-orbit-border hover:-translate-y-0.5 hover:shadow-arcadeSm active:translate-y-0 active:shadow-none"
              }`}
            >
              <span>{game.icon}</span>
              <span>{game.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Arena Canvas ── */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto min-h-0 relative">
        {/* Baby Pink Background with Multiple Arcade Shooting Stars ONLY */}
        <ArcadeShootingStars />

        {/* LOBBY VIEW */}
        {!gameState && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative z-10">
            <div className="relative bg-white/95 backdrop-blur-sm border-[3px] border-orbit-border rounded-boxy p-8 max-w-sm w-full flex flex-col items-center gap-3 shadow-arcadeLg">
              {/* Corner rivets */}
              <span className="absolute top-2 left-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
              <span className="absolute top-2 right-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
              <span className="absolute bottom-2 left-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>
              <span className="absolute bottom-2 right-2 text-[10px] font-mono text-orbit-muted font-bold select-none">+</span>

              <span className="text-5xl animate-bounce">
                {AVAILABLE_GAMES.find((g) => g.id === selectedGame)?.icon}
              </span>
              <h3 className="font-pixel text-display-title font-bold text-orbit-text pt-0.5 leading-tight">
                {AVAILABLE_GAMES.find((g) => g.id === selectedGame)?.name}
              </h3>
              <p className="text-xs font-sans text-orbit-muted leading-arcade-normal font-medium">
                Click start to begin playing with your partner in real time!
              </p>
              <button
                onClick={() => handleStartGame(selectedGame)}
                className="w-full h-12 mt-2 bg-orbit-mint hover:bg-emerald-600 active:bg-emerald-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-[3px] border-orbit-border shadow-arcade hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcadeLg active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-[0.99] transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center pt-0.5 leading-none cursor-pointer"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* ════ GAME 1: HIGHER OR LOWER ════ */}
        {selectedGame === "HIGHER_LOWER" && gameState?.gameType === "HIGHER_LOWER" && (
          <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full relative z-10">
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded-boxy p-3.5 flex items-center justify-between shadow-arcadeSm">
              <div>
                <span className="font-pixel text-pixel-tag text-orbit-muted uppercase pt-0.5 leading-none">
                  Your Target:
                </span>
                <p className="text-xs font-sans text-orbit-muted font-medium mt-0.5">
                  Partner is trying to guess this
                </p>
              </div>
              <span className="bg-orbit-accent text-white font-pixel text-2xl px-4 py-1.5 rounded-boxy border-2 border-orbit-border shadow-arcadeSm pt-1 leading-none">
                {gameState.mySecretNumber}
              </span>
            </div>

            {guessAlert && gameState.status !== "FINISHED" && (
              <div
                className={`p-3.5 rounded-boxy border-[3px] border-orbit-border shadow-arcadeLg animate-bounce flex items-center justify-center gap-3 transition-all ${
                  guessAlert.result === "HIGHER"
                    ? "bg-amber-100 text-amber-900 border-amber-400"
                    : guessAlert.result === "LOWER"
                    ? "bg-blue-100 text-blue-900 border-blue-400"
                    : "bg-emerald-100 text-emerald-900 border-emerald-400"
                }`}
              >
                {guessAlert.result === "HIGHER" && <ArrowUp className="w-7 h-7 text-amber-600 animate-pulse stroke-[2.5]" />}
                {guessAlert.result === "LOWER" && <ArrowDown className="w-7 h-7 text-blue-600 animate-pulse stroke-[2.5]" />}
                {guessAlert.result === "CORRECT" && <Check className="w-7 h-7 text-emerald-600 animate-bounce stroke-[3]" />}
                <div className="text-left">
                  <h4 className="font-pixel text-pixel-sm font-bold tracking-pixel-wide pt-0.5 leading-none">
                    {guessAlert.result === "HIGHER" && "⬆️ GO HIGHER!"}
                    {guessAlert.result === "LOWER" && "⬇️ GO LOWER!"}
                    {guessAlert.result === "CORRECT" && "🎉 BINGO! CORRECT!"}
                  </h4>
                  <p className="text-[11px] font-sans font-semibold opacity-90 mt-0.5">
                    {guessAlert.guesserRole === role ? "Your guess" : "Partner's guess"} ({guessAlert.guess}) was too {guessAlert.result === "HIGHER" ? "low" : "high"}!
                  </p>
                </div>
              </div>
            )}

            {gameState.status === "FINISHED" ? (
              <div className="p-4 rounded-boxy border-[3px] border-orbit-border text-center shadow-arcade bg-orbit-mint/20">
                <h2 className="font-pixel text-base font-bold text-orbit-text mb-1 pt-0.5 leading-none">
                  {gameState.winner === role ? "🏆 YOU WON!" : "💀 PARTNER WON!"}
                </h2>
                <p className="text-xs font-sans text-orbit-muted mb-3">
                  Partner's target was: <strong className="text-orbit-accent font-mono">{gameState.partnerSecretNumber}</strong>
                </p>
                <button
                  onClick={() => handleStartGame("HIGHER_LOWER")}
                  className="h-10 px-5 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center gap-1.5 mx-auto pt-0.5 leading-none cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> PLAY AGAIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleNumberGuessSubmit} className="flex gap-2 items-stretch">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  disabled={gameState.currentTurn !== role}
                  placeholder={gameState.currentTurn === role ? "Enter guess (1-100)..." : "Waiting for partner's move..."}
                  className="flex-1 h-11 bg-white border-2 border-orbit-border rounded-boxy px-4 text-xs font-mono font-bold text-orbit-text placeholder:text-orbit-muted/50 focus:outline-none focus:ring-2 focus:ring-orbit-accent shadow-inner disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={gameState.currentTurn !== role || !guessInput}
                  className="h-11 px-5 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 pt-0.5 leading-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  GUESS
                </button>
              </form>
            )}

            <div className="flex-1 flex flex-col min-h-0 bg-orbit-subsurface/40 border-2 border-orbit-border rounded-boxy p-3 max-h-40 overflow-y-auto">
              <span className="font-pixel text-pixel-tag text-orbit-muted tracking-pixel-wide mb-2 block pt-0.5 leading-none">
                GUESS LOG:
              </span>
              <div className="flex flex-col gap-1.5">
                {gameState.history?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white border border-orbit-border rounded-boxy shadow-sm text-xs">
                    <span className="font-pixel text-pixel-tag text-orbit-text pt-0.5 leading-none">
                      {item.guesserRole === role ? "YOU" : "PARTNER"}: <strong className="font-mono">{item.guess}</strong>
                    </span>
                    <span className={`font-pixel text-pixel-tag px-2 py-0.5 rounded border border-orbit-border font-bold pt-0.5 leading-none ${
                      item.result === "HIGHER" ? "bg-amber-100 text-amber-800" :
                      item.result === "LOWER" ? "bg-blue-100 text-blue-800" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>
                      {item.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ GAME 2: DRAW & GUESS ════ */}
        {selectedGame === "DRAW_GUESS" && gameState && (
          <div className="flex-1 flex flex-col gap-3 max-w-xl mx-auto w-full relative z-10">
            <div className="bg-orbit-subsurface border-2 border-orbit-border p-2.5 rounded-boxy shadow-arcadeSm flex items-center justify-between">
              <div>
                <span className="font-pixel text-pixel-tag text-orbit-muted uppercase pt-0.5 leading-none">
                  {gameState?.isDrawer ? "🎨 YOU ARE DRAWING:" : "👀 GUESS THE WORD:"}
                </span>
                <h3 className="font-pixel text-card-title font-bold text-orbit-accent tracking-pixel-wide mt-0.5 leading-tight">
                  {gameState?.wordDisplay || "LOADING..."}
                </h3>
              </div>

              {gameState?.isDrawer && (
                <div className="flex items-center gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-7 h-7 rounded-full border-2 border-orbit-border shadow-arcadeSm hover:scale-115 active:scale-95 transition-transform cursor-pointer ${brushColor === c ? "scale-115 ring-2 ring-orbit-accent" : ""}`}
                      style={{ backgroundColor: c }}
                      title={`Select Color ${c}`}
                    />
                  ))}
                  <button
                    onClick={handleClearCanvas}
                    className="h-7 w-7 bg-white hover:bg-orbit-coral hover:text-white border-2 border-orbit-border rounded-boxy shadow-arcadeSm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center justify-center ml-1 cursor-pointer"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="relative w-full aspect-[4/3] bg-white border-[3px] border-orbit-border rounded-boxy shadow-arcade overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`w-full h-full ${gameState?.isDrawer ? "cursor-crosshair" : "cursor-not-allowed"}`}
              />
            </div>

            {!gameState?.isDrawer && (
              <form onSubmit={handleDrawGuessSubmit} className="flex gap-2 items-stretch">
                <input
                  type="text"
                  value={drawGuessInput}
                  onChange={(e) => setDrawGuessInput(e.target.value)}
                  placeholder="Type your guess here..."
                  className="flex-1 h-11 bg-white border-2 border-orbit-border rounded-boxy px-4 text-xs font-sans font-medium text-orbit-text placeholder:text-orbit-muted/50 focus:outline-none focus:ring-2 focus:ring-orbit-accent shadow-inner"
                />
                <button
                  type="submit"
                  className="h-11 px-5 bg-orbit-mint hover:bg-emerald-600 active:bg-emerald-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 flex items-center gap-1.5 pt-0.5 leading-none cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> SUBMIT
                </button>
              </form>
            )}

            {gameState?.status === "ROUND_OVER" && (
              <div className="p-3 bg-orbit-mint/20 border-[3px] border-orbit-border rounded-boxy text-center shadow-arcade">
                <p className="font-pixel text-pixel-xs text-orbit-text mb-2 pt-0.5 leading-none">
                  🎉 Correct! The word was {gameState.wordDisplay}!
                </p>
                <button
                  onClick={() => handleStartGame("DRAW_GUESS")}
                  className="h-10 px-5 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 pt-0.5 leading-none cursor-pointer"
                >
                  NEXT ROUND (SWAP ROLES)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ GAME 3: CELEBRITY MYSTERY ════ */}
        {selectedGame === "CELEBRITY_GUESS" && gameState && (
          <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full relative z-10">
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded-boxy p-3 flex items-center justify-between shadow-arcadeSm">
              <div>
                <span className="font-pixel text-pixel-tag text-orbit-muted uppercase pt-0.5 leading-none">
                  {gameState.isGiver ? "🎙️ SPEAKER (DESCRIBE HER/HIM)" : "🕵️ GUESSER"}
                </span>
                <p className="text-xs font-mono font-bold text-orbit-accent mt-0.5">
                  Category: {gameState.category}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3].map((heart) => (
                  <span
                    key={heart}
                    className={`text-xl transition-all duration-300 ${
                      heart <= gameState.livesLeft ? "scale-100 opacity-100" : "scale-75 opacity-30 grayscale"
                    }`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade flex flex-col items-center text-center">
              {gameState.celebrity ? (
                <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <div className="relative w-44 h-44 rounded-boxy overflow-hidden border-[3px] border-orbit-border shadow-arcade bg-orbit-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gameState.celebrity.imageUrl}
                      alt={gameState.celebrity.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <h3 className="font-pixel text-lg font-bold text-orbit-text pt-0.5 leading-tight">
                      {gameState.celebrity.name}
                    </h3>
                    <p className="text-xs font-sans text-orbit-muted font-medium mt-1 leading-arcade-normal">
                      {gameState.isGiver
                        ? "Describe this person to your partner over video! Don't say their name!"
                        : gameState.status === "WON"
                        ? "🎉 Amazing! You guessed it!"
                        : "💀 Round Over! Here is who it was!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-36 h-36 border-2 border-dashed border-orbit-borderMuted rounded-boxy flex items-center justify-center bg-orbit-bg/50 shadow-inner">
                    <HelpCircle className="w-14 h-14 text-orbit-accent/40 animate-pulse" />
                  </div>
                  <h3 className="font-pixel text-pixel-sm font-bold text-orbit-text pt-0.5 leading-none">
                    MYSTERY CELEBRITY
                  </h3>
                  <p className="text-xs font-sans text-orbit-muted max-w-xs leading-arcade-normal">
                    Listen to your partner on video and ask questions! You have {gameState.livesLeft} {gameState.livesLeft === 1 ? "life" : "lives"} left!
                  </p>
                </div>
              )}
            </div>

            {gameState.status !== "PLAYING" ? (
              <div className="p-3 bg-orbit-mint/20 border-[3px] border-orbit-border rounded-boxy text-center shadow-arcade flex flex-col items-center gap-2">
                <span className="font-pixel text-pixel-xs font-bold text-orbit-text pt-0.5 leading-none">
                  {gameState.status === "WON" ? "🏆 ROUND WON!" : "💀 OUT OF LIVES!"}
                </span>
                <button
                  onClick={handleNextRound}
                  className="h-10 px-6 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 pt-0.5 leading-none cursor-pointer"
                >
                  NEXT ROUND (SWAP ROLES)
                </button>
              </div>
            ) : (
              !gameState.isGiver && (
                <form onSubmit={handleCelebGuessSubmit} className="flex gap-2 items-stretch">
                  <input
                    type="text"
                    value={celebGuessInput}
                    onChange={(e) => setCelebGuessInput(e.target.value)}
                    placeholder="Type celebrity name or surname..."
                    className="flex-1 h-11 bg-white border-2 border-orbit-border rounded-boxy px-4 text-xs font-sans font-medium text-orbit-text placeholder:text-orbit-muted/50 focus:outline-none focus:ring-2 focus:ring-orbit-accent shadow-inner"
                  />
                  <button
                    type="submit"
                    className="h-11 px-5 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 pt-0.5 leading-none cursor-pointer"
                  >
                    GUESS
                  </button>
                </form>
              )
            )}

            {gameState.history?.length > 0 && (
              <div className="bg-orbit-subsurface/40 border-2 border-orbit-border rounded-boxy p-2.5 max-h-32 overflow-y-auto">
                <span className="font-pixel text-pixel-tag text-orbit-muted tracking-pixel-wide block mb-1 pt-0.5 leading-none">
                  PREVIOUS GUESSES:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gameState.history.map((h: any, i: number) => (
                    <span
                      key={i}
                      className={`text-telemetry px-2 py-0.5 rounded border border-orbit-border font-mono ${
                        h.isCorrect
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-red-100 text-red-700 line-through"
                      }`}
                    >
                      {h.guess} {h.isCorrect ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ GAME 4: ROCK PAPER SCISSORS DUEL ════ */}
        {selectedGame === "ROCK_PAPER_SCISSORS" && gameState && (
          <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full relative z-10">
            <div className="bg-orbit-subsurface border-2 border-orbit-border rounded-boxy p-3 flex items-center justify-between shadow-arcadeSm">
              <div>
                <span className="font-pixel text-pixel-tag text-orbit-muted uppercase pt-0.5 leading-none">
                  ROUND {gameState.round}
                </span>
                <p className="text-xs font-mono font-bold text-orbit-accent mt-0.5">
                  {gameState.status === "CHOOSING" ? "⚡ MAKE YOUR MOVE" : "💥 ROUND REVEALED"}
                </p>
              </div>

              <div className="text-right">
                <span className="font-pixel text-pixel-tag text-orbit-muted uppercase pt-0.5 leading-none">PARTNER STATUS:</span>
                <p className="text-xs font-bold font-mono">
                  {gameState.partnerHasChosen ? (
                    <span className="text-orbit-mint">LOCKED IN 🔒</span>
                  ) : (
                    <span className="text-amber-500 animate-pulse">THINKING...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white border-[3px] border-orbit-border rounded-boxy p-5 shadow-arcade flex items-center justify-around relative overflow-hidden">
              <div className="flex flex-col items-center gap-2">
                <span className="font-pixel text-pixel-tag text-orbit-muted pt-0.5 leading-none">YOU</span>
                <div className="w-24 h-24 rounded-boxy border-2 border-orbit-border flex items-center justify-center text-4xl bg-orbit-bg shadow-inner">
                  {gameState.myChoice ? (
                    <span className="animate-in zoom-in duration-200">
                      {RPS_MOVES.find((m) => m.id === gameState.myChoice)?.icon}
                    </span>
                  ) : (
                    <span className="text-orbit-muted text-2xl">?</span>
                  )}
                </div>
                <span className="font-pixel text-pixel-xs font-bold text-orbit-text pt-0.5 leading-none">
                  {gameState.myChoice || "CHOOSE"}
                </span>
              </div>

              <div className="bg-orbit-accent text-white font-pixel text-pixel-xs px-2.5 py-1 rounded-boxy border-2 border-orbit-border shadow-arcadeSm pt-1 leading-none">
                VS
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="font-pixel text-pixel-tag text-orbit-muted pt-0.5 leading-none">PARTNER</span>
                <div className="w-24 h-24 rounded-boxy border-2 border-orbit-border flex items-center justify-center text-4xl bg-orbit-bg shadow-inner">
                  {gameState.partnerChoice ? (
                    <span className="animate-in zoom-in duration-300">
                      {RPS_MOVES.find((m) => m.id === gameState.partnerChoice)?.icon}
                    </span>
                  ) : gameState.partnerHasChosen ? (
                    <span className="text-2xl animate-bounce">🔒</span>
                  ) : (
                    <span className="text-orbit-muted text-2xl animate-pulse">?</span>
                  )}
                </div>
                <span className="font-pixel text-pixel-xs font-bold text-orbit-text pt-0.5 leading-none">
                  {gameState.partnerChoice || (gameState.partnerHasChosen ? "READY" : "WAITING")}
                </span>
              </div>
            </div>

            {gameState.status === "CHOOSING" ? (
              <div className="grid grid-cols-3 gap-2.5">
                {RPS_MOVES.map((move) => {
                  const isSelected = gameState.myChoice === move.id;
                  return (
                    <button
                      key={move.id}
                      onClick={() => handleRPSChoose(move.id)}
                      className={`p-3.5 sm:p-4 rounded-boxy border-2 border-orbit-border flex flex-col items-center gap-1.5 transition-[transform,box-shadow,background-color] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
                        isSelected
                          ? "bg-orbit-accent text-white shadow-arcade"
                          : "bg-white hover:bg-orbit-subsurface text-orbit-text shadow-arcadeSm"
                      }`}
                    >
                      <span className="text-3xl select-none">{move.icon}</span>
                      <span className="font-pixel text-pixel-xs font-bold pt-0.5 leading-none">{move.name}</span>
                      <span className="text-[9px] font-sans opacity-75">beats {move.beats}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-boxy border-[3px] border-orbit-border text-center shadow-arcade flex flex-col items-center gap-2 bg-orbit-mint/20 animate-in fade-in duration-300">
                <h3 className="font-pixel text-pixel-sm font-bold text-orbit-text pt-0.5 leading-none">
                  {gameState.winnerRole === "DRAW"
                    ? "🤝 IT'S A TIE!"
                    : gameState.winnerRole === role
                    ? "🏆 YOU WON THIS ROUND!"
                    : "💀 PARTNER WON THIS ROUND!"}
                </h3>
                <button
                  onClick={handleNextRound}
                  className="mt-1 h-10 px-6 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-orbit-border shadow-arcadeSm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcade active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 pt-0.5 leading-none cursor-pointer"
                >
                  NEXT ROUND ⚡
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            GAME 5: TABLE TENNIS / PONG
        ══════════════════════════════════════════════════════════ */}
        {selectedGame === "PONG" && gameState && (
          <div className="flex-1 flex flex-col gap-3 max-w-2xl mx-auto w-full relative z-10">
            {/* Arena Header */}
            <div className="bg-orbit-subsurface border-2 border-orbit-border p-2.5 rounded-boxy shadow-arcadeSm flex items-center justify-between">
              <div>
                <span className="font-pixel text-pixel-tag text-orbit-muted pt-0.5 leading-none">
                  {role === "HOST" ? "🟢 YOU: LEFT PADDLE" : "🟣 YOU: RIGHT PADDLE"}
                </span>
                <h3 className="font-pixel text-pixel-xs font-bold text-orbit-accent mt-0.5 pt-0.5 leading-none">
                  FIRST TO 5 POINTS WINS!
                </h3>
              </div>
              <div className="text-telemetry font-mono text-orbit-muted font-medium">
                Move mouse or finger up/down to defend!
              </div>
            </div>

            {/* Retro Pong Canvas */}
            <div className="relative w-full aspect-[8/5] bg-black border-[3px] border-orbit-border rounded-boxy shadow-arcadeLg overflow-hidden">
              <canvas
                ref={pongCanvasRef}
                width={800}
                height={500}
                onMouseMove={handlePongMouseMove}
                onTouchMove={handlePongTouchMove}
                className="w-full h-full cursor-none touch-none"
              />

              {/* Game Over Overlay */}
              {gameState.status === "FINISHED" && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 animate-in fade-in zoom-in duration-300">
                  <h2 className="font-pixel text-xl font-bold text-white tracking-widest pt-0.5 leading-tight">
                    {gameState.winner === role ? "🏆 MATCH WON!" : "💀 MATCH LOST!"}
                  </h2>
                  <p className="font-pixel text-pixel-sm text-orbit-mint">
                    FINAL SCORE: {gameState.scores.HOST} - {gameState.scores.PEER}
                  </p>
                  <button
                    onClick={() => handleStartGame("PONG")}
                    className="h-11 px-6 bg-orbit-accent hover:bg-violet-600 active:bg-violet-700 text-white font-pixel text-pixel-xs tracking-pixel-wide rounded-boxy border-2 border-white shadow-arcade hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-arcadeLg active:translate-x-1 active:translate-y-1 active:shadow-none transition-[transform,box-shadow,background-color] duration-150 pt-0.5 leading-none cursor-pointer"
                  >
                    PLAY AGAIN
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}