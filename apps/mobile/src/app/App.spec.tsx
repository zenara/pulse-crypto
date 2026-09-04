import * as React from 'react';
import { render } from '@testing-library/react-native';

import App from './App';

jest.mock('../config/env', () => ({
  readMobileEnv: () => ({ apiUrl: undefined, wsUrl: undefined }),
}));

test('renders correctly', () => {
  const { getByTestId, unmount } = render(<App />);
  expect(getByTestId('heading')).toHaveTextContent(/PulseCrypto/);
  expect(getByTestId('connection-status')).toBeTruthy();
  unmount();
});
