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

## 📸 Gameplay & Interface Showcase

| 🕹️ Neo-Brutalist Arcade Lobby | 🎭 Celebrity Mystery & 1:1 WebRTC Video |
| :---: | :---: |
| ![Landing Page Lobby](output/Screenshot%202026-10-05%20173728.png) | ![Celebrity Mystery Split Screen](output/Screenshot%202026-10-05%20173500.png) |
| *Neo-Brutalist Lobby with live system telemetry, tactile spawn button & bento grid* | *Side-by-side WebRTC video feeds, Wikipedia pre-warmed portrait & secret role masking* |

| 🎨 Draw & Guess with Floating Reactions | 💬 1:1 Live Chat & Tactile Reactions |
| :---: | :---: |
| ![Draw and Guess Canvas](output/Screenshot%202026-10-05%20173606.png) | ![1:1 Live Chat Bar](output/Screenshot%202026-10-05%20173657.png) |
| *Real-time vector canvas sync with color swatches & floating animated emoji reactions* | *Neo-Brutalist message bubbles, timestamps & tactile reaction strip* |

---

## 🏗️ System Architecture Overview

Orbit is architected as a **distributed real-time system** cleanly separated into a stateless presentation tier, a stateful WebSocket signaling & game engine tier, and an encrypted direct peer-to-peer media plane:

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

    Host <-->|Direct P2P Encrypted Media Stream UDP| Peer
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

---

## ⚙️ Deep-Dive: Backend Architecture & Real-Time Engineering

### 1. Separation of Media Plane vs. Signaling Plane (WebRTC Mesh)
* **Zero Relay Overhead:** High-bandwidth audio and video streams never route through our Node.js server. The signaling server exclusively manages lightweight JSON control events:
  - Session Description Protocol (`webrtc_offer`, `webrtc_answer`) handshakes.
  - Interactive Connectivity Establishment (`ice_candidate`) exchange.
* **Direct P2P Transport:** Once ICE negotiation succeeds via Google STUN servers (`stun:stun.l.google.com:19302`), media streams flow directly peer-to-peer via encrypted UDP (SRTP), ensuring **sub-50ms glass-to-glass latency** with zero server bandwidth consumption.

### 2. Server-Authoritative Game Architecture & Role-Based State Masking
* **Anti-Cheat by Design:** Clients own zero game state. Browser clients transmit lightweight **Intents** (`make_guess`, `paddle_move`, `draw_stroke`), which the server validates against active turn timers, game rules, and coordinate bounds before mutating state.
* **State Masking Engine (`getStateForPlayer`):** 
  - To prevent client inspection via Chrome DevTools Network tabs, the server masks sensitive game fields per player role.
  - In **Celebrity Mystery**, the Speaker receives the full name and Wikipedia portrait URL, while the Guesser receives an obfuscated payload containing only category clues and a placeholder (`?`).
  - In **Draw & Guess**, the Drawer receives the secret word, while the Guesser receives a masked letter-count placeholder (`_ _ _ _ _`).
  - In **Higher or Lower**, the target number is completely hidden from both players until the victory or game-over state is reached.
* **Two-Phase Commit-Reveal Synchronization:** In **Rock Paper Scissors**, players select choices asynchronously. The server holds choices in secret until both players have committed, broadcasting the reveal atomically in the same tick.

### 3. Session Lifecycle & Two-Tier Database Reclamation
* **Stable Identity vs. Ephemeral Sockets:** Raw `socket.id` values change on every network hiccup or page reload. Orbit issues persistent UUID `participantTokens` (stored tab-scoped in `sessionStorage`) and validates them against PostgreSQL.
* **60-Second Disconnect Grace Period:** If a user accidentally refreshes their tab or experiences a brief network drop, the server retains their room slot and game progress in memory for 60 seconds before triggering forfeiture.
* **Two-Tier Reclamation Strategy:**
  1. **Reactive Cascade Deletion:** When both participants disconnect, the room is immediately evicted from memory and an asynchronous Prisma query deletes the room and messages from PostgreSQL.
  2. **Active Reaper Daemon (`reaper.ts`):** A background cron-like daemon executes on server boot and every 15 minutes. It executes `prisma.room.deleteMany()` for any database rooms older than 2 hours whose codes are no longer present in memory, guaranteeing **zero orphan database rows**.

### 4. Sliding-Window Token Bucket Rate Limiting (`rateLimiter.ts`)
* **Targeted Event Loop Protection:** A malicious user or bot could spam thousands of socket events per second, choking the Node.js single-threaded event loop.
* **Keyed by `socket.id` (Zero Collateral Damage):** Rate limiters are keyed strictly by socket connection ID rather than `roomCode`. If a rogue peer floods messages or reactions, only their specific socket is throttled, leaving the host's gameplay and chat completely unaffected.
  - Messages: Maximum 5 events per 2-second rolling window.
  - Reactions: Maximum 8 events per 2-second rolling window.
  - Memory Management: Automated cleanup hooks delete rate limiter tracking buckets immediately upon socket disconnection.

### 5. Dynamic Asset Caching & Pre-Warming
* **Wikipedia REST API Pre-Warming:** Celebrity portraits hardcoded from external CDNs often succumb to 404 bitrot or 403 anti-hotlink blocks.
* **0ms In-Game Cache:** On signaling server boot, `preloadCelebrityImages()` fetches official Wikipedia REST Summary thumbnails with a custom user-agent and caches them in an in-memory `Map`. During gameplay, portrait URLs resolve in **0ms** without outbound network calls during game ticks.
* **Referrer Shielding:** The frontend renders celebrity images with `referrerPolicy="no-referrer"`, preventing browser cross-origin referrer leaks.

### 6. Production Observability & Signal Trapping
* **Liveness & Readiness Heartbeats (`/health`):** Performs an ultra-fast `SELECT 1` query against PostgreSQL, returning `HTTP 200` when the connection pool is healthy or `HTTP 503` if exhausted, enabling container self-healing.
* **Real-Time Telemetry Endpoint (`/api/metrics`):** Exposes system metrics including process uptime, V8 memory heap (`heapUsedMB`, `rssMB`), active room counts, and live socket connection counts.
* **Safe Process Draining:** Catches POSIX `SIGTERM`/`SIGINT` signals to close the HTTP server, disconnect active WebSockets cleanly, flush in-flight database transactions, and disconnect Prisma connection pools without deadlocks.

---

## 🖥️ Deep-Dive: Frontend Architecture & Client-Side Engineering

### 1. Decoupled 60 FPS HTML5 Canvas Physics (`PongCanvas.tsx`)
* **The 40Hz Virtual DOM Bottleneck:** Emitting 40Hz server physics ticks into standard React state (`useState`) triggers 40 full Virtual DOM reconciliations per second, dropping browser frame rates to 15–20 FPS and introducing 100ms+ of input lag.
* **Render Shield & Native RAF Loop:**
  - Game components intercept server ticks into mutable React references (`useRef`), shielding React's reconciliation engine from high-frequency updates.
  - Rendering is offloaded to a browser-native `requestAnimationFrame` loop on an HTML5 `<canvas>`.
  - **0ms Client Prediction:** Local paddle movements update a local position reference immediately, providing 0ms responsive feedback while server roundtrips resolve.
  - **30Hz Monotonic Input Throttling:** Outbound paddle movements are throttled to 33.3ms intervals (`Date.now() - lastEmitTime >= 33.3`), cutting client network traffic by over 70% while locking rendering at **60 FPS**.

### 2. Resilient WebRTC PeerConnection Hook (`useWebRTC.ts`)
* **Asynchronous ICE Candidate Queueing:** ICE candidates frequently arrive from the signaling channel before the browser has completed setting its `RemoteDescription`, causing native WebRTC `InvalidStateError` crashes. Our hook buffers early candidates in a memory queue and flushes them sequentially the instant the remote description resolves.
* **Hardware-Level Track Toggling:** Microphone and camera toggles mutate `MediaStreamTrack.enabled` directly at the hardware driver level, enabling instant mute/unmute without triggering expensive WebRTC renegotiation offer/answer cycles.
* **Automatic Resource Cleanup:** When navigating away or switching rooms, all camera and microphone tracks are stopped (`track.stop()`), peer connections are closed, and media stream bindings are purged from memory.

### 3. Multi-Tab Testing via Tab-Scoped `sessionStorage`
* **Cross-Tab Collision Problem:** Storing tokens in `localStorage` caused second tabs on the same developer machine to read the first tab's `hostToken`, falsely reporting "Room is full! Only 2 players allowed".
* **Tab Isolation:** Shifting token storage to `sessionStorage` ensures each browser tab maintains an independent identity sandbox. Developers and users can run Host and Peer side-by-side in two tabs of the same browser with zero token collisions.

### 4. Neo-Brutalist Arcade Design System
* **Bespoke Tailwind Token System:** Custom configuration in `apps/web/tailwind.config.ts`:
  - `border-orbit-border`: High-contrast `3px solid #1a162b`.
  - `shadow-arcade`: Solid offset drop shadow `4px 4px 0px #1a162b`.
  - `shadow-arcadeLg`: Elevated card shadow `6px 6px 0px #1a162b`.
  - `bg-orbit-cream`: Cozy retro substrate `#f5f0e8`.
* **Google Font Trifecta:**
  - **Headlines & Retro Badges:** `Silkscreen` (Pixel Arcade) with positive letter tracking and optical vertical-align baseline compensation.
  - **Body & Controls:** `Space Grotesk` (Geometric Neo-Grotesque) for crisp legibility.
  - **Telemetry Readouts:** `JetBrains Mono` for hardware status indicators and monospace timers.
* **Optical Baseline Alignment for Pixel Typefaces:** 8-bit fonts like `Silkscreen` possess high cap-height baselines. We engineered sub-pixel padding offsets (`pt-0.5` / `pt-1`) across all badge tokens, guaranteeing pixel labels sit optically centered within thick brutalist borders.
* **Emil Kowalski Physical Button Physics:**
  ```css
  /* Physical Button Press State */
  transition-all duration-150 ease-out
  active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-[0.98]
  ```
  Clicking a button translates it down and right by 4px (`translate-x-1 translate-y-1`) while collapsing its 4px solid drop shadow (`shadow-none`), perfectly mimicking the physical travel depth of an arcade micro-switch.
* **Retro CRT Monitor Video Feeds:** Video tiles feature industrial chassis framing, tactical corner alignment reticles (`⌜ ⌝ ⌞ ⌟`), live telemetry badges (`HOST_FEED // 60FPS`), and hardware toggle switches with tactile click feedback.
* **Floating Emoji Reaction Physics:** Emoji clicks spawn floating reactions that rise with randomized horizontal drift and fade out using CSS keyframe transforms, accompanied by tactile button depression feedback.

---

## 🎮 The 5 Synced Arcade Games

| Game | Real-Time Mechanism | Key Technical Architecture |
| :--- | :--- | :--- |
| **1. Higher or Lower** | Turn-based number deduction | Server bounds checking, anti-cheat target number masking, victory state broadcast |
| **2. Draw & Guess** | HTML5 Canvas vector sync | 30fps throttled coordinate streaming, secret word masking, live guess evaluator |
| **3. Celebrity Mystery** | Verbal clue guessing duel | Turn-clock state machine, Wikipedia REST API pre-warmed image cache, guess limiting |
| **4. Rock Paper Scissors** | Simultaneous reveal duel | Two-phase "Commit-Reveal" state synchronization with countdown timers |
| **5. Table Tennis (Pong)** | 60Hz Physics simulation | Server-authoritative tick loop, 0ms client prediction, React DOM render shield |

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
  - [x] Fun, memorable Pokemon room code generator (`cozy-pikachu-42`, `lofi-squirtle-22`).
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