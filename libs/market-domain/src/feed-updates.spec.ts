import { displayNameForPair } from './display-name.js';
import { isOrderBookUpdate, isTickerUpdate } from './feed-updates.js';
import type { OrderBookUpdate, TickerUpdate } from './feed-updates.js';

describe('displayNameForPair', () => {
  it('formats the required pairs', () => {
    expect(displayNameForPair('BTCUSDT')).toBe('BTC / USDT');
    expect(displayNameForPair('DOGEUSDT')).toBe('DOGE / USDT');
  });
});

describe('feed update guards', () => {
  const ticker: TickerUpdate = {
    pair: 'ETHUSDT',
    lastPrice: 1,
    change24hPercent: 2,
    high24h: 3,
    low24h: 0.5,
    volume24h: 10,
    eventTime: 1,
  };

  const book: OrderBookUpdate = {
    pair: 'ETHUSDT',
    bids: [{ price: 1, quantity: 2 }],
    asks: [{ price: 1.1, quantity: 3 }],
    lastUpdateId: 9,
    eventTime: 1,
  };

  it('distinguishes ticker and order-book updates', () => {
    expect(isTickerUpdate(ticker)).toBe(true);
    expect(isOrderBookUpdate(ticker)).toBe(false);
    expect(isOrderBookUpdate(book)).toBe(true);
    expect(isTickerUpdate(book)).toBe(false);
  });
});
