import { readMobileEnv } from './env';

describe('readMobileEnv', () => {
  it('returns undefined URLs when env is empty', () => {
    expect(readMobileEnv({})).toEqual({
      apiUrl: undefined,
      wsUrl: undefined,
    });
  });

  it('trims trailing slashes without dropping the market path', () => {
    expect(
      readMobileEnv({
        EXPO_PUBLIC_API_URL: 'http://10.0.2.2:3000/',
        EXPO_PUBLIC_WS_URL: 'ws://10.0.2.2:3000/market/',
      }),
    ).toEqual({
      apiUrl: 'http://10.0.2.2:3000',
      wsUrl: 'ws://10.0.2.2:3000/market',
    });
  });

  it('reads EXPO_PUBLIC vars from process.env when no override is passed', () => {
    const previousApi = process.env.EXPO_PUBLIC_API_URL;
    const previousWs = process.env.EXPO_PUBLIC_WS_URL;
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.2.2:3000/';
    process.env.EXPO_PUBLIC_WS_URL = 'ws://10.0.2.2:3000/market/';
    try {
      expect(readMobileEnv()).toEqual({
        apiUrl: 'http://10.0.2.2:3000',
        wsUrl: 'ws://10.0.2.2:3000/market',
      });
    } finally {
      process.env.EXPO_PUBLIC_API_URL = previousApi;
      process.env.EXPO_PUBLIC_WS_URL = previousWs;
    }
  });
});
