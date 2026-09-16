import { NextResponse } from "next/server";
import { prisma} from "@orbit/db"
import { randomBytes , randomUUID } from "crypto";

const VIBES = [
  "cozy",
  "retro",
  "arcade",
  "pixel",
  "neon",
  "lofi",
  "stellar",
  "chill",
  "cyber",
  "sunset",
];

const POKEMON = [
  "pikachu",
  "eevee",
  "snorlax",
  "gengar",
  "charizard",
  "squirtle",
  "bulbasaur",
  "mewtwo",
  "jigglypuff",
  "lucario",
  "psyduck",
  "togepi",
];

// Generates memorable room slugs like "cozy-pikachu-42"
function generateRoomCode(): string {
  const vibe = VIBES[Math.floor(Math.random() * VIBES.length)];
  const poke = POKEMON[Math.floor(Math.random() * POKEMON.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 2-digit number (10 to 99)

  return `${vibe}-${poke}-${num}`;
}

export async function POST() {
    try {
        let code = generateRoomCode();

        let existing = await prisma.room.findUnique({
            where: { code },
        });
         while (existing) {
            code = generateRoomCode();
            existing = await prisma.room.findUnique({
                where: { code },
            });
        }

        const hostToken =  randomUUID();

        const room = await prisma.room.create({
            data: {
                code,
                hostToken,
                status: "WAITING",
            },
        });

       return NextResponse.json({
      success: true,
      roomId: room.id,
      code: room.code,
      hostToken: room.hostToken,
    });
  }  catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room in database" },
      { status: 500 }
    );
  }
}