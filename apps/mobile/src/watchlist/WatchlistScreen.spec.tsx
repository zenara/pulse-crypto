import * as React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { MarketState, PairMetadata } from '@pulse-crypto/contracts';
import { resetFavoritesStore, useFavoritesStore } from '../state/favorites-store';
import { resetMarketStore, useMarketStore } from '../state/market-store';
import { WatchlistScreen } from './WatchlistScreen';

const btcMeta: PairMetadata = {
  symbol: 'BTCUSDT',
  displayName: 'BTC / USDT',
  tradingStatus: 'TRADING',
  high24h: 1,
  low24h: 0.5,
  volume24h: 10,
};

const ethMeta: PairMetadata = {
  ...btcMeta,
  symbol: 'ETHUSDT',
  displayName: 'ETH / USDT',
};

const btc: MarketState = {
  pair: 'BTCUSDT',
  lastPrice: 65000.5,
  change24hPercent: 1.25,
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
  change24hPercent: -2.5,
  updatedAt: 2,
};

describe('WatchlistScreen', () => {
  beforeEach(() => {
    resetMarketStore();
    resetFavoritesStore();
  });

  it('renders supported pairs, live price, change, and connection status', () => {
    useMarketStore.getState().setPairs([btcMeta, ethMeta]);
    useMarketStore.getState().applySnapshot([btc, eth]);
    useMarketStore.getState().setConnectionStatus('connected');

    const { getByTestId } = render(<WatchlistScreen wsConfigured onSelectPair={() => undefined} />);

    expect(getByTestId('connection-status')).toHaveTextContent('Connected');
    expect(getByTestId('pair-BTCUSDT')).toHaveTextContent(/BTC \/ USDT/);
    expect(getByTestId('pair-BTCUSDT-price')).toHaveTextContent('65,000.50');
    expect(getByTestId('pair-BTCUSDT-change')).toHaveTextContent('+1.25%');
    expect(getByTestId('pair-ETHUSDT-change')).toHaveTextContent('-2.50%');
  });

  it('filters the pair list from search input', () => {
    useMarketStore.getState().setPairs([btcMeta, ethMeta]);

    const { getByTestId, queryByTestId } = render(
      <WatchlistScreen wsConfigured onSelectPair={() => undefined} />,
    );

    fireEvent.changeText(getByTestId('search-input'), 'eth');

    expect(queryByTestId('pair-BTCUSDT')).toBeNull();
    expect(getByTestId('pair-ETHUSDT')).toBeTruthy();
  });

  it('toggles a favourite from the row control', async () => {
    useMarketStore.getState().setPairs([btcMeta]);

    const { getByTestId } = render(<WatchlistScreen wsConfigured onSelectPair={() => undefined} />);

    fireEvent.press(getByTestId('pair-BTCUSDT-favorite'));

    await waitFor(() => {
      expect(useFavoritesStore.getState().isFavorite('BTCUSDT')).toBe(true);
    });

    fireEvent.press(getByTestId('pair-BTCUSDT-favorite'));

    await waitFor(() => {
      expect(useFavoritesStore.getState().isFavorite('BTCUSDT')).toBe(false);
    });
  });

  it('keeps last prices visible after disconnect', () => {
    useMarketStore.getState().setPairs([btcMeta]);
    useMarketStore.getState().applySnapshot([btc]);
    useMarketStore.getState().setConnectionStatus('disconnected');

    const { getByTestId } = render(<WatchlistScreen wsConfigured onSelectPair={() => undefined} />);

    expect(getByTestId('connection-status')).toHaveTextContent('Disconnected');
    expect(getByTestId('pair-BTCUSDT-price')).toHaveTextContent('65,000.50');
  });

  it('notifies when a pair row is selected', () => {
    useMarketStore.getState().setPairs([btcMeta]);
    const onSelectPair = jest.fn();
    const { getByTestId } = render(
      <WatchlistScreen wsConfigured onSelectPair={onSelectPair} />,
    );

    fireEvent.press(getByTestId('pair-BTCUSDT-open'));
    expect(onSelectPair).toHaveBeenCalledWith('BTCUSDT');
  });
});
