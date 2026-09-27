import { prisma } from "@orbit/db";
import { RoomManager } from "./room";

/**
 * Sweeps PostgreSQL for stale/orphaned rooms older than maxAgeHours
 * that have no active connections in Node.js RAM.
 */
async function sweepDeadRooms(roomManager: RoomManager, maxAgeHours = 2) {
  try {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const activeCodes = roomManager.getActiveRoomCodes();

    // ⚡ Single batch query: delete rooms created before cutoff that aren't active in RAM
    const result = await prisma.room.deleteMany({
      where: {
        createdAt: {
          lt: cutoffTime,
        },
        code: {
          notIn: activeCodes,
        },
      },
    });

    if (result.count > 0) {
      console.log(`🧹 [Reaper] Swept and purged ${result.count} stale ghost rooms from database.`);
    }
  } catch (error: any) {
    console.error("⚠️ [Reaper Error] Failed to sweep stale rooms:", error.message);
  }
}

/**
 * Initializes the background Reaper interval
 */
export function startReaper(roomManager: RoomManager, intervalMinutes = 15) {
  console.log(`🛡️ [Reaper Daemon] Initialized (running sweep every ${intervalMinutes} minutes)`);

  // 1. Run an immediate sweep on server boot
  sweepDeadRooms(roomManager);

  // 2. Schedule recurring sweeps
  const timer = setInterval(() => {
    sweepDeadRooms(roomManager);
  }, intervalMinutes * 60 * 1000);

  // Return a function to stop the reaper if needed during graceful shutdown
  return () => clearInterval(timer);
}