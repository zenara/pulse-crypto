import * as React from 'react';
import { render } from '@testing-library/react-native';
import { resetFavoritesStore } from '../state/favorites-store';
import { resetMarketStore } from '../state/market-store';

import App from './App';

jest.mock('../config/env', () => ({
  readMobileEnv: () => ({ apiUrl: undefined, wsUrl: undefined }),
}));

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
