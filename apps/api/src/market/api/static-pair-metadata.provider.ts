import { Injectable } from '@nestjs/common';
import {
  SUPPORTED_TRADING_PAIRS,
  type PairMetadata,
  type TradingPair,
} from '@pulse-crypto/contracts';
import { displayNameForPair } from '@pulse-crypto/market-domain';
import type { PairMetadataProvider } from './pair-metadata.provider';

/**
 * Static metadata for Phase 2. Replace this provider to source live stats later.
 * 24h high/low/volume here are placeholders, not Binance values.
 */
const STATIC_STATS: Record<
  TradingPair,
  Pick<PairMetadata, 'tradingStatus' | 'high24h' | 'low24h' | 'volume24h'>
> = {
  BTCUSDT: {
    tradingStatus: 'TRADING',
    high24h: 112000.25,
    low24h: 105000.12,
    volume24h: 1234567.89,
  },
  ETHUSDT: {
    tradingStatus: 'TRADING',
    high24h: 4200.5,
    low24h: 3900.1,
    volume24h: 890123.45,
  },
  SOLUSDT: {
    tradingStatus: 'TRADING',
    high24h: 210.4,
    low24h: 185.2,
    volume24h: 456789.01,
  },
  DOGEUSDT: {
    tradingStatus: 'TRADING',
    high24h: 0.22,
    low24h: 0.18,
    volume24h: 234567.89,
  },
  XRPUSDT: {
    tradingStatus: 'TRADING',
    high24h: 3.15,
    low24h: 2.75,
    volume24h: 345678.9,
  },
};

@Injectable()
export class StaticPairMetadataProvider implements PairMetadataProvider {
  async getAll(): Promise<readonly PairMetadata[]> {
    return SUPPORTED_TRADING_PAIRS.map((symbol) => ({
      symbol,
      displayName: displayNameForPair(symbol),
      ...STATIC_STATS[symbol],
    }));
  }
}
