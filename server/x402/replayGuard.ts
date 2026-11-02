/**
 * Atomic Nonce Replay Guard
 * Simulates Redis SETNX with automatic TTL expiration to prevent double-spend attacks.
 */
export class NonceReplayGuard {
  // Map of nonce -> expiration timestamp (ms)
  private activeNonces: Map<string, number> = new Map();
  private defaultTtlMs = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Run cleanup interval every 60 seconds
    setInterval(() => this.cleanupExpired(), 60_000);
  }

  /**
   * Attempts to atomically lock a nonce.
   * Returns true if nonce was novel and successfully acquired.
   * Returns false if nonce was already locked or spent (Replay attack).
   */
  public acquireNonce(nonce: string, ttlMs: number = this.defaultTtlMs): boolean {
    const now = Date.now();
    const existingExpiry = this.activeNonces.get(nonce);

    if (existingExpiry && existingExpiry > now) {
      // Replay detected!
      return false;
    }

    // Lock nonce with expiration
    this.activeNonces.set(nonce, now + ttlMs);
    return true;
  }

  /**
   * Release or invalidate a nonce (e.g. if request failed before payment authorization)
   */
  public releaseNonce(nonce: string): void {
    this.activeNonces.delete(nonce);
  }

  /**
   * Check if nonce is currently active
   */
  public hasNonce(nonce: string): boolean {
    const now = Date.now();
    const expiry = this.activeNonces.get(nonce);
    return !!(expiry && expiry > now);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [nonce, expiry] of this.activeNonces.entries()) {
      if (expiry <= now) {
        this.activeNonces.delete(nonce);
      }
    }
  }
}

export const replayGuard = new NonceReplayGuard();
