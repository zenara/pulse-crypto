import type { MarketState } from '@pulse-crypto/contracts';

export const MARKET_PROCESSOR_CONFIG = Symbol('MARKET_PROCESSOR_CONFIG');
export const MARKET_SNAPSHOT_SINK = Symbol('MARKET_SNAPSHOT_SINK');

export interface MarketProcessorConfig {
  intervalMs: number;
  orderBookDepth: number;
}

/**
 * Downstream consumer of consolidated snapshots.
 * The processor does not know about WebSocket transport.
 */
export interface MarketSnapshotSink {
  publish(snapshot: MarketState[]): void;
}
