export interface CelebrityItem {
  id: string;
  name: string;
  category: "Cinema" | "Music" | "Sports" | "Tech & Icons";
  imageUrl: string;
}

const CELEBRITIES: CelebrityItem[] = [
  {
    id: "1",
    name: "Lionel Messi",
    category: "Sports",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Lionel_Messi_WC2022.jpg/440px-Lionel_Messi_WC2022.jpg",
  },
  {
    id: "2",
    name: "Taylor Swift",
    category: "Music",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.jpg/440px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.jpg",
  },
  {
    id: "3",
    name: "Elon Musk",
    category: "Tech & Icons",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Elon_Musk_Royal_Society_%28crop1%29.jpg/440px-Elon_Musk_Royal_Society_%28crop1%29.jpg",
  },
  {
    id: "4",
    name: "Cristiano Ronaldo",
    category: "Sports",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg",
  },
  {
    id: "5",
    name: "Zendaya",
    category: "Cinema",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/440px-Zendaya_-_2019_by_Glenn_Francis.jpg",
  },
  {
    id: "6",
    name: "Keanu Reeves",
    category: "Cinema",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Keanu_Reeves_2013_%2810615146086%29_%28cropped%29.jpg/440px-Keanu_Reeves_2013_%2810615146086%29_%28cropped%29.jpg",
  },
  {
    id: "7",
    name: "Billie Eilish",
    category: "Music",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Billie_Eilish_at_the_2024_Golden_Globes.jpg/440px-Billie_Eilish_at_the_2024_Golden_Globes.jpg",
  },
  {
    id: "8",
    name: "Steve Jobs",
    category: "Tech & Icons",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/440px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg",
  },
  {
    id: "9",
    name: "Shah Rukh Khan",
    category: "Cinema",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/440px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg",
  },
  {
    id: "10",
    name: "Leonardo DiCaprio",
    category: "Cinema",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Leonardo_Dicaprio_Cannes_2019.jpg/440px-Leonardo_Dicaprio_Cannes_2019.jpg",
  },
  {
    id: "11",
    name: "Virat Kohli",
    category: "Sports",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg",
  },
  {
    id: "12",
    name: "Beyonce",
    category: "Music",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png/440px-Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png",
  },
];

export class CelebrityGuessGame {
  private hostToken: string;
  private peerToken: string;
  private giverRole: "HOST" | "PEER" = "HOST";
  private currentCelebrity!: CelebrityItem;
  private livesLeft: number = 3;
  private round: number = 1;
  private scores = { HOST: 0, PEER: 0 };
  private status: "PLAYING" | "WON" | "LOST" = "PLAYING";
  private history: { guess: string; isCorrect: boolean }[] = [];

  constructor(hostToken: string, peerToken: string) {
    this.hostToken = hostToken;
    this.peerToken = peerToken;
    this.startNewRound();
  }

  public startNewRound() {
    const randomIndex = Math.floor(Math.random() * CELEBRITIES.length);
    this.currentCelebrity = CELEBRITIES[randomIndex];
    this.livesLeft = 3;
    this.status = "PLAYING";
    this.history = [];
  }

  public nextRound() {
    // Swap roles: Host -> Peer -> Host
    this.giverRole = this.giverRole === "HOST" ? "PEER" : "HOST";
    this.round += 1;
    this.startNewRound();
  }

  public handleGuess(token: string, guess: string) {
    if (this.status !== "PLAYING") {
      return { error: "Round is over! Click Next Round." };
    }

    const isHost = token === this.hostToken;
    const playerRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";

    if (playerRole === this.giverRole) {
      return { error: "You are the Speaker! Only the guesser can submit a guess." };
    }

    const cleanGuess = guess.trim().toLowerCase();
    const cleanSecret = this.currentCelebrity.name.toLowerCase();

    // Match full name or surname (e.g., 'messi', 'swift', 'ronaldo', 'dicaprio')
    const lastName = cleanSecret.split(" ").slice(-1)[0];
    const isCorrect = cleanGuess === cleanSecret || (cleanGuess.length >= 4 && cleanGuess === lastName);

    this.history.unshift({ guess, isCorrect });

    if (isCorrect) {
      this.status = "WON";
      this.scores[playerRole] += 10;
      this.scores[this.giverRole] += 5;
      return { success: true, isCorrect: true, winner: playerRole };
    } else {
      this.livesLeft -= 1;
      if (this.livesLeft <= 0) {
        this.status = "LOST";
      }
      return { success: true, isCorrect: false, livesLeft: this.livesLeft };
    }
  }

  public getStateForPlayer(token: string) {
    const isHost = token === this.hostToken;
    const playerRole: "HOST" | "PEER" = isHost ? "HOST" : "PEER";
    const isGiver = playerRole === this.giverRole;
    const isRoundOver = this.status !== "PLAYING";

    return {
      gameType: "CELEBRITY_GUESS",
      round: this.round,
      giverRole: this.giverRole,
      guesserRole: this.giverRole === "HOST" ? "PEER" : "HOST",
      isGiver,
      livesLeft: this.livesLeft,
      status: this.status,
      scores: this.scores,
      history: this.history,
      category: this.currentCelebrity.category,
      // Anti-cheat: Guesser only gets name & photo once round is finished!
      celebrity: isGiver || isRoundOver
        ? {
            name: this.currentCelebrity.name,
            imageUrl: this.currentCelebrity.imageUrl,
          }
        : null,
    };
  }
}