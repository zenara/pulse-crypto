import { SUPPORTED_TRADING_PAIRS, type PairMetadata } from '@pulse-crypto/contracts';
import {
  filterWatchlistPairs,
  resolveWatchlistPairs,
} from './filter-watchlist';

const btc: PairMetadata = {
  symbol: 'BTCUSDT',
  displayName: 'BTC / USDT',
  tradingStatus: 'TRADING',
  high24h: 1,
  low24h: 0.5,
  volume24h: 10,
};

const eth: PairMetadata = {
  ...btc,
  symbol: 'ETHUSDT',
  displayName: 'ETH / USDT',
};

describe('watchlist filtering', () => {
  it('uses REST metadata when present', () => {
    expect(resolveWatchlistPairs([btc, eth])).toEqual([
      { symbol: 'BTCUSDT', displayName: 'BTC / USDT' },
      { symbol: 'ETHUSDT', displayName: 'ETH / USDT' },
    ]);
  });

  it('falls back to supported pairs without changing market state', () => {
    expect(resolveWatchlistPairs([]).map((pair) => pair.symbol)).toEqual([
      ...SUPPORTED_TRADING_PAIRS,
    ]);
  });

  it('filters by symbol or display name without mutating the source list', () => {
    const pairs = resolveWatchlistPairs([btc, eth]);
    expect(filterWatchlistPairs(pairs, 'eth')).toEqual([
      { symbol: 'ETHUSDT', displayName: 'ETH / USDT' },
    ]);
    expect(filterWatchlistPairs(pairs, ' BTC ')).toEqual([
      { symbol: 'BTCUSDT', displayName: 'BTC / USDT' },
    ]);
    expect(pairs).toHaveLength(2);
  });
});
