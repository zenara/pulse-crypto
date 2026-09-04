import { Logger } from '@nestjs/common';
import type { MarketState } from '@pulse-crypto/contracts';
import { MarketGateway } from './market.gateway';
import type { GatewayClient } from './client-session';

class FakeClient implements GatewayClient {
  readyState = 1;
  readonly sent: string[] = [];
  hold = false;
  private readonly sendCallbacks: Array<(error?: Error) => void> = [];
  private readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  send(data: string, callback?: (error?: Error) => void): void {
    this.sent.push(data);
    if (this.hold) {
      if (callback) {
        this.sendCallbacks.push(callback);
      }
      return;
    }
    callback?.();
  }

  release(error?: Error): void {
    const callbacks = this.sendCallbacks.splice(0);
    for (const callback of callbacks) {
      callback(error);
    }
  }

  on(event: 'close' | 'error', listener: (...args: unknown[]) => void): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

function parseSent(client: FakeClient): Array<{ type: string; data?: MarketState[] }> {
  return client.sent.map((payload) => JSON.parse(payload) as { type: string; data?: MarketState[] });
}

const btc: MarketState = {
  pair: 'BTCUSDT',
  lastPrice: 65000,
  change24hPercent: -1,
  high24h: 67000,
  low24h: 64000,
  volume24h: 1,
  spread: 1.5,
  buyPressure: 50,
  sellPressure: 50,
  bids: [{ price: 64999, quantity: 1 }],
  asks: [{ price: 65000.5, quantity: 1 }],
  updatedAt: 10,
};

describe('MarketGateway', () => {
  let gateway: MarketGateway;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    gateway = new MarketGateway();
  });

  it('sends connection.ready when a client connects', () => {
    const client = new FakeClient();
    gateway.handleConnection(client);

    expect(parseSent(client)).toEqual([
      expect.objectContaining({ type: 'connection.ready' }),
    ]);
  });

  it('sends the latest snapshot to a client that connects after a publish', () => {
    gateway.publish([btc]);
    const client = new FakeClient();
    gateway.handleConnection(client);

    expect(parseSent(client).map((message) => message.type)).toEqual([
      'connection.ready',
      'market.snapshot',
    ]);
    expect(parseSent(client)[1]?.data).toEqual([btc]);
  });

  it('broadcasts a snapshot to every connected client', () => {
    const first = new FakeClient();
    const second = new FakeClient();
    gateway.handleConnection(first);
    gateway.handleConnection(second);

    gateway.publish([btc]);

    expect(parseSent(first).some((message) => message.type === 'market.snapshot')).toBe(
      true,
    );
    expect(parseSent(second).some((message) => message.type === 'market.snapshot')).toBe(
      true,
    );
  });

  it('stops sending after disconnect', () => {
    const client = new FakeClient();
    gateway.handleConnection(client);
    gateway.handleDisconnect(client);
    gateway.publish([btc]);

    expect(parseSent(client).map((message) => message.type)).toEqual([
      'connection.ready',
    ]);
  });

  it('drops a client after a socket error', () => {
    const client = new FakeClient();
    gateway.handleConnection(client);
    client.emit('error', new Error('reset'));
    gateway.publish([btc]);

    expect(parseSent(client).map((message) => message.type)).toEqual([
      'connection.ready',
    ]);
  });

  it('discards intermediate snapshots for a slow consumer', () => {
    const client = new FakeClient();
    client.hold = true;
    gateway.handleConnection(client);

    gateway.publish([{ ...btc, lastPrice: 1 }]);
    gateway.publish([{ ...btc, lastPrice: 2 }]);
    gateway.publish([{ ...btc, lastPrice: 3 }]);
    client.release();

    const snapshots = parseSent(client).filter(
      (message) => message.type === 'market.snapshot',
    );
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.data?.[0]?.lastPrice).toBe(3);
  });
});
