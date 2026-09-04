import type { OrderBookLevel } from './order-book-level.js';
import type { TradingPair } from './trading-pair.js';

/**
 * Latest processed market view for one trading pair.
 * Spread and pressure are null when the bounded book cannot support the calculation.
 */
export interface MarketState {
  pair: TradingPair;
  lastPrice: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  spread: number | null;
  buyPressure: number | null;
  sellPressure: number | null;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  updatedAt: number;
}
