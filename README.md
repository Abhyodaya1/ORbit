# 🕹️ Orbit — Cozy 1:1 Video Arena & Synced Multiplayer Arcade

> A private, invite-only real-time web space for two people combining **peer-to-peer WebRTC video calling**, **server-authoritative synced arcade games**, and **live chat with emoji quick-reactions**.

Designed with a cozy, lo-fi pixel arcade aesthetic (warm cream `#f4f3fb`, deep plum borders `#2d264f`, soothing neon violet `#7c5ce7`, and matcha mint `#10b981`).

---

## 🌟 Architecture & Engineering Highlights

Orbit is architected as a **distributed real-time system** cleanly separated into a stateless presentation/invite tier, a stateful WebSocket signaling & game engine, and a direct peer-to-peer media plane:

                        ┌─────────────────────────────┐
                          │   Browser (Next.js Client)  │
                          │  React 19 + Tailwind + CSS   │
                          └───────┬───────────────┬───────┘
                                  │               │
                 HTTPS (REST)     │               │  WSS (Socket.IO, persistent)
                                  ▼               ▼
              ┌───────────────────────┐   ┌─────────────────────────────────┐
              │  Next.js API Routes   │   │   Node.js Realtime Server       │
              │  (stateless, per-req) │   │   (stateful, long-running)      │
              ├───────────────────────┤   ├─────────────────────────────────┤
              │ POST /api/invite      │   │ RoomManager (in-memory)          │
              │ POST /api/room/:id/join│  │  - participant token mapping    │
              │ (validate + role)     │   │  - selectedGame + engine state   │
              │                       │   │  - 60s disconnect grace period   │
              └──────────┬────────────┘   │                                  │
                         │                │ Socket Auth & Room Isolation     │
                         │                │                                  │
                         │                │ Event Handlers:                  │
                         │                │  join_room / presence_update     │
                         │                │  webrtc_offer / answer / ice     │
                         │                │  game_action / state_broadcast   │
                         │                │  chat_message / emoji_reaction   │
                         │                └───────────────┬──────────────────┘
                         │                                │
                         │        shared @orbit/db package│ (durable persistence)
                         │        (one Prisma schema)     │
                         ▼                                ▼
              ┌─────────────────────────────────────────────────────┐
              │                  PostgreSQL 18                      │
              │  Room · GameSession · Celebrity · Message           │
              └─────────────────────────────────────────────────────┘

    Browser ⇄ Browser: Direct WebRTC Media Plane (Audio/Video peer-to-peer)


### 🧠 Core Engineering Principles:

1. **Separation of Media Plane vs. Signaling Plane (WebRTC):**
   * High-bandwidth camera and microphone streams never route through our backend server. Once SDP offer/answer handshakes and ICE candidates exchange via Socket.IO, media flows **directly P2P (UDP)** between browsers, minimizing server CPU and eliminating latency.
2. **Stable Participant Identity vs. Ephemeral Socket IDs:**
   * Standard `socket.id`s regenerate on every network hiccup or page reload. Orbit issues persistent UUID `participantTokens` (stored client-side) and verifies them against PostgreSQL. This powers an automatic **60-second reconnection grace period**, preventing accidental session termination.
3. **Server-Authoritative Game Architecture (Anti-Cheat & Zero-Desync):**
   * Clients own zero game state. Clients emit lightweight **Intents** (`make_guess`, `paddle_move`, `draw_stroke`), which the Node.js server validates against rules and clocks before broadcasting state to both players.
   * **State Masking**: The server sanitizes payloads per role (`getStateForPlayer`), ensuring hidden information (like secret numbers or mystery celebrity identities) is never leaked in the network tab.
4. **Monorepo Architecture (npm workspaces):**
   * Shared database models, migrations, and Prisma clients packaged under `@orbit/db` and imported by both Next.js and the Node.js signaling server.

---

## 🎮 The 5 Synced Arcade Games

| Game | Real-Time Mechanism | Key Technical Challenge |
| :--- | :--- | :--- |
| **1. Higher or Lower** | Turn-based number deduction | Anti-cheat state masking, bounds checking, win detection |
| **2. Draw & Guess** | HTML5 Canvas vector sync | Throttled coordinate streaming (30fps), secret word obfuscation |
| **3. Celebrity Mystery** | Verbal clue guessing duel | Turn-clock state machine, PostgreSQL deck queries, guess limiting |
| **4. Rock Paper Scissors** | Simultaneous reveal | Two-phase "Commit-Reveal" state synchronization |
| **5. Table Tennis (Pong)** | 60Hz Physics simulation | Server-authoritative tick loop, paddle collision reconciliation |

---

## 🗺️ Project Roadmap & Phased Progress

- [x] **Phase 0 — Setup & Monorepo Foundation**
  - [x] PostgreSQL 18 catalog configuration & Prisma schema creation.
  - [x] Monorepo npm workspaces setup (`@orbit/db`, `@orbit/web`, `@orbit/signaling-server`).
  - [x] Dual-server architecture: Next.js 15 on port 3000 + Node.js Socket.IO on port 4000.
  - [x] Dynamic CORS resolution supporting `localhost` and local LAN IPs.
- [x] **Phase 1 — Layout & Cozy Pixel-Arcade UI Shell**
  - [x] Custom Tailwind CSS design tokens (soothing lavender-cream, boxy retro borders, tactile drop shadows).
  - [x] Integrated Google Fonts: *"Silkscreen"* (pixel arcade display) & *"Space Grotesk"* (clean typography).
  - [x] Fully responsive Flexbox/Grid layout (stacked 1:1 video tiles, arcade game arena, emoji reaction strip, chat bar).
- [x] **Phase 2 — Room Creation & Token-Based Authentication**
  - [x] Fun, memorable Pokemon room code generator (`cozy-pikachu-42`, `retro-gengar-18`).
  - [x] Server-side `RoomManager` with 60-second disconnect grace period.
  - [x] Stable `hostToken` / `peerToken` mapping to survive browser refreshes.
  - [x] Real-time socket presence updates (`connecting` / `connected` / `disconnected`).
- [ ] **Phase 3 — WebRTC 1:1 Video & Audio Calling**
  - [ ] Custom `useWebRTC` hook utilizing `RTCPeerConnection` & Google STUN.
  - [ ] SDP Offer / Answer and asynchronous ICE candidate signaling.
  - [ ] Live camera feed binding to V1 (Local) and V2 (Remote) video tiles.
  - [ ] Microphone/camera toggle state and cleanup on component unmount.
- [ ] **Phase 4 — Server-Authoritative Multiplayer Game Suite**
  - [ ] Extensible game engine framework with state sanitization.
  - [ ] Real-time gameplay implementation for all 5 arcade games.
- [ ] **Phase 5 — Real-Time Chat & Floating Emoji Quick-Reactions**
  - [ ] Socket.IO chat messaging with PostgreSQL history persistence.
  - [ ] Pop-up floating emoji reaction animations.
- [ ] **Phase 6 — Production Hardening & Cloud Deployment**
  - [ ] Self-hosted Linux VM setup (Oracle Cloud Always-Free Tier).
  - [ ] Nginx reverse proxy with SSL/TLS termination (Let's Encrypt certbot).
  - [ ] PM2 process manager for continuous uptime.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router, React 19, TypeScript)
* **Styling:** Tailwind CSS, PostCSS, Lucide Icons, Google Fonts (Silkscreen)
* **Realtime Signaling & Games:** Node.js, Express, Socket.IO
* **Video/Audio Streaming:** WebRTC (`RTCPeerConnection`, Google STUN)
* **Database & ORM:** PostgreSQL 18, Prisma ORM
* **Monorepo:** npm workspaces

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
* Node.js v20+ 
* PostgreSQL 18 running locally on port 5432

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/your-username/orbit.git
cd orbit
npm install 