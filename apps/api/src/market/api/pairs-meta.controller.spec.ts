import { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SUPPORTED_TRADING_PAIRS } from '@pulse-crypto/contracts';
import { ApiExceptionFilter } from '../../common/api-exception.filter';
import { PairsMetaController } from './pairs-meta.controller';
import { PAIR_METADATA_PROVIDER } from './pair-metadata.provider';
import { StaticPairMetadataProvider } from './static-pair-metadata.provider';

async function listen(app: INestApplication): Promise<string> {
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (typeof address === 'object' && address) {
    return `http://127.0.0.1:${address.port}`;
  }
  throw new Error('Failed to bind test server');
}

describe('GET /pairs/meta', () => {
  it('returns 200 and metadata for all supported pairs', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PairsMetaController],
      providers: [
        {
          provide: PAIR_METADATA_PROVIDER,
          useClass: StaticPairMetadataProvider,
        },
        {
          provide: APP_FILTER,
          useClass: ApiExceptionFilter,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    const baseUrl = await listen(app);

    try {
      const response = await fetch(`${baseUrl}/pairs/meta`);
      const body = (await response.json()) as {
        pairs: Array<{ symbol: string; displayName: string }>;
      };

      expect(response.status).toBe(200);
      expect(body.pairs.map((pair) => pair.symbol)).toEqual([
        ...SUPPORTED_TRADING_PAIRS,
      ]);
      expect(body.pairs[0]).toEqual(
        expect.objectContaining({
          symbol: 'BTCUSDT',
          displayName: 'BTC / USDT',
          tradingStatus: 'TRADING',
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns a contract error payload when metadata cannot be loaded', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PairsMetaController],
      providers: [
        {
          provide: PAIR_METADATA_PROVIDER,
          useValue: {
            getAll: async () => {
              throw new Error('store unavailable');
            },
          },
        },
        {
          provide: APP_FILTER,
          useClass: ApiExceptionFilter,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    const baseUrl = await listen(app);

    try {
      const response = await fetch(`${baseUrl}/pairs/meta`);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to retrieve pair metadata',
        },
      });
    } finally {
      await app.close();
    }
  });
});
