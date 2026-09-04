import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { MarketState } from '@pulse-crypto/contracts';
import { WebSocket } from 'ws';
import { applyNativeWsAdapter } from './apply-native-ws-adapter';
import { MarketGateway } from './market.gateway';
import { MARKET_WS_PATH } from './market-ws.path';

async function listen(app: INestApplication): Promise<number> {
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (typeof address === 'object' && address) {
    return address.port;
  }
  throw new Error('Failed to bind test server');
}

function nextJsonMessage(socket: WebSocket): Promise<{ type: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timed out waiting for WebSocket message'));
    }, 2000);

    socket.once('message', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()) as { type: string });
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

const state: MarketState = {
  pair: 'ETHUSDT',
  lastPrice: 4000,
  change24hPercent: 0.5,
  high24h: 4100,
  low24h: 3900,
  volume24h: 10,
  spread: null,
  buyPressure: null,
  sellPressure: null,
  bids: [],
  asks: [],
  updatedAt: 1,
};

describe('MarketGateway WebSocket transport', () => {
  let app: INestApplication;
  let gateway: MarketGateway;
  let port: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MarketGateway],
    }).compile();

    app = moduleRef.createNestApplication();
    applyNativeWsAdapter(app);
    await app.init();
    port = await listen(app);
    gateway = app.get(MarketGateway);
  });

  afterAll(async () => {
    await app.close();
  });

  it('delivers connection.ready and a market snapshot to a real client', async () => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}${MARKET_WS_PATH}`);
    try {
      const readyPromise = nextJsonMessage(socket);
      await new Promise<void>((resolve, reject) => {
        socket.once('open', () => resolve());
        socket.once('error', reject);
      });

      const ready = await readyPromise;
      expect(ready.type).toBe('connection.ready');

      const snapshotPromise = nextJsonMessage(socket);
      gateway.publish([state]);
      const snapshot = await snapshotPromise;
      expect(snapshot.type).toBe('market.snapshot');
    } finally {
      socket.close();
    }
  });
});
