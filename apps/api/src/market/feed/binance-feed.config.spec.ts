import {
  buildBinanceCombinedStreamUrl,
  readBinanceFeedConfig,
} from './binance-feed.config';

describe('readBinanceFeedConfig', () => {
  it('uses public Binance combined streams and depth 10 by default', () => {
    expect(readBinanceFeedConfig({})).toEqual(
      expect.objectContaining({
        enabled: true,
        wsBaseUrl: 'wss://stream.binance.com:9443',
        orderBookDepth: 10,
      }),
    );
  });

  it('accepts only Binance partial-depth sizes', () => {
    expect(readBinanceFeedConfig({ ORDER_BOOK_DEPTH: '5' }).orderBookDepth).toBe(
      5,
    );
    expect(readBinanceFeedConfig({ ORDER_BOOK_DEPTH: '15' }).orderBookDepth).toBe(
      10,
    );
    expect(
      readBinanceFeedConfig({ BINANCE_FEED_ENABLED: 'false' }).enabled,
    ).toBe(false);
  });
});

describe('buildBinanceCombinedStreamUrl', () => {
  it('subscribes to ticker and bounded depth for each pair', () => {
    const url = buildBinanceCombinedStreamUrl({
      enabled: true,
      wsBaseUrl: 'wss://stream.binance.com:9443/',
      pairs: ['BTCUSDT', 'ETHUSDT'],
      orderBookDepth: 10,
    });

    expect(url).toBe(
      'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/btcusdt@depth10@100ms/ethusdt@ticker/ethusdt@depth10@100ms',
    );
  });
});
