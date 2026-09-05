import {
  SUPPORTED_TRADING_PAIRS,
  type PairMetadata,
  type TradingPair,
} from '@pulse-crypto/contracts';

export interface WatchlistPair {
  symbol: TradingPair;
  displayName: string;
}

export function resolveWatchlistPairs(
  pairs: readonly PairMetadata[],
): WatchlistPair[] {
  if (pairs.length > 0) {
    return pairs.map((pair) => ({
      symbol: pair.symbol,
      displayName: pair.displayName,
    }));
  }

  return SUPPORTED_TRADING_PAIRS.map((symbol) => ({
    symbol,
    displayName: symbol,
  }));
}

export function filterWatchlistPairs(
  pairs: readonly WatchlistPair[],
  query: string,
): WatchlistPair[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...pairs];
  }

  return pairs.filter(
    (pair) =>
      pair.symbol.toLowerCase().includes(needle) ||
      pair.displayName.toLowerCase().includes(needle),
  );
}
