import { parseBinanceMessage } from './binance-message.parser';

const tickerPayload = {
  stream: 'btcusdt@ticker',
  data: {
    e: '24hrTicker',
    E: 1672515782136,
    s: 'BTCUSDT',
    p: '0.0015',
    P: '-1.25',
    c: '65000.50',
    o: '66000.00',
    h: '67000.00',
    l: '64000.00',
    v: '10000',
    q: '650000000',
  },
};

const depthPayload = {
  stream: 'ethusdt@depth10@100ms',
  data: {
    lastUpdateId: 160,
    bids: [
      ['2500.10', '1.5'],
      ['2500.00', '2.0'],
    ],
    asks: [
      ['2500.20', '0.75'],
      ['2500.30', '3.0'],
    ],
  },
};

describe('parseBinanceMessage', () => {
  it('normalizes a combined ticker payload', () => {
    const parsed = parseBinanceMessage(JSON.stringify(tickerPayload));
    expect(parsed).toEqual({
      kind: 'ticker',
      update: {
        pair: 'BTCUSDT',
        lastPrice: 65000.5,
        change24hPercent: -1.25,
        high24h: 67000,
        low24h: 64000,
        volume24h: 650000000,
        eventTime: 1672515782136,
      },
    });
  });

  it('normalizes a combined partial depth payload using the stream name', () => {
    const parsed = parseBinanceMessage(JSON.stringify(depthPayload), 42);
    expect(parsed).toEqual({
      kind: 'orderBook',
      update: {
        pair: 'ETHUSDT',
        bids: [
          { price: 2500.1, quantity: 1.5 },
          { price: 2500, quantity: 2 },
        ],
        asks: [
          { price: 2500.2, quantity: 0.75 },
          { price: 2500.3, quantity: 3 },
        ],
        lastUpdateId: 160,
        eventTime: 42,
      },
    });
  });

  it('ignores malformed, control, and unsupported payloads', () => {
    expect(parseBinanceMessage('not-json').kind).toBe('ignored');
    expect(parseBinanceMessage(JSON.stringify({ result: null, id: 1 })).kind).toBe(
      'ignored',
    );
    expect(
      parseBinanceMessage(
        JSON.stringify({
          stream: 'adausdt@ticker',
          data: tickerPayload.data,
        }),
      ).kind,
    ).toBe('ignored');
    expect(
      parseBinanceMessage(
        JSON.stringify({
          stream: 'btcusdt@ticker',
          data: { ...tickerPayload.data, c: 'nope' },
        }),
      ).kind,
    ).toBe('ignored');
  });
});
