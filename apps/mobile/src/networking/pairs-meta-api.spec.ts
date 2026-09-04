import { ApiRequestError } from './api-error';
import { fetchPairsMeta } from './pairs-meta-api';

const btc = {
  symbol: 'BTCUSDT',
  displayName: 'BTC / USDT',
  tradingStatus: 'TRADING',
  high24h: 1,
  low24h: 0.5,
  volume24h: 10,
};

describe('fetchPairsMeta', () => {
  it('returns supported pair metadata', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ pairs: [btc, { symbol: 'FAKE', displayName: 'nope' }] }),
    });

    await expect(fetchPairsMeta('http://api.test', fetchFn)).resolves.toEqual([btc]);
  });

  it('rejects a payload that is not a pairs list', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ markets: [] }),
    });

    await expect(fetchPairsMeta('http://api.test', fetchFn)).rejects.toBeInstanceOf(
      ApiRequestError,
    );
  });
});
