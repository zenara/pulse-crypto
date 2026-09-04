import { SUPPORTED_TRADING_PAIRS } from '@pulse-crypto/contracts';
import { StaticPairMetadataProvider } from './static-pair-metadata.provider';

describe('StaticPairMetadataProvider', () => {
  it('returns mocked metadata for every supported pair', async () => {
    const provider = new StaticPairMetadataProvider();
    const pairs = await provider.getAll();

    expect(pairs.map((pair) => pair.symbol)).toEqual([...SUPPORTED_TRADING_PAIRS]);
    expect(pairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: 'BTCUSDT',
          displayName: 'BTC / USDT',
          tradingStatus: 'TRADING',
          high24h: expect.any(Number),
          low24h: expect.any(Number),
          volume24h: expect.any(Number),
        }),
      ]),
    );
  });
});
