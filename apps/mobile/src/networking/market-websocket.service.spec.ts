import type { ConnectionStatus, MarketState } from '@pulse-crypto/contracts';
import { reconnectDelayMs } from '@pulse-crypto/shared';
import {
  MarketWebSocketService,
  type MarketSocket,
  type MarketWebSocketListener,
} from './market-websocket.service';

class FakeSocket implements MarketSocket {
  onopen: ((event?: unknown) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;
  onclose: ((event?: unknown) => void) | null = null;
  closed = false;

  close(): void {
    this.closed = true;
    this.onclose?.();
  }

  open(): void {
    this.onopen?.();
  }

  message(data: unknown): void {
    this.onmessage?.({ data });
  }
}

function createService(sockets: FakeSocket[]) {
  const statuses: ConnectionStatus[] = [];
  const snapshots: MarketState[][] = [];
  const protocolErrors: Array<{ code: string; message: string }> = [];
  const listener: MarketWebSocketListener = {
    onStatus: (status: ConnectionStatus) => {
      statuses.push(status);
    },
    onSnapshot: (states: MarketState[]) => {
      snapshots.push(states);
    },
    onProtocolError: (code: string, message: string) => {
      protocolErrors.push({ code, message });
    },
  };

  const service = new MarketWebSocketService({
    url: 'ws://api.test/market',
    listener,
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
  });

  return { service, statuses, snapshots, protocolErrors };
}

const btc: MarketState = {
  pair: 'BTCUSDT',
  lastPrice: 65000,
  change24hPercent: 1,
  high24h: 66000,
  low24h: 64000,
  volume24h: 10,
  spread: null,
  buyPressure: null,
  sellPressure: null,
  bids: [],
  asks: [],
  updatedAt: 1,
};

describe('MarketWebSocketService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('moves connecting → connected and forwards a snapshot', () => {
    const sockets: FakeSocket[] = [];
    const { service, statuses, snapshots } = createService(sockets);

    service.start();
    expect(statuses).toEqual(['connecting']);
    sockets[0]?.open();
    expect(statuses.at(-1)).toBe('connected');

    sockets[0]?.message(
      JSON.stringify({
        type: 'market.snapshot',
        timestamp: 1,
        data: [btc],
      }),
    );
    expect(snapshots).toEqual([[btc]]);

    service.stop();
    expect(statuses.at(-1)).toBe('disconnected');
  });

  it('ignores malformed and unknown messages', () => {
    const sockets: FakeSocket[] = [];
    const { service, snapshots } = createService(sockets);

    service.start();
    sockets[0]?.open();
    sockets[0]?.message('{');
    sockets[0]?.message(JSON.stringify({ type: 'binance.ticker', timestamp: 1 }));
    sockets[0]?.message({ not: 'a string' });

    expect(snapshots).toEqual([]);
    service.stop();
  });

  it('forwards protocol errors without changing connection status', () => {
    const sockets: FakeSocket[] = [];
    const { service, statuses, protocolErrors } = createService(sockets);

    service.start();
    sockets[0]?.open();
    sockets[0]?.message(
      JSON.stringify({
        type: 'error',
        timestamp: 1,
        data: { code: 'INTERNAL_ERROR', message: 'Unable to process market snapshot' },
      }),
    );

    expect(protocolErrors).toEqual([
      { code: 'INTERNAL_ERROR', message: 'Unable to process market snapshot' },
    ]);
    expect(statuses.at(-1)).toBe('connected');
    service.stop();
  });

  it('reconnects once with bounded backoff after disconnect', () => {
    const sockets: FakeSocket[] = [];
    const { service, statuses } = createService(sockets);

    service.start();
    sockets[0]?.open();
    sockets[0]?.close();

    expect(statuses.slice(-2)).toEqual(['disconnected', 'reconnecting']);
    expect(sockets).toHaveLength(1);

    jest.advanceTimersByTime(reconnectDelayMs(1) - 1);
    expect(sockets).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);

    sockets[1]?.open();
    expect(statuses.at(-1)).toBe('connected');
    service.stop();
  });

  it('resets backoff after a successful connection', () => {
    const sockets: FakeSocket[] = [];
    const { service } = createService(sockets);

    service.start();
    sockets[0]?.open();
    sockets[0]?.close();
    jest.advanceTimersByTime(reconnectDelayMs(1));
    sockets[1]?.open();
    sockets[1]?.close();

    jest.advanceTimersByTime(reconnectDelayMs(1) - 1);
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);

    service.stop();
  });

  it('does not start a second reconnect loop', () => {
    const sockets: FakeSocket[] = [];
    const { service } = createService(sockets);

    service.start();
    sockets[0]?.onerror?.();
    sockets[0]?.close();
    sockets[0]?.close();

    jest.advanceTimersByTime(reconnectDelayMs(1));
    expect(sockets).toHaveLength(2);

    service.stop();
    jest.advanceTimersByTime(30_000);
    expect(sockets).toHaveLength(2);
  });

  it('reports error and does not connect when the URL is missing', () => {
    const statuses: ConnectionStatus[] = [];
    const createSocket = jest.fn();
    const service = new MarketWebSocketService({
      url: '',
      listener: {
        onStatus: (status: ConnectionStatus) => statuses.push(status),
        onSnapshot: () => undefined,
        onProtocolError: () => undefined,
      },
      createSocket,
    });

    service.start();
    expect(statuses).toEqual(['error']);
    expect(createSocket).not.toHaveBeenCalled();
  });
});
