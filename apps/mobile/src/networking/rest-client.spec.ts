import { ApiRequestError } from './api-error';
import { getJson } from './rest-client';

describe('getJson', () => {
  it('returns the parsed JSON body on success', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ pairs: [] }),
    });

    await expect(getJson('http://api.test', '/pairs/meta', fetchFn)).resolves.toEqual(
      { pairs: [] },
    );
    expect(fetchFn).toHaveBeenCalledWith('http://api.test/pairs/meta');
  });

  it('maps an API error body to a user-facing request error', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { code: 'INTERNAL_ERROR', message: 'Unable to retrieve pair metadata' },
      }),
    });

    await expect(getJson('http://api.test', '/pairs/meta', fetchFn)).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiRequestError',
        code: 'INTERNAL_ERROR',
        message: 'Unable to retrieve pair metadata',
        status: 500,
      }),
    );
  });

  it('does not throw a raw network exception', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(getJson('http://api.test', '/pairs/meta', fetchFn)).rejects.toBeInstanceOf(
      ApiRequestError,
    );
    await expect(getJson('http://api.test', '/pairs/meta', fetchFn)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the market API',
    });
  });
});
