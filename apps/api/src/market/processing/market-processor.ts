import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { MarketState, OrderBookLevel, TradingPair } from '@pulse-crypto/contracts';
import {
  boundOrderBookLevels,
  calculateBookPressure,
  calculateSpread,
  type OrderBookUpdate,
  type TickerUpdate,
} from '@pulse-crypto/market-domain';
import type { MarketFeedListener } from '../feed/binance-feed.tokens';
import {
  MARKET_PROCESSOR_CONFIG,
  MARKET_SNAPSHOT_SINK,
  type MarketProcessorConfig,
  type MarketSnapshotSink,
} from './market-processor.tokens';

interface PairAccumulator {
  pair: TradingPair;
  lastPrice?: number;
  change24hPercent?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number | null;
  buyPressure: number | null;
  sellPressure: number | null;
  updatedAt: number;
}

@Injectable()
export class MarketProcessor
  implements OnModuleInit, OnModuleDestroy, MarketFeedListener
{
  private readonly states = new Map<TradingPair, PairAccumulator>();
  private dirty = false;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(MARKET_PROCESSOR_CONFIG)
    private readonly config: MarketProcessorConfig,
    @Inject(MARKET_SNAPSHOT_SINK)
    private readonly sink: MarketSnapshotSink,
  ) {}

  onModuleInit(): void {
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(): void {
    if (this.timer !== undefined) {
      return;
    }

    this.timer = setInterval(() => {
      this.publishIfDirty();
    }, this.config.intervalMs);
  }

  stop(): void {
    if (this.timer === undefined) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
  }

  onTicker(update: TickerUpdate): void {
    const current = this.getOrCreate(update.pair, update.eventTime);
    current.lastPrice = update.lastPrice;
    current.change24hPercent = update.change24hPercent;
    current.high24h = update.high24h;
    current.low24h = update.low24h;
    current.volume24h = update.volume24h;
    current.updatedAt = update.eventTime;
    this.dirty = true;
  }

  onOrderBook(update: OrderBookUpdate): void {
    const current = this.getOrCreate(update.pair, update.eventTime);
    current.bids = boundOrderBookLevels(
      update.bids,
      'bid',
      this.config.orderBookDepth,
    );
    current.asks = boundOrderBookLevels(
      update.asks,
      'ask',
      this.config.orderBookDepth,
    );
    current.spread = calculateSpread(current.bids, current.asks);
    const pressure = calculateBookPressure(current.bids, current.asks);
    current.buyPressure = pressure?.buyPressure ?? null;
    current.sellPressure = pressure?.sellPressure ?? null;
    current.updatedAt = update.eventTime;
    this.dirty = true;
  }

  private getOrCreate(pair: TradingPair, updatedAt: number): PairAccumulator {
    const existing = this.states.get(pair);
    if (existing) {
      return existing;
    }

    const created: PairAccumulator = {
      pair,
      bids: [],
      asks: [],
      spread: null,
      buyPressure: null,
      sellPressure: null,
      updatedAt,
    };
    this.states.set(pair, created);
    return created;
  }

  private publishIfDirty(): void {
    if (!this.dirty) {
      return;
    }

    this.dirty = false;
    const snapshot = this.collectSnapshot();
    if (snapshot.length === 0) {
      return;
    }

    this.sink.publish(snapshot);
  }

  private collectSnapshot(): MarketState[] {
    const snapshot: MarketState[] = [];

    for (const state of this.states.values()) {
      const published = toMarketState(state);
      if (published) {
        snapshot.push(published);
      }
    }

    snapshot.sort((a, b) => a.pair.localeCompare(b.pair));
    return snapshot;
  }
}

function toMarketState(state: PairAccumulator): MarketState | undefined {
  if (
    state.lastPrice === undefined ||
    state.change24hPercent === undefined ||
    state.high24h === undefined ||
    state.low24h === undefined ||
    state.volume24h === undefined
  ) {
    return undefined;
  }

  return {
    pair: state.pair,
    lastPrice: state.lastPrice,
    change24hPercent: state.change24hPercent,
    high24h: state.high24h,
    low24h: state.low24h,
    volume24h: state.volume24h,
    spread: state.spread,
    buyPressure: state.buyPressure,
    sellPressure: state.sellPressure,
    bids: state.bids.map((level) => ({ ...level })),
    asks: state.asks.map((level) => ({ ...level })),
    updatedAt: state.updatedAt,
  };
}
