# 🕹️ Orbit — Cozy 1:1 Video Arena & Synced Multiplayer Arcade

> A private, invite-only real-time web living room for two people combining **peer-to-peer WebRTC video calling**, **server-authoritative synchronized arcade games**, and **live chat with emoji quick-reactions** — wrapped in an authentic, high-tactility **Neo-Brutalist Arcade aesthetic**.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-white?style=flat-square&logo=socket.io)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Peer--to--Peer-333333?style=flat-square&logo=webrtc)](https://webrtc.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Caddy-Automated%20TLS-00ADD8?style=flat-square&logo=caddy)](https://caddyserver.com/)

---

## 🌟 Architecture & Engineering Highlights

Orbit is architected as a **distributed real-time system** cleanly separated into a stateless presentation/invite tier, a stateful WebSocket signaling & game engine, and a direct peer-to-peer media plane:

```mermaid
flowchart TD
    subgraph Clients ["Two-Player WebRTC Mesh"]
        Host["Host Browser (React 19 / Canvas)"]
        Peer["Peer Browser (React 19 / Canvas)"]
    end

    subgraph ReverseProxy ["Edge Ingress & Automated TLS"]
        Caddy["Caddy Server (orbit-arcade.duckdns.org)"]
    end

    subgraph InternalNet ["Internal Docker Compose Network"]
        Web["Next.js 15 Web Frontend (:3000)"]
        WS["Socket.IO Signaling Server (:4000)"]
        RL["Token Bucket Rate Limiter (Per Socket)"]
        State["In-Memory Room State & Game Engines"]
        DB[("PostgreSQL 16 via Prisma (:5432)")]
        Reaper["Background Reaper Daemon (15m Interval)"]
    end

    subgraph External ["External Content APIs"]
        Wiki["Wikipedia Summary REST API"]
        Cache["In-Memory Thumbnail Pre-warm Cache"]
    end

    Host <-->|Direct Encrypted P2P Media Stream (UDP)| Peer
    Host -->|HTTPS / WSS| Caddy
    Peer -->|HTTPS / WSS| Caddy
    Caddy -->|Reverse Proxy /| Web
    Caddy -->|Reverse Proxy /socket.io| WS
    Caddy -->|Reverse Proxy /api/room| WS
    WS --> RL
    RL --> State
    State -->|Async Non-Blocking| DB
    Web -->|Prisma Client| DB
    Reaper -->|deleteMany Stale Rooms| DB
    WS -->|Boot Pre-warm| Wiki
    Wiki --> Cache
    Cache -->|0ms Lookup| State
```

### 🧠 Core Engineering Principles:

1. **Separation of Media Plane vs. Signaling Plane (WebRTC):**
   * High-bandwidth camera and microphone streams never route through our backend server. Once SDP offer/answer handshakes and ICE candidates exchange via Socket.IO, media flows **directly P2P (UDP)** between browsers, minimizing server CPU and eliminating latency.
2. **Stable Participant Identity vs. Ephemeral Socket IDs:**
   * Standard `socket.id`s regenerate on every network hiccup or page reload. Orbit issues persistent UUID `participantTokens` (stored tab-scoped in `sessionStorage`) and verifies them against PostgreSQL. This powers an automatic **60-second reconnection grace period**, preventing accidental session termination while isolating multiple tabs on the same machine.
3. **Server-Authoritative Game Architecture (Anti-Cheat & Zero-Desync):**
   * Clients own zero game state. Clients emit lightweight **Intents** (`make_guess`, `paddle_move`, `draw_stroke`), which the Node.js server validates against rules and clocks before broadcasting state to both players.
   * **State Masking**: The server sanitizes payloads per role (`getStateForPlayer`), ensuring hidden information (like secret numbers or mystery celebrity identities) is never leaked in the network tab.
4. **Decoupled 60 FPS Canvas Physics:**
   * Fast-paced games like Pong bypass React's Virtual DOM reconciliation loop entirely. The 40Hz server physics ticks are held in mutable refs and rendered inside a browser-native `requestAnimationFrame` loop with 0ms client prediction, maintaining locked 60 FPS performance without React state overhead.
5. **Monorepo Architecture (npm workspaces):**
   * Shared database models, migrations, and Prisma clients packaged under `@orbit/db` and imported cleanly by both Next.js and the Node.js signaling server.

---

## 🎮 The 5 Synced Arcade Games

| Game | Real-Time Mechanism | Key Technical Challenge |
| :--- | :--- | :--- |
| **1. Higher or Lower** | Turn-based number deduction | Anti-cheat state masking, bounds checking, win detection |
| **2. Draw & Guess** | HTML5 Canvas vector sync | Throttled coordinate streaming (30fps), secret word obfuscation |
| **3. Celebrity Mystery** | Verbal clue guessing duel | Turn-clock state machine, Wikipedia REST API pre-warmed cache, guess limiting |
| **4. Rock Paper Scissors** | Simultaneous reveal duel | Two-phase "Commit-Reveal" state synchronization |
| **5. Table Tennis (Pong)** | 60Hz Physics simulation | Server-authoritative tick loop, 0ms client prediction, React DOM render shield |

---

## 🎨 Neo-Brutalist Arcade Design System

Orbit features a bespoke **Neo-Brutalist Arcade UI**, fusing nostalgic 8-bit arcade aesthetics with clean, physical, high-performance web craftsmanship:

* **3px High-Contrast Borders & Solid Drop Shadows:** Every container, card, and button uses thick `3px solid #1a162b` borders paired with solid offset arcade drop shadows (`4px 4px 0px #1a162b`, expanding to `6px 6px 0px #1a162b` on elevated cards).
* **Physical Tactile Press States (Emil Kowalski Philosophy):** Buttons feature realistic mechanical button depressions: clicking a button physically translates it down and right by 4px (`active:translate-x-1 active:translate-y-1`) while collapsing its drop shadow to zero (`active:shadow-none`), giving the user immediate, tactile physical feedback.
* **Retro CRT Monitor Video Feeds:** WebRTC video tiles are styled as retro CRT terminal chassis with corner alignment reticles (`⌜ ⌝ ⌞ ⌟`), live status telemetry badges (`HOST_FEED // 60FPS`), and tactile toggle micro-switches for Mic and Camera.
* **Typographic Hierarchy & Contrast:**
  * **Headlines & Badges:** `Silkscreen` (Pixel Arcade) with positive letter tracking and optical vertical-align baseline compensation.
  * **Body & Actions:** `Space Grotesk` (Geometric Neo-Grotesque) for maximum legibility.
  * **Telemetry & System Data:** `JetBrains Mono` for monospace hardware readouts and status metrics.
* **Calibrated Color Substrates:**
  * Background Substrate: Cozy retro cream (`#f5f0e8`)
  * Chassis Panels: Warm cream-white (`#faf7f2`)
  * Accent Colors: Arcade Mint (`#10b981`), Retro Lavender (`#8b5cf6`), Cyber Amber (`#f59e0b`), Neon Coral (`#ef4444`), and Cosmic Blue (`#3b82f6`).

---

## 🗺️ Project Roadmap & Phased Progress

- [x] **Phase 0 — Setup & Monorepo Foundation**
  - [x] PostgreSQL 16/18 catalog configuration & Prisma schema creation.
  - [x] Monorepo npm workspaces setup (`@orbit/db`, `@orbit/web`, `@orbit/signaling-server`).
  - [x] Dual-server architecture: Next.js 15 on port 3000 + Node.js Socket.IO on port 4000.
  - [x] Dynamic CORS resolution supporting `localhost`, local LAN IPs, and public domains.
- [x] **Phase 1 — Layout & Neo-Brutalist UI Shell**
  - [x] Custom Tailwind CSS design tokens (arcade borders, offset drop shadows, calibrated palette).
  - [x] Integrated Google Fonts: *Silkscreen*, *Space Grotesk*, and *JetBrains Mono*.
  - [x] Fully responsive Asymmetric Bento Grid layout.
- [x] **Phase 2 — Room Creation & Token-Based Authentication**
  - [x] Fun, memorable Pokemon room code generator (`cozy-pikachu-42`, `retro-gengar-18`).
  - [x] Server-side `RoomManager` with 60-second disconnect grace period.
  - [x] Tab-scoped `sessionStorage` token isolation to support concurrent local tabs without collisions.
  - [x] Real-time socket presence updates (`connecting` / `connected` / `disconnected`).
- [x] **Phase 3 — WebRTC 1:1 Video & Audio Calling**
  - [x] Custom `useWebRTC` hook utilizing `RTCPeerConnection` & Google STUN servers.
  - [x] SDP Offer / Answer and asynchronous ICE candidate signaling over Socket.IO.
  - [x] Retro CRT terminal stream monitors with hardware toggle switches for Mic & Camera.
  - [x] Micro-switch hardware controls with instant tactile click feedback and track muting.
- [x] **Phase 4 — Server-Authoritative Multiplayer Game Suite**
  - [x] Extensible game engine framework with state sanitization per player role.
  - [x] Real-time gameplay implementation for all 5 arcade games.
  - [x] Decoupled 60 FPS HTML5 Canvas Pong loop with 0ms client-side prediction.
  - [x] In-memory pre-warmed Wikipedia REST API image cache for Celebrity Mystery.
- [x] **Phase 5 — Real-Time Chat & Floating Emoji Quick-Reactions**
  - [x] Socket.IO chat messaging with PostgreSQL history persistence.
  - [x] Pop-up floating emoji reaction animations with tactile button triggers.
  - [x] Token-bucket rate limiter per `socket.id` protecting server event loops against flooding.
- [x] **Phase 6 — Production Containerization & Cloud Deployment**
  - [x] Multi-stage Dockerfiles (`Dockerfile.web`, `Dockerfile.signaling`) with Next.js standalone SSR output.
  - [x] Docker Compose orchestration with isolated internal bridge networking (`orbit-net`).
  - [x] Caddy 2 reverse proxy with automated Let's Encrypt TLS/SSL termination for `orbit-arcade.duckdns.org`.
  - [x] Liveness & readiness probes (`/health`) and real-time metrics telemetry (`/api/metrics`).
  - [x] Background Reaper daemon for automatic deletion of stale database records.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router, React 19, TypeScript)
* **Styling & Motion:** Tailwind CSS, PostCSS, Lucide Icons, Google Fonts (Silkscreen, Space Grotesk, JetBrains Mono)
* **Realtime Signaling & Game Engines:** Node.js, Express, Socket.IO 4.8
* **Video/Audio Streaming:** WebRTC (`RTCPeerConnection`, Google STUN)
* **Database & Persistence:** PostgreSQL 16, Prisma ORM
* **Containerization & Ingress:** Docker, Docker Compose, Caddy 2 (Automated TLS)
* **Monorepo Tooling:** npm workspaces

---

## 🚀 Getting Started

### Option A: Local Development

#### 1. Prerequisites
* Node.js v20+
* PostgreSQL 16 or 18 running locally on port 5432

#### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/your-username/orbit.git
cd orbit

# Install monorepo dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit DATABASE_URL in packages/db/.env to match your local PostgreSQL credentials

# Push Prisma schema to local database
npm run db:push
npm run db:generate
```

#### 3. Run Development Servers
```bash
# Start all services concurrently (Web on :3000, Signaling on :4000)
npm run dev
```

Visit `http://localhost:3000` in your browser. Open an Incognito window or second tab to test 1:1 video calling and multiplayer arcade games side-by-side!

---

### Option B: Production Deployment (Docker + Caddy + DuckDNS)

Orbit is fully containerized and production-ready for self-hosting on any cloud VPS (Oracle Cloud Always-Free, DigitalOcean, AWS EC2, or Hetzner).

#### 1. Set Up DuckDNS Domain
1. Log in to [DuckDNS](https://www.duckdns.org/) and create a domain (e.g., `orbit-arcade.duckdns.org`).
2. Point the domain's A record to your VPS's public IP address.

#### 2. Configure Production Environment
Create a `.env` file in the project root:
```env
POSTGRES_USER=orbit
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=orbit
DATABASE_URL=postgresql://orbit:your_secure_password_here@postgres:5432/orbit?schema=public
NEXT_PUBLIC_SIGNALING_URL=https://orbit-arcade.duckdns.org
DOMAIN=orbit-arcade.duckdns.org
```

#### 3. Launch via Docker Compose
```bash
# Build and start all 4 services in the background
docker compose up -d --build
```

Caddy will automatically request and install a Let's Encrypt SSL/TLS certificate, route incoming HTTPS traffic to Next.js, and proxy WebSocket connections (`/socket.io`) to the Node.js signaling server.

#### 4. Useful Production Commands
```bash
# View aggregated service logs
docker compose logs -f

# Check container health and memory usage
docker compose ps

# Stop all services cleanly
docker compose down
```

---

## 🔬 UI Engineering & AI Agents Retrospective: "Engineered, Not Vibe Coded"

Rather than relying on generic AI "vibe coding" — where an LLM hallucinates arbitrary CSS styles, creates inconsistent margins, and generates non-functional mockup aesthetics — the entire interface and interaction model of Orbit was crafted using a **disciplined design engineering toolchain** powered by three specialized AI design skills:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DISCIPLINED DESIGN PIPELINE                       │
├────────────────────────────────────────────────────────────────────────┤
│  1. pbakaus/impeccable      │  Design Director & Pre-Flight Linter     │
│  2. Leonxlnx/taste-skill    │  Design System Architect & Token Engine  │
│  3. emilkowalski/skills     │  Physical Motion & Physics Interaction   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. `pbakaus/impeccable` — The Strict Design Director
* **Audit-First Rule:** Before writing code, the system executed static AST audits (`impeccable detect`) to enforce layout constraints and catch visual defects.
* **Typographic Rigor (`/typeset`):** Eliminated overlapping lines caused by tight tracking, balanced font scaling across breakpoints, and enforced strict typographical hierarchy across all screens.
* **Optical Spacing & Geometry (`/polish`):** Removed "fake screenshot slop". Container dimensions were calibrated so that thick 3px brutalist borders never clipped text, and container heights were mathematically synchronized (`h-12` matching on inputs and triggers).

### 2. `Leonxlnx/taste-skill` — Design System & Layout Variance
* **Token-Driven Architecture:** Injected strict design tokens into Tailwind (`border-orbit-border`, `shadow-arcade`, `shadow-arcadeLg`, `display-hero`, `telemetry`).
* **Asymmetric Bento Grid:** Replaced generic repeating card rows with an intentional, asymmetric bento layout (a 4-column active Pong mini-court paired with 2-column arcade game teaser cards).
* **Optical Baseline Alignment for Pixel Fonts:** Silkscreen and other pixel display typefaces have an unusually high cap-height baseline. `taste-skill` enforced sub-pixel top padding offsets (`pt-0.5` / `pt-1`) so pixel text sits optically centered inside bordered badges and buttons.
* **Substrate Color Calibration:** Prevented harsh `#000000` pitch blacks; calibrated background substrates to warm retro cream (`#f5f0e8`) and high-contrast dark plum borders (`#1a162b`).

### 3. `emilkowalski/skills` — Physical Tactile Motion & 60 FPS Micro-Interactions
* **The Mechanical Button Depression:** Emil Kowalski's philosophy states that software should feel like a physical instrument. Every interactive element implements a true mechanical press:
  ```css
  /* Physical Button Press State */
  transition-all duration-150 ease-out
  active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-[0.98]
  ```
  Clicking a button translates it down and right by 4px (`translate-x-1 translate-y-1`) while simultaneously collapsing its 4px solid drop shadow (`shadow-none`), perfectly mimicking the depression of a physical arcade micro-switch.
* **Hardware-Accelerated Transforms:** All transitions are isolated to `transform` and `box-shadow` with `transform-gpu`, guaranteeing butter-smooth 60 FPS motion without triggering browser layout reflows.
* **Spring Hover Feedback:** Game cards elevate smoothly on hover (`hover:-translate-y-1 hover:shadow-arcadeLg`), creating an intuitive, tactile sense of physical depth.

---

## 👨‍💻 Author & Maintainer

* **Author:** Abhyodaya Singh
* **Email:** [abhyodayasingh00@gmail.com](mailto:abhyodayasingh00@gmail.com)
* **Domain:** [orbit-arcade.duckdns.org](https://orbit-arcade.duckdns.org)