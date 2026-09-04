const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const;

/**
 * Bounded exponential backoff used by backend Binance reconnect
 * and later by the mobile WebSocket client.
 */
export function reconnectDelayMs(attempt: number): number {
  if (!Number.isFinite(attempt) || attempt <= 0) {
    return RECONNECT_DELAYS_MS[0];
  }

  const index = Math.min(attempt - 1, RECONNECT_DELAYS_MS.length - 1);
  return RECONNECT_DELAYS_MS[index];
}
