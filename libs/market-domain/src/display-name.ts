import type { TradingPair } from '@pulse-crypto/contracts';

const DISPLAY_NAMES: Record<TradingPair, string> = {
  BTCUSDT: 'BTC / USDT',
  ETHUSDT: 'ETH / USDT',
  SOLUSDT: 'SOL / USDT',
  DOGEUSDT: 'DOGE / USDT',
  XRPUSDT: 'XRP / USDT',
};

export function displayNameForPair(pair: TradingPair): string {
  return DISPLAY_NAMES[pair];
}
