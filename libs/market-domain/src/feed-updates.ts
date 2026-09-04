import type { TradingPair } from '@pulse-crypto/contracts';

export interface TickerUpdate {
  pair: TradingPair;
  lastPrice: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  eventTime: number;
}

export interface OrderBookUpdate {
  pair: TradingPair;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  lastUpdateId: number;
  eventTime: number;
}

export type MarketFeedUpdate = TickerUpdate | OrderBookUpdate;

export function isTickerUpdate(
  update: MarketFeedUpdate,
): update is TickerUpdate {
  return 'lastPrice' in update;
}

export function isOrderBookUpdate(
  update: MarketFeedUpdate,
): update is OrderBookUpdate {
  return 'bids' in update && 'asks' in update;
}
