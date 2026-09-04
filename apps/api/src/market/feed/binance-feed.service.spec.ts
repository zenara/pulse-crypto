import { Logger } from '@nestjs/common';
import { BinanceFeedService } from './binance-feed.service';
import type { BinanceFeedConfig } from './binance-feed.config';
import type { FeedWebSocket, MarketFeedListener } from './binance-feed.tokens';

class FakeSocket implements FeedWebSocket {
  readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  closed = false;

  on(event: string, listener: (...args: unknown[]) => void): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  close(): void {
    this.closed = true;
    this.emit('close');
  }
}

const config: BinanceFeedConfig = {
  enabled: true,
  wsBaseUrl: 'wss://example.test',
  pairs: ['BTCUSDT'],
  orderBookDepth: 10,
};

function createService(sockets: FakeSocket[]) {
  const listener: MarketFeedListener = {
    onTicker: jest.fn(),
    onOrderBook: jest.fn(),
  };
  const service = new BinanceFeedService(
    config,
    () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    listener,
  );
  return { service, listener };
}

describe('BinanceFeedService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('parses live messages and does not reconnect while connected', () => {
    const sockets: FakeSocket[] = [];
    const { service, listener } = createService(sockets);

    service.start();
    expect(sockets).toHaveLength(1);
    sockets[0].emit('open');
    sockets[0].emit(
      'message',
      JSON.stringify({
        stream: 'btcusdt@ticker',
        data: {
          e: '24hrTicker',
          E: 1,
          s: 'BTCUSDT',
          P: '1.5',
          c: '10',
          h: '11',
          l: '9',
          q: '100',
        },
      }),
    );

    expect(listener.onTicker).toHaveBeenCalledWith(
      expect.objectContaining({ pair: 'BTCUSDT', lastPrice: 10 }),
    );

    jest.advanceTimersByTime(30_000);
    expect(sockets).toHaveLength(1);

    service.stop();
  });

  it('reconnects once with bounded backoff after disconnect', () => {
    const sockets: FakeSocket[] = [];
    const { service } = createService(sockets);

    service.start();
    sockets[0].emit('open');
    sockets[0].emit('close');

    expect(sockets).toHaveLength(1);
    jest.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);

    service.stop();
    expect(sockets[1].closed).toBe(true);
    jest.advanceTimersByTime(30_000);
    expect(sockets).toHaveLength(2);
  });

  it('does not start a second reconnect loop', () => {
    const sockets: FakeSocket[] = [];
    const { service } = createService(sockets);

    service.start();
    sockets[0].emit('error', new Error('network'));
    sockets[0].emit('close');
    sockets[0].emit('close');

    jest.advanceTimersByTime(1_000);
    expect(sockets).toHaveLength(2);

    service.stop();
  });
});
