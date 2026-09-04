import type { TradingPair } from './trading-pair.js';

export type TradingStatus = 'TRADING' | 'HALT' | 'BREAK' | 'UNKNOWN';

export interface PairMetadata {
  symbol: TradingPair;
  displayName: string;
  tradingStatus: TradingStatus;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface PairsMetaResponse {
  pairs: PairMetadata[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
