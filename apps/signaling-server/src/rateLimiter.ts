export class RateLimiter {
  // In-memory Map: "socketId:action" -> array of epoch millisecond timestamps
  private limits = new Map<string, number[]>();

  /**
   * Checks if an action is rate-limited using a sliding window algorithm.
   * @param key Unique key for the actor & action (e.g. `${socketId}:chat`)
   * @param maxHits Maximum allowed actions within the time window
   * @param windowMs Duration of the sliding window in milliseconds
   * @returns true if rate-limited (action should be BLOCKED), false if ALLOWED
   */
  isRateLimited(key: string, maxHits: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.limits.get(key) || [];

    // 1. Evict timestamps that have fallen outside the sliding window
    const activeTimestamps = timestamps.filter((t) => now - t < windowMs);

    // 2. Check if the bucket has exceeded maximum allowed hits
    if (activeTimestamps.length >= maxHits) {
      // Save pruned array back to prevent memory bloat
      this.limits.set(key, activeTimestamps);
      return true; // 🛑 Block action
    }

    // 3. Action is allowed: record current timestamp and save
    activeTimestamps.push(now);
    this.limits.set(key, activeTimestamps);
    return false; // ✅ Allow action
  }

  /**
   * Purges all rate limit buckets for a disconnected socket to prevent RAM leaks
   */
  cleanup(socketId: string) {
    for (const key of this.limits.keys()) {
      if (key.startsWith(socketId)) {
        this.limits.delete(key);
      }
    }
  }
}