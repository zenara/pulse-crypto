import { Module } from '@nestjs/common';
import { WebSocket } from 'ws';
import { BinanceFeedService } from './feed/binance-feed.service';
import { readBinanceFeedConfig } from './feed/binance-feed.config';
import {
  BINANCE_FEED_CONFIG,
  MARKET_FEED_LISTENER,
  WEBSOCKET_FACTORY,
  type FeedWebSocket,
  type WebSocketFactory,
} from './feed/binance-feed.tokens';
import { MarketProcessor } from './processing/market-processor';
import { readMarketProcessorConfig } from './processing/market-processor.config';
import {
  MARKET_PROCESSOR_CONFIG,
  MARKET_SNAPSHOT_SINK,
} from './processing/market-processor.tokens';
import { MarketGateway } from './gateway/market.gateway';

/**
 * Composition root for feed, processor, and the mobile WebSocket gateway.
 * These providers live together so the feed can inject the processor as its
 * listener, and the processor can inject the gateway as its snapshot sink,
 * without circular Nest module imports.
 */
@Module({
  providers: [
    {
      provide: BINANCE_FEED_CONFIG,
      useFactory: () => readBinanceFeedConfig(),
    },
    {
      provide: WEBSOCKET_FACTORY,
      useValue: ((url: string) => new WebSocket(url) as FeedWebSocket) satisfies WebSocketFactory,
    },
    {
      provide: MARKET_PROCESSOR_CONFIG,
      useFactory: () => readMarketProcessorConfig(),
    },
    MarketGateway,
    {
      provide: MARKET_SNAPSHOT_SINK,
      useExisting: MarketGateway,
    },
    MarketProcessor,
    {
      provide: MARKET_FEED_LISTENER,
      useExisting: MarketProcessor,
    },
    BinanceFeedService,
  ],
  exports: [MarketProcessor, BinanceFeedService],
})
export class MarketModule {}
