export type RPSChoice = "ROCK" | "PAPER" | "SCISSORS";

export interface RPSRoundHistory {
  round: number;
  hostChoice: RPSChoice;
  peerChoice: RPSChoice;
  winner: "HOST" | "PEER" | "DRAW";
}

export class RockPaperScissorsGame {
  private hostToken: string;
  private peerToken: string;
  private round: number = 1;
  private choices: { HOST?: RPSChoice; PEER?: RPSChoice } = {};
  private scores = { HOST: 0, PEER: 0 };
  private status: "CHOOSING" | "REVEALED" = "CHOOSING";
  private winnerRole: "HOST" | "PEER" | "DRAW" | null = null;
  private history: RPSRoundHistory[] = [];

  constructor(hostToken: string, peerToken: string) {
    this.hostToken = hostToken;
    this.peerToken = peerToken;
  }

  // Handle blind secret choice
  public handleChoice(token: string, choice: RPSChoice) {
    if (this.status === "REVEALED") {
      return { error: "Round already revealed! Click Next Round." };
    }

    const isHost = token === this.hostToken;
    const playerRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";

    // Lock in the choice
    this.choices[playerRole] = choice;

    // When both players have locked in, evaluate winner!
    if (this.choices.HOST && this.choices.PEER) {
      this.evaluateRound();
    }

    return { success: true, lockedIn: true };
  }

  private evaluateRound() {
    const h = this.choices.HOST!;
    const p = this.choices.PEER!;

    if (h === p) {
      this.winnerRole = "DRAW";
    } else if (
      (h === "ROCK" && p === "SCISSORS") ||
      (h === "PAPER" && p === "ROCK") ||
      (h === "SCISSORS" && p === "PAPER")
    ) {
      this.winnerRole = "HOST";
      this.scores.HOST += 1;
    } else {
      this.winnerRole = "PEER";
      this.scores.PEER += 1;
    }

    this.status = "REVEALED";
    this.history.unshift({
      round: this.round,
      hostChoice: h,
      peerChoice: p,
      winner: this.winnerRole,
    });
  }

  public nextRound() {
    this.round += 1;
    this.choices = {};
    this.winnerRole = null;
    this.status = "CHOOSING";
  }

  // ⭐️ Blind Commit-Reveal: Partner's choice is scrubbed until both lock in!
  public getStateForPlayer(token: string) {
    const isHost = token === this.hostToken;
    const playerRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";
    const partnerRole: "HOST" | "PEER" = isHost ? "PEER" : "HOST";

    const isRevealed = this.status === "REVEALED";

    return {
      gameType: "ROCK_PAPER_SCISSORS",
      round: this.round,
      status: this.status,
      scores: this.scores,
      winnerRole: this.winnerRole,
      history: this.history,
      myChoice: this.choices[playerRole] || null,
      partnerHasChosen: !!this.choices[partnerRole],
      // Anti-cheat: Partner's choice is STRICTLY null until revealed!
      partnerChoice: isRevealed ? this.choices[partnerRole] : null,
    };
  }
}