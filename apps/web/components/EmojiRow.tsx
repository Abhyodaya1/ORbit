"use client";

import { useState } from "react";

interface EmojiRowProps {
  onSendEmoji?: (emoji: string) => void;
}


const EMOJI_LIST = [
    // Your original row
    "🔥", "🕹️", "👏", "😂", "💀", "🚀", "⚡", "❤️", 
    
    // Hype & Gaming
    "👑", "🏆", "🎯", "🎮", "👾", "💯", "💥", "🎉", 
    
    // Popular Streams & Reactions
    "👀", "🙌", "🤯", "🥶", "🥳", "🥺", "🤔", "💡",
    
    // Fun & Hype Animals
    "🐐", "🐒", "🐸", "🐱"
];


export default function EmojiRow({ onSendEmoji }: EmojiRowProps) {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const handleSendEmoji = (emoji: string) => {
    setActiveReaction(emoji);
    
    // 🚀 Call the parent handler so the socket emits the reaction!
    if (onSendEmoji) {
      onSendEmoji(emoji);
    }
    setTimeout(() => setActiveReaction(null), 1000);
  };

  return (
    <div className="relative flex items-center gap-2 py-1.5 px-3 bg-gradient-to-r from-[#fff1f7] via-[#fce7f3] to-[#fed7ea] border-2 border-orbit-border rounded-boxy shadow-arcadeSm overflow-x-auto">
      <span className="font-pixel text-[10px] text-orbit-text font-bold tracking-wider hidden sm:inline">
        REACT:
      </span>
      <div className="flex items-center gap-2">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendEmoji(emoji)}
            className="text-lg hover:scale-125 active:scale-95 transition-transform p-1 rounded hover:bg-white/80"
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