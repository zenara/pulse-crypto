import type { MarketState } from '@pulse-crypto/contracts';
import type { OrderBookUpdate, TickerUpdate } from '@pulse-crypto/market-domain';
import { MarketProcessor } from './market-processor';
import type { MarketSnapshotSink } from './market-processor.tokens';

class CollectingSink implements MarketSnapshotSink {
  readonly snapshots: MarketState[][] = [];

  publish(snapshot: MarketState[]): void {
    this.snapshots.push(snapshot);
  }
}

function ticker(
  overrides: Partial<TickerUpdate> & Pick<TickerUpdate, 'pair'>,
): TickerUpdate {
  return {
    lastPrice: 100,
    change24hPercent: 1,
    high24h: 110,
    low24h: 90,
    volume24h: 1000,
    eventTime: 1,
    ...overrides,
  };
}

function book(
  overrides: Partial<OrderBookUpdate> & Pick<OrderBookUpdate, 'pair'>,
): OrderBookUpdate {
  return {
    bids: [{ price: 99, quantity: 2 }],
    asks: [{ price: 101, quantity: 2 }],
    lastUpdateId: 1,
    eventTime: 2,
    ...overrides,
  };
}

function createProcessor(
  intervalMs = 100,
  orderBookDepth = 10,
): { processor: MarketProcessor; sink: CollectingSink } {
  const sink = new CollectingSink();
  const processor = new MarketProcessor({ intervalMs, orderBookDepth }, sink);
  processor.start();
  return { processor, sink };
}

describe('MarketProcessor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('publishes a new pair after the batching interval', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'BTCUSDT', lastPrice: 42000 }));
    jest.advanceTimersByTime(99);
    expect(sink.snapshots).toHaveLength(0);

    jest.advanceTimersByTime(1);
    expect(sink.snapshots).toHaveLength(1);
    expect(sink.snapshots[0]).toEqual([
      expect.objectContaining({
        pair: 'BTCUSDT',
        lastPrice: 42000,
        bids: [],
        asks: [],
        spread: null,
        buyPressure: null,
        sellPressure: null,
      }),
    ]);

    processor.stop();
  });

  it('replaces latest ticker state instead of queuing intermediate updates', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'ETHUSDT', lastPrice: 1, eventTime: 1 }));
    processor.onTicker(ticker({ pair: 'ETHUSDT', lastPrice: 2, eventTime: 2 }));
    processor.onTicker(ticker({ pair: 'ETHUSDT', lastPrice: 3, eventTime: 3 }));
    jest.advanceTimersByTime(100);

    expect(sink.snapshots).toHaveLength(1);
    expect(sink.snapshots[0]?.[0]).toEqual(
      expect.objectContaining({ pair: 'ETHUSDT', lastPrice: 3, updatedAt: 3 }),
    );

    processor.stop();
  });

  it('keeps trading pairs independent in the same snapshot', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'BTCUSDT', lastPrice: 10 }));
    processor.onTicker(ticker({ pair: 'SOLUSDT', lastPrice: 20 }));
    jest.advanceTimersByTime(100);

    expect(sink.snapshots[0]?.map((row) => row.pair)).toEqual([
      'BTCUSDT',
      'SOLUSDT',
    ]);
    expect(sink.snapshots[0]?.find((row) => row.pair === 'BTCUSDT')?.lastPrice).toBe(
      10,
    );
    expect(sink.snapshots[0]?.find((row) => row.pair === 'SOLUSDT')?.lastPrice).toBe(
      20,
    );

    processor.stop();
  });

  it('merges an order-book update into existing ticker state', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'XRPUSDT', lastPrice: 3 }));
    processor.onOrderBook(
      book({
        pair: 'XRPUSDT',
        bids: [{ price: 2.9, quantity: 4 }],
        asks: [{ price: 3.1, quantity: 1 }],
      }),
    );
    jest.advanceTimersByTime(100);

    const row = sink.snapshots[0]?.[0];
    expect(row).toEqual(
      expect.objectContaining({
        pair: 'XRPUSDT',
        lastPrice: 3,
        buyPressure: 80,
        sellPressure: 20,
      }),
    );
    expect(row?.spread).toBeCloseTo(0.2);
    expect(row?.bids).toEqual([{ price: 2.9, quantity: 4 }]);
    expect(row?.asks).toEqual([{ price: 3.1, quantity: 1 }]);

    processor.stop();
  });

  it('preserves the bounded book when a later ticker arrives', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'DOGEUSDT', lastPrice: 0.1 }));
    processor.onOrderBook(book({ pair: 'DOGEUSDT' }));
    processor.onTicker(ticker({ pair: 'DOGEUSDT', lastPrice: 0.2, eventTime: 9 }));
    jest.advanceTimersByTime(100);

    expect(sink.snapshots[0]?.[0]).toEqual(
      expect.objectContaining({
        lastPrice: 0.2,
        updatedAt: 9,
        bids: [{ price: 99, quantity: 2 }],
        asks: [{ price: 101, quantity: 2 }],
      }),
    );

    processor.stop();
  });

  it('uses the configured batching interval', () => {
    const { processor, sink } = createProcessor(50);

    processor.onTicker(ticker({ pair: 'BTCUSDT' }));
    jest.advanceTimersByTime(49);
    expect(sink.snapshots).toHaveLength(0);
    jest.advanceTimersByTime(1);
    expect(sink.snapshots).toHaveLength(1);

    processor.stop();
  });

  it('does not republish while state is unchanged', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'BTCUSDT' }));
    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(100);

    expect(sink.snapshots).toHaveLength(1);

    processor.stop();
  });

  it('does not publish pairs that only have order-book data', () => {
    const { processor, sink } = createProcessor();

    processor.onOrderBook(book({ pair: 'ETHUSDT' }));
    jest.advanceTimersByTime(100);
    expect(sink.snapshots).toHaveLength(0);

    processor.onTicker(ticker({ pair: 'ETHUSDT', lastPrice: 8 }));
    jest.advanceTimersByTime(100);
    expect(sink.snapshots[0]?.[0]?.lastPrice).toBe(8);
    expect(sink.snapshots[0]?.[0]?.bids).toEqual([{ price: 99, quantity: 2 }]);

    processor.stop();
  });

  it('limits order-book depth', () => {
    const { processor, sink } = createProcessor(100, 2);

    processor.onTicker(ticker({ pair: 'BTCUSDT' }));
    processor.onOrderBook(
      book({
        pair: 'BTCUSDT',
        bids: [
          { price: 1, quantity: 1 },
          { price: 3, quantity: 1 },
          { price: 2, quantity: 1 },
        ],
        asks: [
          { price: 6, quantity: 1 },
          { price: 4, quantity: 1 },
          { price: 5, quantity: 1 },
        ],
      }),
    );
    jest.advanceTimersByTime(100);

    const row = sink.snapshots[0]?.[0];
    expect(row?.bids).toEqual([
      { price: 3, quantity: 1 },
      { price: 2, quantity: 1 },
    ]);
    expect(row?.asks).toEqual([
      { price: 4, quantity: 1 },
      { price: 5, quantity: 1 },
    ]);

    processor.stop();
  });

  it('treats zero-volume books as missing pressure', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'BTCUSDT' }));
    processor.onOrderBook(
      book({
        pair: 'BTCUSDT',
        bids: [{ price: 1, quantity: 0 }],
        asks: [{ price: 2, quantity: 0 }],
      }),
    );
    jest.advanceTimersByTime(100);

    expect(sink.snapshots[0]?.[0]).toEqual(
      expect.objectContaining({
        bids: [],
        asks: [],
        spread: null,
        buyPressure: null,
        sellPressure: null,
      }),
    );

    processor.stop();
  });

  it('stops publishing after cleanup', () => {
    const { processor, sink } = createProcessor();

    processor.onTicker(ticker({ pair: 'BTCUSDT' }));
    processor.stop();
    jest.advanceTimersByTime(200);

    expect(sink.snapshots).toHaveLength(0);
  });
});
