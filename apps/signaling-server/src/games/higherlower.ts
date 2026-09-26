export interface GuessHistory {
  guesserRole: "HOST" | "PEER";
  guess: number;
  result: "HIGHER" | "LOWER" | "CORRECT";
  timestamp: number;
}

export interface HigherLowerState {
  hostSecret: number;
  peerSecret: number;
  currentTurn: "HOST" | "PEER";
  winner: "HOST" | "PEER" | null;
  history: GuessHistory[];
  status: "PLAYING" | "FINISHED";
}

export class HigherLowerGame {
  private state: HigherLowerState;
  private hostToken: string;
  private peerToken: string;
  private scores: { HOST: number; PEER: number } = { HOST: 0, PEER: 0 };

  constructor(hostToken: string, peerToken: string) {
    this.hostToken = hostToken;
    this.peerToken = peerToken;
    this.state = this.initGame();
  }

  // Generates 2 secret numbers between 1 and 100
  private initGame(): HigherLowerState {
    return {
      hostSecret: Math.floor(Math.random() * 100) + 1,
      peerSecret: Math.floor(Math.random() * 100) + 1,
      currentTurn: "HOST", // Host always makes the first guess
      winner: null,
      history: [],
      status: "PLAYING",
    };
  }

  // Evaluates a guess from a player
  handleGuess(token: string, guess: number) {
    if (this.state.status === "FINISHED") {
      return { error: "Game is already finished!" };
    }

    const isHost = token === this.hostToken;
    const isPeer = token === this.peerToken;

    if (!isHost && !isPeer) {
      return { error: "Unauthorized player" };
    }

    const playerRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";

    // 1. Validate Turn: Is it actually this player's turn?
    if (this.state.currentTurn !== playerRole) {
      return { error: "Not your turn! Wait for your partner." };
    }

    // 2. Validate Target: You are guessing your PARTNER's secret number!
    const target = isHost ? this.state.peerSecret : this.state.hostSecret;

    let result: "HIGHER" | "LOWER" | "CORRECT";

    if (guess < target) {
      result = "HIGHER";
      this.state.currentTurn = isHost ? "PEER" : "HOST"; // Pass turn
    } else if (guess > target) {
      result = "LOWER";
      this.state.currentTurn = isHost ? "PEER" : "HOST"; // Pass turn
    } else {
      result = "CORRECT";
      this.state.winner = playerRole;
      this.state.status = "FINISHED";
      this.scores[playerRole] += 1; // Award point to winner
    }

    // 3. Record guess in history log
    this.state.history.unshift({
      guesserRole: playerRole,
      guess,
      result,
      timestamp: Date.now(),
    });

    return { success: true, result, winner: this.state.winner };
  }

  // ⭐️ ANTI-CHEAT STATE MASKING:
  // Each player receives THEIR secret number; partner's number is scrubbed (null)
  getStateForPlayer(token: string) {
    const isHost = token === this.hostToken;

    return {
      gameType: "HIGHER_LOWER",
      mySecretNumber: isHost ? this.state.hostSecret : this.state.peerSecret,
      currentTurn: this.state.currentTurn,
      winner: this.state.winner,
      history: this.state.history,
      status: this.state.status,
      scores: this.scores,
      // Only reveal partner's secret once the match is over!
      partnerSecretNumber:
        this.state.status === "FINISHED"
          ? isHost
            ? this.state.peerSecret
            : this.state.hostSecret
          : null,
    };
  }

  reset() {
    this.state = this.initGame();
  }
}