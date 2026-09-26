const WORD_BANK = [
  "PIZZA",
  "ROCKET",
  "GUITAR",
  "PENGUIN",
  "SUNSET",
  "BURGER",
  "CASTLE",
  "BICYCLE",
  "CACTUS",
  "DRAGON",
  "HEADPHONES",
  "RAINBOW",
];

export interface DrawGuessState {
  drawerRole: "HOST" | "PEER";
  secretWord: string;
  round: number;
  scores: { HOST: number; PEER: number };
  status: "DRAWING" | "ROUND_OVER";
  winnerRole: "HOST" | "PEER" | null;
}

export class DrawGuessGame {
  private hostToken: string;
  private peerToken: string;
  private drawerRole: "HOST" | "PEER" = "HOST";
  private secretWord: string = "";
  private round: number = 1;
  private scores = { HOST: 0, PEER: 0 };
  private status: "DRAWING" | "ROUND_OVER" = "DRAWING";

  constructor(hostToken: string, peerToken: string) {
    this.hostToken = hostToken;
    this.peerToken = peerToken;
    this.startNewRound();
  }

  private startNewRound() {
    this.secretWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    this.status = "DRAWING";
  }

  // Check guess from the non-drawing player
  handleGuess(token: string, guess: string) {
    if (this.status !== "DRAWING") return { error: "Round is over" };

    const isHost = token === this.hostToken;
    const playerRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";

    // Drawer is NOT allowed to guess their own drawing!
    if (playerRole === this.drawerRole) {
      return { error: "You are drawing! You cannot guess." };
    }

    const cleanGuess = guess.trim().toUpperCase();

    if (cleanGuess === this.secretWord) {
      // Correct! Award 10 points to guesser, 5 points to drawer!
      this.scores[playerRole] += 10;
      this.scores[this.drawerRole] += 5;
      this.status = "ROUND_OVER";

      return {
        correct: true,
        word: this.secretWord,
        winner: playerRole,
        scores: this.scores,
      };
    }

    return { correct: false };
  }

  // Switch roles for next round
  nextRound() {
    this.drawerRole = this.drawerRole === "HOST" ? "PEER" : "HOST";
    this.round += 1;
    this.startNewRound();
  }

  // Anti-cheat state masking
  getStateForPlayer(token: string) {
    const isHost = token === this.hostToken;
    const myRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";
    const isDrawer = myRole === this.drawerRole;

    return {
      gameType: "DRAW_GUESS",
      myRole,
      isDrawer,
      drawerRole: this.drawerRole,
      // If drawer, reveal word. If guesser, mask as "_ _ _ _"
      wordDisplay: isDrawer || this.status === "ROUND_OVER" ? this.secretWord : "_ ".repeat(this.secretWord.length).trim(),
      wordLength: this.secretWord.length,
      round: this.round,
      scores: this.scores,
      status: this.status,
    };
  }
}