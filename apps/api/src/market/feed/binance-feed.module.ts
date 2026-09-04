import { Module } from '@nestjs/common';
import { WebSocket } from 'ws';
import { BinanceFeedService } from './binance-feed.service';
import { readBinanceFeedConfig } from './binance-feed.config';
import {
  BINANCE_FEED_CONFIG,
  MARKET_FEED_LISTENER,
  WEBSOCKET_FACTORY,
  type FeedWebSocket,
  type WebSocketFactory,
} from './binance-feed.tokens';
import { LoggingMarketFeedListener } from './logging-market-feed.listener';

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
      provide: MARKET_FEED_LISTENER,
      useClass: LoggingMarketFeedListener,
    },
    BinanceFeedService,
  ],
  exports: [BinanceFeedService],
})
export class BinanceFeedModule {}
