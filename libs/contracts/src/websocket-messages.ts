import type { MarketState } from './market-state.js';

export interface MarketSnapshotMessage {
  type: 'market.snapshot';
  timestamp: number;
  data: MarketState[];
}

export interface ConnectionReadyMessage {
  type: 'connection.ready';
  timestamp: number;
}

export interface ErrorMessage {
  type: 'error';
  timestamp: number;
  data: {
    code: string;
    message: string;
  };
}

export type WebSocketMessage =
  | MarketSnapshotMessage
  | ConnectionReadyMessage
  | ErrorMessage;

export function isWebSocketMessage(value: unknown): value is WebSocketMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as { type?: unknown; timestamp?: unknown };
  if (typeof message.timestamp !== 'number' || !Number.isFinite(message.timestamp)) {
    return false;
  }

  return (
    message.type === 'market.snapshot' ||
    message.type === 'connection.ready' ||
    message.type === 'error'
  );
}
