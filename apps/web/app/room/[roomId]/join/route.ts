import { NextResponse } from "next/server";
import { prisma } from "@orbit/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: code } = await params;
    const body = await request.json().catch(() => ({}));
    const clientToken = body.token;

    const room = await prisma.room.findUnique({
      where: { code },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // 1. Existing Host Rejoining
    if (clientToken && clientToken === room.hostToken) {
      return NextResponse.json({
        success: true,
        role: "HOST",
        token: room.hostToken,
        roomCode: room.code,
      });
    }

    // 2. Existing Peer Rejoining with Matching Token
    if (clientToken && clientToken === room.peerToken) {
      return NextResponse.json({
        success: true,
        role: "PEER",
        token: room.peerToken,
        roomCode: room.code,
      });
    }

    // 3. New Peer Joining or Reclaiming Inactive Peer Slot
    // Check signaling server in real time: Is an actual peer connected right now?
    let isPeerOnline = false;
    try {
      const signalingUrl =
        process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:4000";
      const statusRes = await fetch(`${signalingUrl}/api/room/${code}/status`, {
        cache: "no-store",
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        isPeerOnline = !!statusData.peerConnected;
      }
    } catch (e) {
      // Signaling server fallback: allow connection if peerToken is null
      isPeerOnline = false;
    }

    // If an actual peer is connected to WebSockets right now, reject 3rd visitor
    if (isPeerOnline) {
      return NextResponse.json(
        { success: false, error: "Room is full! 2 players are already in this room." },
        { status: 403 }
      );
    }

    // Peer slot is open! Assign or reuse peerToken
    const peerToken = room.peerToken || randomUUID();
    await prisma.room.update({
      where: { code },
      data: {
        peerToken: peerToken,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      role: "PEER",
      token: peerToken,
      roomCode: room.code,
    });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { success: false, error: "Server error during join" },
      { status: 500 }
    );
  }
}