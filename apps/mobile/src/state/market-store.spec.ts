import type { MarketState, PairMetadata } from '@pulse-crypto/contracts';
import { resetMarketStore, selectMarket, useMarketStore } from './market-store';

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

const eth: MarketState = {
  ...btc,
  pair: 'ETHUSDT',
  lastPrice: 3200,
  updatedAt: 2,
};

const btcMeta: PairMetadata = {
  symbol: 'BTCUSDT',
  displayName: 'BTC / USDT',
  tradingStatus: 'TRADING',
  high24h: 1,
  low24h: 0.5,
  volume24h: 10,
};

describe('market store', () => {
  beforeEach(() => {
    resetMarketStore();
  });

  it('merges snapshots by pair using latest-state replacement', () => {
    useMarketStore.getState().applySnapshot([btc, eth]);
    useMarketStore.getState().applySnapshot([{ ...btc, lastPrice: 65100 }]);

    expect(useMarketStore.getState().markets.BTCUSDT?.lastPrice).toBe(65100);
    expect(useMarketStore.getState().markets.ETHUSDT?.lastPrice).toBe(3200);
  });

  it('keeps existing markets when connection status changes', () => {
    useMarketStore.getState().applySnapshot([btc]);
    useMarketStore.getState().setConnectionStatus('disconnected');

    expect(useMarketStore.getState().connectionStatus).toBe('disconnected');
    expect(useMarketStore.getState().markets.BTCUSDT).toEqual(btc);
  });

  it('clears a metadata error after a successful REST refresh', () => {
    useMarketStore.getState().setMetaError('Unable to retrieve pair metadata');
    useMarketStore.getState().setPairs([btcMeta]);

    expect(useMarketStore.getState().pairs).toEqual([btcMeta]);
    expect(useMarketStore.getState().metaError).toBeUndefined();
  });

  it('exposes a per-pair selector for later watchlist rows', () => {
    useMarketStore.getState().applySnapshot([btc]);
    expect(selectMarket('BTCUSDT')(useMarketStore.getState())).toEqual(btc);
    expect(selectMarket('ETHUSDT')(useMarketStore.getState())).toBeUndefined();
  });
});
