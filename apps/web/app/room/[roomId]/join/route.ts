import { NextResponse } from "next/server";
import { prisma } from "@orbit/db";
import { randomUUID } from "crypto";

export async function POST(request:Request, {params} : { params:Promise<{ roomId: string }> }) 
{
    try 
    {
        const {roomId : code} = await params;
        const body = await request.json().catch(() => ({}));
        const clientToken = body.token;

        const room = await prisma.room.findUnique({
            where:{code},
        });

        if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

     if (clientToken && clientToken === room.hostToken) {
      return NextResponse.json({
        success: true,
        role: "HOST",
        token: room.hostToken,
        roomCode: room.code,
      });
    }

     if (clientToken && clientToken === room.peerToken) {
      return NextResponse.json({
        success: true,
        role: "PEER",
        token: room.peerToken,
        roomCode: room.code,
      });
    }

    if(!room.peerToken) {
      const peerToken = randomUUID();
      await prisma.room.update({
        where: { code },
        data: { peerToken: peerToken ,
            status: "ACTIVE" 
        },
      });

      return NextResponse.json({
        success: true,
        role: "PEER",
        token: peerToken,
        roomCode: room.code,
      });
    }
return NextResponse.json(
      { success: false, error: "Room is full! Only 2 players allowed." },
      { status: 403 }
    );
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { success: false, error: "Server error during join" },
      { status: 500 }
    );
  }
}