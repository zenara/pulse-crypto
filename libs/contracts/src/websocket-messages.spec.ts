import { isWebSocketMessage } from './websocket-messages.js';

describe('isWebSocketMessage', () => {
  it('accepts a snapshot envelope', () => {
    expect(
      isWebSocketMessage({
        type: 'market.snapshot',
        timestamp: 1,
        data: [],
      }),
    ).toBe(true);
  });

  it('rejects payloads without a known type', () => {
    expect(isWebSocketMessage({ type: 'binance.ticker', timestamp: 1 })).toBe(
      false,
    );
    expect(isWebSocketMessage(null)).toBe(false);
  });
});
