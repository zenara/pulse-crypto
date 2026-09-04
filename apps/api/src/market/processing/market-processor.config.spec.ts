import { readMarketProcessorConfig } from './market-processor.config';

describe('readMarketProcessorConfig', () => {
  it('defaults to 100ms snapshots and depth 10', () => {
    expect(readMarketProcessorConfig({})).toEqual({
      intervalMs: 100,
      orderBookDepth: 10,
    });
  });

  it('reads a custom interval and Binance partial-depth size', () => {
    expect(
      readMarketProcessorConfig({
        MARKET_UPDATE_INTERVAL_MS: '250',
        ORDER_BOOK_DEPTH: '5',
      }),
    ).toEqual({
      intervalMs: 250,
      orderBookDepth: 5,
    });
  });

  it('falls back when values are invalid', () => {
    expect(
      readMarketProcessorConfig({
        MARKET_UPDATE_INTERVAL_MS: '0',
        ORDER_BOOK_DEPTH: '15',
      }),
    ).toEqual({
      intervalMs: 100,
      orderBookDepth: 10,
    });
  });
});
