import { SUPPORTED_TRADING_PAIRS, isTradingPair } from './trading-pair.js';

describe('trading pair', () => {
  it('includes the five required symbols', () => {
    expect([...SUPPORTED_TRADING_PAIRS]).toEqual([
      'BTCUSDT',
      'ETHUSDT',
      'SOLUSDT',
      'DOGEUSDT',
      'XRPUSDT',
    ]);
  });

  it('accepts supported symbols only', () => {
    expect(isTradingPair('BTCUSDT')).toBe(true);
    expect(isTradingPair('btcusdt')).toBe(false);
    expect(isTradingPair('ADAUSDT')).toBe(false);
  });
});
