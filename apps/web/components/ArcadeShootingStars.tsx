"use client";

import React from "react";

const ARENA_STARS = [
  { id: 1, top: "4%", left: "6%", angle: "34deg", trailWidth: "80px", anim: "animate-arena-streak-medium", delay: "0.2s" },
  { id: 2, top: "16%", left: "48%", angle: "30deg", trailWidth: "110px", anim: "animate-arena-streak-long", delay: "2.1s" },
  { id: 3, top: "32%", left: "2%", angle: "38deg", trailWidth: "65px", anim: "animate-arena-streak-fast", delay: "1.2s" },
  { id: 4, top: "8%", left: "74%", angle: "32deg", trailWidth: "95px", anim: "animate-arena-streak-short", delay: "3.6s" },
  { id: 5, top: "52%", left: "20%", angle: "28deg", trailWidth: "85px", anim: "animate-arena-streak-long", delay: "4.8s" },
  { id: 6, top: "2%", left: "28%", angle: "40deg", trailWidth: "120px", anim: "animate-arena-streak-fast", delay: "2.7s" },
  { id: 7, top: "64%", left: "55%", angle: "35deg", trailWidth: "70px", anim: "animate-arena-streak-medium", delay: "5.5s" },
  { id: 8, top: "42%", left: "80%", angle: "30deg", trailWidth: "90px", anim: "animate-arena-streak-short", delay: "0.9s" },
  { id: 9, top: "74%", left: "10%", angle: "33deg", trailWidth: "100px", anim: "animate-arena-streak-fast", delay: "3.2s" },
];

export default function ArcadeShootingStars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 bg-gradient-to-br from-[#fff1f7] via-[#fce7f3] to-[#fed7ea]">
      {/* Delicate Retro Pixel Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#f472b6_1.5px,transparent_1.5px)] [background-size:22px_22px] opacity-35" />

      {/* Subtle CRT Scanlines */}
      <div className="absolute inset-0 scanlines opacity-10" />

      {/* Multiple Arcade Shooting Stars ONLY */}
      {ARENA_STARS.map((star) => (
        <div
          key={star.id}
          className="absolute"
          style={{
            top: star.top,
            left: star.left,
            transform: `rotate(${star.angle})`,
          }}
        >
          <div
            className={`flex items-center ${star.anim}`}
            style={{ animationDelay: star.delay }}
          >
            {/* Glowing Shooting Star Comet Trail */}
            <div
              className="h-[2px] bg-gradient-to-r from-transparent via-[#f472b6] to-white rounded-full shadow-[0_0_8px_rgba(244,114,182,0.8)]"
              style={{ width: star.trailWidth }}
            />
            {/* Diamond Pixel Star Head with Neon Halo */}
            <div className="w-2.5 h-2.5 bg-white rotate-45 rounded-[1px] shadow-[0_0_8px_#ec4899,0_0_16px_#f43f5e] -ml-1 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
