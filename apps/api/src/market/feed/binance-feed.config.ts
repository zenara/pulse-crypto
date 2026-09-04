import { SUPPORTED_TRADING_PAIRS, type TradingPair } from '@pulse-crypto/contracts';

export type OrderBookDepth = 5 | 10 | 20;

export interface BinanceFeedConfig {
  enabled: boolean;
  wsBaseUrl: string;
  pairs: readonly TradingPair[];
  orderBookDepth: OrderBookDepth;
}

const DEFAULT_WS_BASE_URL = 'wss://stream.binance.com:9443';

export function readBinanceFeedConfig(
  env: NodeJS.ProcessEnv = process.env,
): BinanceFeedConfig {
  return {
    enabled: env.BINANCE_FEED_ENABLED !== 'false',
    wsBaseUrl: env.BINANCE_WS_BASE_URL?.trim() || DEFAULT_WS_BASE_URL,
    pairs: SUPPORTED_TRADING_PAIRS,
    orderBookDepth: parseOrderBookDepth(env.ORDER_BOOK_DEPTH),
  };
}

export function buildBinanceCombinedStreamUrl(config: BinanceFeedConfig): string {
  const streams = config.pairs
    .flatMap((pair) => {
      const symbol = pair.toLowerCase();
      return [
        `${symbol}@ticker`,
        `${symbol}@depth${config.orderBookDepth}@100ms`,
      ];
    })
    .join('/');

  const base = config.wsBaseUrl.replace(/\/$/, '');
  return `${base}/stream?streams=${streams}`;
}

function parseOrderBookDepth(value: string | undefined): OrderBookDepth {
  if (value === '5' || value === '10' || value === '20') {
    return Number(value) as OrderBookDepth;
  }
  return 10;
}
