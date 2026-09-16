"use client";

import { Gamepad2, Trophy } from "lucide-react";
import { useState } from "react";

const AVAILABLE_GAMES = [
  { id: "HIGHER_LOWER", name: "Higher or Lower", icon: "🔢" },
  { id: "DRAW_GUESS", name: "Draw & Guess", icon: "🎨" },
  { id: "CELEBRITY_GUESS", name: "Celebrity Mystery", icon: "⭐" },
  { id: "ROCK_PAPER_SCISSORS", name: "RPS Duel", icon: "✂️" },
  { id: "PONG", name: "Table Tennis", icon: "🏓" },
];

export default function GamePanel() {
  const [selectedGame, setSelectedGame] = useState<string>("HIGHER_LOWER");

  return (
    <div className="flex-1 w-full bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcade flex flex-col overflow-hidden min-h-0">
      
      {/* Arcade Scoreboard Header */}
      <div className="bg-orbit-subsurface border-b-2 border-orbit-border p-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-orbit-accent" />
          <span className="font-pixel text-xs font-bold tracking-wider text-orbit-text">
            GAME ARENA
          </span>
        </div>

        {/* Retro Scoreboard */}
        <div className="flex items-center gap-4 bg-white border-2 border-orbit-border px-3 py-1 rounded-boxy shadow-arcadeSm">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-orbit-arcadeYellow" />
            <span className="font-pixel text-[10px] text-orbit-text">YOU: 2</span>
          </div>
          <span className="text-orbit-borderMuted font-bold">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-pixel text-[10px] text-orbit-muted">PARTNER: 1</span>
          </div>
        </div>
      </div>

      {/* Game Selector Tabs (Responsive Flex Wrap) */}
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

      {/* Active Game Arena Canvas Area (Fills all remaining height) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white min-h-0">
        <div className="border-2 border-dashed border-orbit-borderMuted rounded-boxy p-8 max-w-sm w-full flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce">
            {AVAILABLE_GAMES.find((g) => g.id === selectedGame)?.icon}
          </span>
          <h3 className="font-pixel text-sm font-bold text-orbit-text">
            {AVAILABLE_GAMES.find((g) => g.id === selectedGame)?.name}
          </h3>
          <p className="text-xs text-orbit-muted">
            Waiting for both players to lock in...
          </p>
          <button className="py-2 px-4 bg-orbit-mint hover:bg-emerald-600 text-white font-pixel text-xs rounded-boxy border-2 border-orbit-border shadow-arcadeSm active:translate-x-[1px] active:translate-y-[1px] transition-all">
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}