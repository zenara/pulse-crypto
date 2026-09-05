import type { MarketState, PairMetadata } from '@pulse-crypto/contracts';
import type { MarketSocket } from '../networking/market-websocket.service';
import { resetFavoritesStore, useFavoritesStore } from '../state/favorites-store';
import { resetMarketStore, useMarketStore } from '../state/market-store';
import { MarketSession } from './market-session';

class FakeSocket implements MarketSocket {
  onopen: ((event?: unknown) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;
  onclose: ((event?: unknown) => void) | null = null;

  close(): void {
    this.onclose?.();
  }

  open(): void {
    this.onopen?.();
  }

  message(data: unknown): void {
    this.onmessage?.({ data });
  }
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

const btcMeta: PairMetadata = {
  symbol: 'BTCUSDT',
  displayName: 'BTC / USDT',
  tradingStatus: 'TRADING',
  high24h: 1,
  low24h: 0.5,
  volume24h: 10,
};

describe('MarketSession', () => {
  beforeEach(() => {
    resetMarketStore();
    resetFavoritesStore();
  });

  it('writes connection status and snapshots into the market store', () => {
    const sockets: FakeSocket[] = [];
    const session = new MarketSession({
      apiUrl: undefined,
      wsUrl: 'ws://api.test/market',
      hydrateFavorites: async () => undefined,
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
    });

    session.start();
    expect(useMarketStore.getState().connectionStatus).toBe('connecting');
    sockets[0]?.open();
    sockets[0]?.message(
      JSON.stringify({
        type: 'market.snapshot',
        timestamp: 1,
        data: [btc],
      }),
    );

    expect(useMarketStore.getState().connectionStatus).toBe('connected');
    expect(useMarketStore.getState().markets.BTCUSDT?.lastPrice).toBe(65000);

    session.stop();
    expect(useMarketStore.getState().connectionStatus).toBe('disconnected');
    expect(useMarketStore.getState().markets.BTCUSDT?.lastPrice).toBe(65000);
  });

  it('loads pair metadata without touching the socket', async () => {
    const fetchPairs = jest.fn().mockResolvedValue([btcMeta]);
    const createSocket = jest.fn();
    const session = new MarketSession({
      apiUrl: 'http://api.test',
      wsUrl: undefined,
      fetchPairs,
      createSocket,
      hydrateFavorites: async () => undefined,
    });

    session.start();
    await Promise.resolve();

    expect(fetchPairs).toHaveBeenCalledWith('http://api.test');
    expect(useMarketStore.getState().pairs).toEqual([btcMeta]);
    expect(createSocket).not.toHaveBeenCalled();
    expect(useMarketStore.getState().connectionStatus).toBe('error');
    session.stop();
  });

  it('keeps previous metadata when a refresh fails', async () => {
    useMarketStore.getState().setPairs([btcMeta]);
    const fetchPairs = jest.fn().mockRejectedValue(new Error('offline'));
    const session = new MarketSession({
      apiUrl: 'http://api.test',
      wsUrl: undefined,
      fetchPairs,
      hydrateFavorites: async () => undefined,
    });

    session.start();
    await Promise.resolve();

    expect(useMarketStore.getState().pairs).toEqual([btcMeta]);
    expect(useMarketStore.getState().metaError).toBe(
      'Unable to retrieve pair metadata',
    );
    expect(useMarketStore.getState().metaLoading).toBe(false);
    session.stop();
  });

  it('marks metadata as loading until REST resolves', async () => {
    let resolvePairs: (value: PairMetadata[]) => void = () => undefined;
    const fetchPairs = jest.fn(
      () =>
        new Promise<PairMetadata[]>((resolve) => {
          resolvePairs = resolve;
        }),
    );
    const session = new MarketSession({
      apiUrl: 'http://api.test',
      wsUrl: undefined,
      fetchPairs,
      hydrateFavorites: async () => undefined,
    });

    session.start();
    expect(useMarketStore.getState().metaLoading).toBe(true);

    resolvePairs([btcMeta]);
    await Promise.resolve();
    await Promise.resolve();

    expect(useMarketStore.getState().metaLoading).toBe(false);
    expect(useMarketStore.getState().pairs).toEqual([btcMeta]);
    session.stop();
  });

  it('hydrates favourites independently of market data', async () => {
    const hydrateFavorites = jest.fn(async () => {
      useFavoritesStore.setState({ favorites: ['BTCUSDT'], hydrated: true });
    });
    const session = new MarketSession({
      apiUrl: undefined,
      wsUrl: undefined,
      hydrateFavorites,
    });

    session.start();
    await Promise.resolve();

    expect(hydrateFavorites).toHaveBeenCalled();
    expect(useFavoritesStore.getState().favorites).toEqual(['BTCUSDT']);
    session.stop();
  });

  it('records protocol errors without changing connection status', () => {
    const sockets: FakeSocket[] = [];
    const session = new MarketSession({
      apiUrl: undefined,
      wsUrl: 'ws://api.test/market',
      hydrateFavorites: async () => undefined,
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket;
      },
    });

    session.start();
    sockets[0]?.open();
    sockets[0]?.message(
      JSON.stringify({
        type: 'error',
        timestamp: 1,
        data: { code: 'INTERNAL_ERROR', message: 'Unable to process market snapshot' },
      }),
    );

    expect(useMarketStore.getState().protocolError).toBe(
      'Unable to process market snapshot',
    );
    expect(useMarketStore.getState().connectionStatus).toBe('connected');
    session.stop();
  });
});
