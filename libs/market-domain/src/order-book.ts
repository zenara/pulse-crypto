import type { OrderBookLevel } from '@pulse-crypto/contracts';

export type OrderBookSide = 'bid' | 'ask';

export interface BookPressure {
  buyPressure: number;
  sellPressure: number;
}

/**
 * Keep the best `depth` levels. Bids are highest-price first; asks are lowest-price first.
 * Invalid or zero-quantity levels are dropped.
 */
export function boundOrderBookLevels(
  levels: readonly OrderBookLevel[],
  side: OrderBookSide,
  depth: number,
): OrderBookLevel[] {
  const limit = Number.isFinite(depth) ? Math.max(0, Math.floor(depth)) : 0;
  const usable = levels.filter(
    (level) =>
      Number.isFinite(level.price) &&
      level.price > 0 &&
      Number.isFinite(level.quantity) &&
      level.quantity > 0,
  );

  usable.sort((a, b) => (side === 'bid' ? b.price - a.price : a.price - b.price));

  return usable.slice(0, limit).map((level) => ({
    price: level.price,
    quantity: level.quantity,
  }));
}

/**
 * Best ask minus best bid. Null when either side is missing or prices are not finite.
 */
export function calculateSpread(
  bids: readonly OrderBookLevel[],
  asks: readonly OrderBookLevel[],
): number | null {
  const bestBid = bestPrice(bids, 'bid');
  const bestAsk = bestPrice(asks, 'ask');
  if (bestBid === undefined || bestAsk === undefined) {
    return null;
  }
  return bestAsk - bestBid;
}

/**
 * Bid/ask volume share of the bounded book, as percents that sum to 100.
 * Null when total volume is zero.
 */
export function calculateBookPressure(
  bids: readonly OrderBookLevel[],
  asks: readonly OrderBookLevel[],
): BookPressure | null {
  const bidVolume = sumQuantity(bids);
  const askVolume = sumQuantity(asks);
  const total = bidVolume + askVolume;
  if (total === 0) {
    return null;
  }

  const buyPressure = (bidVolume / total) * 100;
  return {
    buyPressure,
    sellPressure: 100 - buyPressure,
  };
}

function bestPrice(
  levels: readonly OrderBookLevel[],
  side: OrderBookSide,
): number | undefined {
  if (levels.length === 0) {
    return undefined;
  }

  let best = levels[0]?.price;
  if (best === undefined || !Number.isFinite(best)) {
    return undefined;
  }

  for (let i = 1; i < levels.length; i += 1) {
    const price = levels[i]?.price;
    if (price === undefined || !Number.isFinite(price)) {
      continue;
    }
    if (side === 'bid' ? price > best : price < best) {
      best = price;
    }
  }

  return best;
}

function sumQuantity(levels: readonly OrderBookLevel[]): number {
  return levels.reduce((sum, level) => sum + level.quantity, 0);
}
