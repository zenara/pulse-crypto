import type { OrderBookUpdate, TickerUpdate } from '@pulse-crypto/market-domain';

export const BINANCE_FEED_CONFIG = Symbol('BINANCE_FEED_CONFIG');
export const WEBSOCKET_FACTORY = Symbol('WEBSOCKET_FACTORY');
export const MARKET_FEED_LISTENER = Symbol('MARKET_FEED_LISTENER');

export interface MarketFeedListener {
  onTicker(update: TickerUpdate): void;
  onOrderBook(update: OrderBookUpdate): void;
}

export interface FeedWebSocket {
  on(event: 'open' | 'message' | 'error' | 'close', listener: (...args: unknown[]) => void): void;
  close(): void;
}

export type WebSocketFactory = (url: string) => FeedWebSocket;
