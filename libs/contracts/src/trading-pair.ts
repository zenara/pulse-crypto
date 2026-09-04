export const SUPPORTED_TRADING_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'DOGEUSDT',
  'XRPUSDT',
] as const;

export type TradingPair = (typeof SUPPORTED_TRADING_PAIRS)[number];

const SUPPORTED_TRADING_PAIR_SET = new Set<string>(SUPPORTED_TRADING_PAIRS);

export function isTradingPair(value: string): value is TradingPair {
  return SUPPORTED_TRADING_PAIR_SET.has(value);
}
