export interface PongState {
  gameType: "PONG";
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  paddles: { hostY: number; peerY: number; width: number; height: number };
  court: { width: number; height: number };
  scores: { HOST: number; PEER: number };
  status: "PLAYING" | "FINISHED";
  winner: "HOST" | "PEER" | null;
}

export class PongGame {
  private hostToken: string;
  private peerToken: string;

  // Virtual Canvas Dimension: 800 x 500
  public readonly COURT_WIDTH = 800;
  public readonly COURT_HEIGHT = 500;
  public readonly PADDLE_WIDTH = 14;
  public readonly PADDLE_HEIGHT = 90;
  public readonly BALL_RADIUS = 8;
  public readonly WINNING_SCORE = 5;

  private ball = { x: 400, y: 250, vx: 5, vy: 3, radius: 8 };
  private hostPaddleY = 205; // (500 - 90) / 2
  private peerPaddleY = 205;
  private scores = { HOST: 0, PEER: 0 };
  private status: "PLAYING" | "FINISHED" = "PLAYING";
  private winner: "HOST" | "PEER" | null = null;

  private tickInterval: NodeJS.Timeout | null = null;
  private onTick?: (state: PongState) => void;

  constructor(hostToken: string, peerToken: string, onTick?: (state: PongState) => void) {
    this.hostToken = hostToken;
    this.peerToken = peerToken;
    this.onTick = onTick;
    this.resetBall(1);
    this.startLoop();
  }

  // Starts the 40 FPS (25ms) server physics tick
  private startLoop() {
    this.stop();
    this.tickInterval = setInterval(() => {
      this.tick();
      if (this.onTick) {
        this.onTick(this.getState());
      }
    }, 25);
  }

  public stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // Update paddle position from client (normalized 0.0 to 1.0)
  public updatePaddle(token: string, normalizedY: number) {
    const clampedY = Math.max(0, Math.min(1, normalizedY));
    const targetY = clampedY * (this.COURT_HEIGHT - this.PADDLE_HEIGHT);

    if (token === this.hostToken) {
      this.hostPaddleY = targetY;
    } else if (token === this.peerToken) {
      this.peerPaddleY = targetY;
    }
  }

  // Ball & Collision Physics
  private tick() {
    if (this.status !== "PLAYING") return;

    // 1. Move Ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // 2. Top & Bottom Wall Bounces
    if (this.ball.y - this.BALL_RADIUS <= 0) {
      this.ball.y = this.BALL_RADIUS;
      this.ball.vy = Math.abs(this.ball.vy);
    } else if (this.ball.y + this.BALL_RADIUS >= this.COURT_HEIGHT) {
      this.ball.y = this.COURT_HEIGHT - this.BALL_RADIUS;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    // 3. Left Paddle Collision (Host: x=15 to x=29)
    const hostPaddleX = 15;
    if (
      this.ball.x - this.BALL_RADIUS <= hostPaddleX + this.PADDLE_WIDTH &&
      this.ball.x + this.BALL_RADIUS >= hostPaddleX &&
      this.ball.vx < 0
    ) {
      if (
        this.ball.y >= this.hostPaddleY - this.BALL_RADIUS &&
        this.ball.y <= this.hostPaddleY + this.PADDLE_HEIGHT + this.BALL_RADIUS
      ) {
        // Dynamic angle reflection based on where ball struck the paddle
        const hitOffset = (this.ball.y - (this.hostPaddleY + this.PADDLE_HEIGHT / 2)) / (this.PADDLE_HEIGHT / 2);
        this.ball.vx = Math.min(Math.abs(this.ball.vx) * 1.06, 14); // Accelerate
        this.ball.vy = hitOffset * 7;
        this.ball.x = hostPaddleX + this.PADDLE_WIDTH + this.BALL_RADIUS;
      }
    }

    // 4. Right Paddle Collision (Peer: x=771 to x=785)
    const peerPaddleX = this.COURT_WIDTH - 15 - this.PADDLE_WIDTH;
    if (
      this.ball.x + this.BALL_RADIUS >= peerPaddleX &&
      this.ball.x - this.BALL_RADIUS <= peerPaddleX + this.PADDLE_WIDTH &&
      this.ball.vx > 0
    ) {
      if (
        this.ball.y >= this.peerPaddleY - this.BALL_RADIUS &&
        this.ball.y <= this.peerPaddleY + this.PADDLE_HEIGHT + this.BALL_RADIUS
      ) {
        const hitOffset = (this.ball.y - (this.peerPaddleY + this.PADDLE_HEIGHT / 2)) / (this.PADDLE_HEIGHT / 2);
        this.ball.vx = -Math.min(Math.abs(this.ball.vx) * 1.06, 14); // Accelerate
        this.ball.vy = hitOffset * 7;
        this.ball.x = peerPaddleX - this.BALL_RADIUS;
      }
    }

    // 5. Scoring
    if (this.ball.x < 0) {
      // Peer scores!
      this.scores.PEER += 1;
      this.checkWinnerOrReset(1);
    } else if (this.ball.x > this.COURT_WIDTH) {
      // Host scores!
      this.scores.HOST += 1;
      this.checkWinnerOrReset(-1);
    }
  }

  private checkWinnerOrReset(serveDirection: number) {
    if (this.scores.HOST >= this.WINNING_SCORE) {
      this.status = "FINISHED";
      this.winner = "HOST";
      this.stop();
    } else if (this.scores.PEER >= this.WINNING_SCORE) {
      this.status = "FINISHED";
      this.winner = "PEER";
      this.stop();
    } else {
      this.resetBall(serveDirection);
    }
  }

  private resetBall(direction: number) {
    this.ball.x = this.COURT_WIDTH / 2;
    this.ball.y = this.COURT_HEIGHT / 2;
    this.ball.vx = direction * 5;
    this.ball.vy = (Math.random() * 4 - 2);
  }

  public getState(): PongState {
    return {
      gameType: "PONG",
      ball: this.ball,
      paddles: {
        hostY: this.hostPaddleY,
        peerY: this.peerPaddleY,
        width: this.PADDLE_WIDTH,
        height: this.PADDLE_HEIGHT,
      },
      court: { width: this.COURT_WIDTH, height: this.COURT_HEIGHT },
      scores: this.scores,
      status: this.status,
      winner: this.winner,
    };
  }
}