"use client";

import React from "react";

export default function CosmicArcadeBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Atmospheric Dreamy Lavender & Baby Pink Radial Gradients */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(255, 214, 230, 0.5) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 20%, rgba(220, 210, 255, 0.55) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 85%, rgba(255, 222, 235, 0.45) 0%, transparent 45%),
            radial-gradient(ellipse at 15% 85%, rgba(206, 195, 255, 0.5) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, #faf8ff 0%, #f3effc 100%)
          `
        }}
      />

      {/* 2. Delicate Retro Arcade Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(124, 92, 231, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 118, 117, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* 3. Shooting Star / Comet */}
      <div className="absolute -top-10 left-[10%] w-48 h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-violet-400 rounded-full rotate-[25deg] animate-shooting-star" />

      {/* 4. Planet 1: Pastel Saturn with Rings (Top-Left) */}
      <div className="absolute top-[8%] left-[5%] md:left-[8%] animate-float-slow">
        <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="filter drop-shadow-[0_8px_16px_rgba(209,199,252,0.6)]">
          {/* Ring Back */}
          <ellipse cx="60" cy="45" rx="55" ry="16" stroke="rgba(255, 182, 217, 0.85)" strokeWidth="6" strokeDasharray="140 100" transform="rotate(-15 60 45)" />
          <ellipse cx="60" cy="45" rx="50" ry="13" stroke="rgba(196, 181, 253, 0.7)" strokeWidth="3" transform="rotate(-15 60 45)" />
          {/* Planet Body */}
          <circle cx="60" cy="45" r="28" fill="url(#saturnGradient)" stroke="#2d264f" strokeWidth="2.5" />
          {/* Surface Stripes */}
          <path d="M35 40 Q60 48 85 40" stroke="#fca5c6" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <path d="M36 50 Q60 58 84 50" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          {/* Ring Front */}
          <path d="M8 58 Q60 76 112 32" stroke="rgba(255, 182, 217, 0.95)" strokeWidth="6" strokeLinecap="round" />
          <path d="M12 56 Q60 73 108 34" stroke="rgba(196, 181, 253, 0.85)" strokeWidth="3" strokeLinecap="round" />
          {/* Gradient Defs */}
          <defs>
            <linearGradient id="saturnGradient" x1="32" y1="20" x2="88" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffd8e8" />
              <stop offset="50%" stopColor="#e0d4fc" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 5. Planet 2: Soft Cratered Pastel Moon (Top-Right) */}
      <div className="absolute top-[12%] right-[6%] md:right-[10%] animate-float-reverse">
        <svg width="86" height="86" viewBox="0 0 86 86" fill="none" className="filter drop-shadow-[0_6px_14px_rgba(254,205,228,0.7)]">
          <circle cx="43" cy="43" r="36" fill="url(#moonGradient)" stroke="#2d264f" strokeWidth="2.5" />
          {/* Pastel Craters */}
          <circle cx="32" cy="30" r="7" fill="#fbcfe8" stroke="#2d264f" strokeWidth="1.5" opacity="0.8" />
          <circle cx="56" cy="46" r="9" fill="#fbcfe8" stroke="#2d264f" strokeWidth="1.5" opacity="0.8" />
          <circle cx="36" cy="58" r="5" fill="#fbcfe8" stroke="#2d264f" strokeWidth="1.5" opacity="0.8" />
          <circle cx="52" cy="24" r="4" fill="#fbcfe8" stroke="#2d264f" strokeWidth="1.2" opacity="0.8" />
          <defs>
            <linearGradient id="moonGradient" x1="15" y1="10" x2="70" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff0f7" />
              <stop offset="50%" stopColor="#fed7e2" />
              <stop offset="100%" stopColor="#e9d8fd" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 6. Planet 3: Cute Mint & Lavender Orb (Bottom-Left) */}
      <div className="absolute bottom-[14%] left-[6%] md:left-[10%] animate-float-slow">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" className="filter drop-shadow-[0_6px_12px_rgba(167,243,208,0.5)]">
          <circle cx="35" cy="35" r="26" fill="url(#orbGradient)" stroke="#2d264f" strokeWidth="2" />
          <path d="M12 35 C20 45, 50 45, 58 35" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="44" cy="24" r="3" fill="#ffffff" opacity="0.9" />
          <defs>
            <linearGradient id="orbGradient" x1="10" y1="10" x2="60" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d1fae5" />
              <stop offset="50%" stopColor="#c7d2fe" />
              <stop offset="100%" stopColor="#fbcfe8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 7. Floating Retro Arcade Pixel Relics (Bottom-Right & Margins) */}
      <div className="absolute bottom-[16%] right-[8%] md:right-[12%] animate-float-reverse opacity-85">
        <div className="bg-white/80 backdrop-blur-sm border-2 border-orbit-border p-2.5 rounded-boxy shadow-arcadeSm flex items-center gap-1.5 rotate-6">
          <span className="text-xl">🕹️</span>
          <span className="font-pixel text-[10px] text-orbit-accent font-bold">ORBIT-84</span>
        </div>
      </div>

      <div className="absolute top-[48%] left-[3%] md:left-[5%] animate-float-slow opacity-80 hidden sm:block">
        <div className="bg-pink-100/80 backdrop-blur-sm border-2 border-orbit-border p-2 rounded-boxy shadow-arcadeSm -rotate-6">
          <span className="text-lg">💖</span>
        </div>
      </div>

      <div className="absolute top-[52%] right-[3%] md:right-[5%] animate-float-reverse opacity-80 hidden sm:block">
        <div className="bg-violet-100/80 backdrop-blur-sm border-2 border-orbit-border p-2 rounded-boxy shadow-arcadeSm rotate-12">
          <span className="text-lg">✨</span>
        </div>
      </div>

      {/* 8. Twinkling 4-Point Pixel Stars Scattered Around */}
      {/* Top Left Area */}
      <div className="absolute top-[20%] left-[22%] text-pink-400 text-xl font-bold animate-twinkle" style={{ animationDelay: "0.2s" }}>
        ✦
      </div>
      <div className="absolute top-[32%] left-[12%] text-violet-400 text-sm font-bold animate-twinkle" style={{ animationDelay: "1.1s" }}>
        ✧
      </div>
      <div className="absolute top-[10%] left-[38%] text-amber-300 text-base font-bold animate-twinkle" style={{ animationDelay: "1.8s" }}>
        ★
      </div>

      {/* Top Right Area */}
      <div className="absolute top-[18%] right-[24%] text-violet-500 text-2xl font-bold animate-twinkle" style={{ animationDelay: "0.7s" }}>
        ✦
      </div>
      <div className="absolute top-[28%] right-[14%] text-pink-400 text-base font-bold animate-twinkle" style={{ animationDelay: "2.3s" }}>
        ★
      </div>
      <div className="absolute top-[8%] right-[35%] text-indigo-400 text-sm font-bold animate-twinkle" style={{ animationDelay: "1.4s" }}>
        ✧
      </div>

      {/* Bottom Area */}
      <div className="absolute bottom-[28%] left-[18%] text-pink-400 text-lg font-bold animate-twinkle" style={{ animationDelay: "0.9s" }}>
        ★
      </div>
      <div className="absolute bottom-[10%] left-[28%] text-violet-400 text-base font-bold animate-twinkle" style={{ animationDelay: "2.1s" }}>
        ✦
      </div>
      <div className="absolute bottom-[24%] right-[20%] text-amber-300 text-xl font-bold animate-twinkle" style={{ animationDelay: "1.6s" }}>
        ✦
      </div>
      <div className="absolute bottom-[12%] right-[32%] text-pink-400 text-sm font-bold animate-twinkle" style={{ animationDelay: "0.4s" }}>
        ✧
      </div>
    </div>
  );
}

