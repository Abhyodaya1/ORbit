"use client";

import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Gamepad2, Trophy, Sparkles, ArrowUp, ArrowDown, Check, RotateCcw } from "lucide-react";

interface GuessHistory {
  guesserRole: "HOST" | "PEER";
  guess: number;
  result: "HIGHER" | "LOWER" | "CORRECT";
  timestamp: number;
}

interface HigherLowerState {
  gameType: string;
  mySecretNumber: number;
  partnerSecretNumber: number | null;
  currentTurn: "HOST" | "PEER";
  winner: "HOST" | "PEER" | null;
  history: GuessHistory[];
  status: "PLAYING" | "FINISHED";
}

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

export default function GamePanel({ socket, roomCode, token, role }: GamePanelProps) {
  const [selectedGame, setSelectedGame] = useState("HIGHER_LOWER");
  const [gameState, setGameState] = useState<HigherLowerState | null>(null);
  const [guessInput, setGuessInput] = useState("");

  // 1. Listen for authoritative server updates
  useEffect(() => {
    if (!socket) return;

    const handleState = (state: HigherLowerState) => {
      setGameState(state);
    };

    socket.on("game_state_update", handleState);

    return () => {
      socket.off("game_state_update", handleState);
    };
  }, [socket]);

  // 2. Start Game Intent
  const handleStartGame = () => {
    if (!socket) return;
    socket.emit("start_game", { roomCode, gameType: selectedGame });
  };

  // 3. Make Guess Intent
  const handleMakeGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guessInput);
    if (isNaN(num) || num < 1 || num > 100 || !socket || !token) return;

    socket.emit("game_action", {
      roomCode,
      token,
      action: { type: "GUESS", guess: num },
    });

    setGuessInput("");
  };

  const isMyTurn = gameState?.currentTurn === role;
  const isGameOver = gameState?.status === "FINISHED";
  const didIWin = gameState?.winner === role;

  return (
    <div className="flex-1 w-full bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcade flex flex-col overflow-hidden min-h-0">
      
      {/* ── Header: Game Title & Scoreboard ── */}
      <div className="bg-orbit-subsurface border-b-2 border-orbit-border p-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-orbit-accent" />
          <span className="font-pixel text-xs font-bold tracking-wider text-orbit-text">
            GAME ARENA
          </span>
        </div>

        {/* Turn Status Pill */}
        {gameState && !isGameOver && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-orbit-border rounded-boxy shadow-arcadeSm">
            <span className={`w-2 h-2 rounded-full ${isMyTurn ? "bg-orbit-mint animate-pulse" : "bg-orbit-coral"}`} />
            <span className="font-pixel text-[10px] font-bold text-orbit-text">
              {isMyTurn ? "YOUR TURN TO GUESS!" : "PARTNER IS GUESSING..."}
            </span>
          </div>
        )}
      </div>

      {/* ── Game Selector Tabs ── */}
      <div className="flex items-center gap-1.5 p-2 bg-orbit-bg border-b border-orbit-borderMuted overflow-x-auto flex-shrink-0">
        {AVAILABLE_GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-boxy border font-pixel text-[10px] tracking-wide whitespace-nowrap transition-all ${
              selectedGame === game.id
                ? "bg-orbit-accent text-white border-orbit-border shadow-arcadeSm"
                : "bg-white text-orbit-muted border-orbit-borderMuted hover:border-orbit-border"
            }`}
          >
            <span>{game.icon}</span>
            <span>{game.name}</span>
          </button>
        ))}
      </div>

      {/* ── Main Arena Canvas ── */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto min-h-0 bg-white">
        
        {/* CASE A: No game running yet (Lobby view) */}
        {!gameState && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="border-2 border-dashed border-orbit-borderMuted rounded-boxy p-8 max-w-sm w-full flex flex-col items-center gap-3">
              <span className="text-5xl animate-bounce">🔢</span>
              <h3 className="font-pixel text-base font-bold text-orbit-text">
                Higher or Lower Duel
              </h3>
              <p className="text-xs text-orbit-muted leading-relaxed">
                Both players receive a secret number (1–100). Take turns guessing your partner's number. First to guess correctly wins!
              </p>
              <button
                onClick={handleStartGame}
                className="mt-2 py-3 px-6 bg-orbit-mint hover:bg-emerald-600 text-white font-pixel text-xs tracking-wider rounded-boxy border-2 border-orbit-border shadow-arcade active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* CASE B: Game is Active or Finished */}
        {gameState && (
          <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full">
            
            {/* Top Cards: Secret Number & Winner Banner */}
            {isGameOver ? (
              <div className={`p-4 rounded-boxy border-2 border-orbit-border text-center shadow-arcade ${didIWin ? "bg-orbit-mint/20" : "bg-orbit-coral/20"}`}>
                <h2 className="font-pixel text-base font-bold text-orbit-text mb-1">
                  {didIWin ? "🏆 YOU GUESSED IT! YOU WON!" : "💀 PARTNER GUESSED YOUR NUMBER!"}
                </h2>
                <p className="text-xs text-orbit-muted mb-3">
                  Partner's number was: <strong className="text-orbit-accent">{gameState.partnerSecretNumber}</strong>
                </p>
                <button
                  onClick={handleStartGame}
                  className="py-2 px-4 bg-orbit-accent hover:bg-violet-600 text-white font-pixel text-xs rounded-boxy border-2 border-orbit-border shadow-arcadeSm flex items-center gap-1.5 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  PLAY AGAIN
                </button>
              </div>
            ) : (
              /* Secret Number Box (Anti-cheat: Only YOU see this!) */
              <div className="bg-orbit-subsurface border-2 border-orbit-border rounded-boxy p-3 flex items-center justify-between shadow-arcadeSm">
                <div className="text-left">
                  <span className="text-[10px] font-pixel text-orbit-muted uppercase">Your Secret Target:</span>
                  <p className="text-xs text-orbit-muted font-medium">Partner must guess this number</p>
                </div>
                <div className="bg-orbit-accent text-white font-pixel text-2xl font-bold px-4 py-1.5 rounded-boxy border-2 border-orbit-border shadow-arcadeSm">
                  {gameState.mySecretNumber}
                </div>
              </div>
            )}

            {/* Input Form: Type Your Guess */}
            {!isGameOver && (
              <form onSubmit={handleMakeGuess} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  disabled={!isMyTurn}
                  placeholder={isMyTurn ? "Guess partner's number (1-100)..." : "Waiting for partner's turn..."}
                  className="flex-1 bg-orbit-subsurface border-2 border-orbit-border rounded-boxy px-4 py-2.5 text-xs text-orbit-text focus:outline-none focus:border-orbit-accent font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!isMyTurn || !guessInput}
                  className="bg-orbit-accent hover:bg-violet-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-boxy border-2 border-orbit-border font-pixel text-xs shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  GUESS
                </button>
              </form>
            )}

            {/* Guess History Feed (Live Feedback Log) */}
            <div className="flex-1 flex flex-col min-h-0 bg-orbit-subsurface/40 border-2 border-orbit-border rounded-boxy p-3">
              <span className="font-pixel text-[10px] text-orbit-muted tracking-wider mb-2">
                GUESS LOG:
              </span>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-48">
                {gameState.history.length === 0 ? (
                  <p className="text-xs text-orbit-muted text-center py-4 italic">
                    No guesses yet. First player to make a move begins!
                  </p>
                ) : (
                  gameState.history.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white border border-orbit-border rounded-boxy shadow-sm text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[10px] font-bold text-orbit-text">
                          {item.guesserRole === role ? "YOU" : "PARTNER"}:
                        </span>
                        <span className="font-mono font-bold bg-orbit-subsurface px-2 py-0.5 rounded border border-orbit-borderMuted">
                          {item.guess}
                        </span>
                      </div>

                      {/* Result Badge */}
                      <span
                        className={`font-pixel text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                          item.result === "HIGHER"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : item.result === "LOWER"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-400"
                        }`}
                      >
                        {item.result === "HIGHER" && <ArrowUp className="w-3 h-3" />}
                        {item.result === "LOWER" && <ArrowDown className="w-3 h-3" />}
                        {item.result === "CORRECT" && <Check className="w-3 h-3" />}
                        {item.result}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}