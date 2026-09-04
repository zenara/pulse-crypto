import type { MarketProcessorConfig } from './market-processor.tokens';

const DEFAULT_INTERVAL_MS = 100;
const DEFAULT_ORDER_BOOK_DEPTH = 10;

export function readMarketProcessorConfig(
  env: NodeJS.ProcessEnv = process.env,
): MarketProcessorConfig {
  return {
    intervalMs: parseIntervalMs(env.MARKET_UPDATE_INTERVAL_MS),
    orderBookDepth: parseOrderBookDepth(env.ORDER_BOOK_DEPTH),
  };
}

function parseIntervalMs(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_INTERVAL_MS;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_INTERVAL_MS;
  }

  return parsed;
}

function parseOrderBookDepth(value: string | undefined): number {
  if (value === '5' || value === '10' || value === '20') {
    return Number(value);
  }

  return DEFAULT_ORDER_BOOK_DEPTH;
}
