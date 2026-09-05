import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { MarketState } from '@pulse-crypto/contracts';
import { resetFavoritesStore } from '../state/favorites-store';
import { resetMarketStore, useMarketStore } from '../state/market-store';

import App from './App';

jest.mock('../config/env', () => ({
  readMobileEnv: () => ({ apiUrl: undefined, wsUrl: undefined }),
}));

const btc: MarketState = {
  pair: 'BTCUSDT',
  lastPrice: 65000.5,
  change24hPercent: 1.25,
  high24h: 66000,
  low24h: 64000,
  volume24h: 10,
  spread: 1.5,
  buyPressure: 55.2,
  sellPressure: 44.8,
  bids: [{ price: 65000, quantity: 1.2 }],
  asks: [{ price: 65001.5, quantity: 0.8 }],
  updatedAt: 1,
};

beforeEach(() => {
  resetMarketStore();
  resetFavoritesStore();
});

test('renders correctly', () => {
  const { getByTestId, unmount } = render(<App />);
  expect(getByTestId('heading')).toHaveTextContent(/PulseCrypto/);
  expect(getByTestId('connection-status')).toBeTruthy();
  unmount();
});

test('opens and closes market details from the watchlist', () => {
  useMarketStore.getState().applySnapshot([btc]);
  const { getByTestId, queryByTestId } = render(<App />);

  fireEvent.press(getByTestId('pair-BTCUSDT-open'));
  expect(getByTestId('market-details')).toBeTruthy();
  expect(getByTestId('details-price')).toHaveTextContent('65,000.50');
  expect(queryByTestId('watchlist')).toBeNull();

  fireEvent.press(getByTestId('details-back'));
  expect(getByTestId('watchlist')).toBeTruthy();
  expect(queryByTestId('market-details')).toBeNull();
});
