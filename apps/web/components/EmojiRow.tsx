"use client";

import { useState } from "react";

const EMOJI_LIST = ["🔥", "🕹️", "👏", "😂", "💀", "🚀", "⚡", "❤️"];

export default function EmojiRow() {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const handleSendEmoji = (emoji: string) => {
    setActiveReaction(emoji);
    // Auto-clear animation after 1 second
    setTimeout(() => setActiveReaction(null), 1000);
  };

  return (
    <div className="relative flex items-center gap-2 py-1.5 px-3 bg-orbit-surface border-2 border-orbit-border rounded-boxy shadow-arcadeSm overflow-x-auto">
      <span className="font-pixel text-[10px] text-orbit-muted tracking-wider hidden sm:inline">
        REACT:
      </span>
      <div className="flex items-center gap-2">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendEmoji(emoji)}
            className="text-lg hover:scale-125 active:scale-95 transition-transform p-1 rounded hover:bg-orbit-subsurface"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Pop animation when clicked */}
      {activeReaction && (
        <span className="absolute right-4 -top-8 text-2xl animate-bounce">
          {activeReaction}
        </span>
      )}
    </div>
  );
}