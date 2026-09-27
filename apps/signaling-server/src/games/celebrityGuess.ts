export interface CelebrityItem {
  id: string;
  name: string;
  category: "Cinema" | "Music" | "Sports" | "Tech & Icons";
  imageUrl: string;
}

// ── 1. Wikipedia Summary REST API & In-Memory Cache ──
const WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const imageCache = new Map<string, string>();

/**
 * Resolves a high-quality, stable thumbnail from Wikipedia REST API
 * Caches results in memory so lookups are 0ms during gameplay.
 */
export async function fetchWikiThumbnail(name: string): Promise<string | null> {
  // Check memory cache first (0ms latency!)
  if (imageCache.has(name)) {
    return imageCache.get(name)!;
  }

  try {
    const res = await fetch(`${WIKI_API}${encodeURIComponent(name)}`, {
      headers: {
        // Wikipedia mandates an informative User-Agent to prevent 403 Forbidden
        "User-Agent": "OrbitArcade/1.0 (educational real-time webapp; contact@orbit.local)",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const url = data?.thumbnail?.source ?? null;

    if (url) {
      imageCache.set(name, url); // Cache for all future rounds
    }
    return url;
  } catch (err) {
    return null;
  }
}

/**
 * Pre-warms the image cache asynchronously on server boot
 */
export async function preloadCelebrityImages() {
  console.log("📸 [Celebrities] Pre-warming Wikipedia image cache in background...");
  for (const c of CELEBRITIES) {
    const freshUrl = await fetchWikiThumbnail(c.name);
    if (freshUrl) {
      c.imageUrl = freshUrl;
    }
  }
  console.log("✅ [Celebrities] Pre-warm complete. All portraits cached.");
}

// ── 2. Curated Roster of Celebrities ──
const CELEBRITIES: CelebrityItem[] = [
  {
    id: "1",
    name: "Lionel Messi",
    category: "Sports",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/330px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg",
  },
  {
    id: "2",
    name: "Taylor Swift",
    category: "Music",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png",
  },
  {
    id: "3",
    name: "Elon Musk",
    category: "Tech & Icons",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/330px-Elon_Musk_-_54820081119_%28cropped%29.jpg",
  },
  {
    id: "4",
    name: "Cristiano Ronaldo",
    category: "Sports",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/330px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg",
  },
  {
    id: "5",
    name: "Zendaya",
    category: "Cinema",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Zendaya-byPhilipRomano.jpg/330px-Zendaya-byPhilipRomano.jpg",
  },
  {
    id: "6",
    name: "Keanu Reeves",
    category: "Cinema",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg/330px-Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg",
  },
  {
    id: "7",
    name: "Billie Eilish",
    category: "Music",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg/330px-BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg",
  },
  {
    id: "8",
    name: "Steve Jobs",
    category: "Tech & Icons",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Steve_Jobs_Headshot_2010_%28cropped_4%29.jpg/330px-Steve_Jobs_Headshot_2010_%28cropped_4%29.jpg",
  },
  {
    id: "9",
    name: "Shah Rukh Khan",
    category: "Cinema",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/330px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg",
  },
  {
    id: "10",
    name: "Leonardo DiCaprio",
    category: "Cinema",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/LeoPTABFI191125-28_%28cropped%29.jpg/330px-LeoPTABFI191125-28_%28cropped%29.jpg",
  },
  {
    id: "11",
    name: "Virat Kohli",
    category: "Sports",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/330px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg",
  },
  {
    id: "12",
    name: "Beyonce",
    category: "Music",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg/330px-Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg",
  },
];
// ── 3. Server-Authoritative Game Engine ──
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

    // ⚡ Retrieve cached dynamic thumbnail if pre-warmed, else static fallback
    const resolvedImageUrl =
      imageCache.get(this.currentCelebrity.name) || this.currentCelebrity.imageUrl;

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
      celebrity:
        isGiver || isRoundOver
          ? {
              name: this.currentCelebrity.name,
              imageUrl: resolvedImageUrl,
            }
          : null,
    };
  }
}