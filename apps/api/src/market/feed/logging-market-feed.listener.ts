import { Injectable, Logger } from '@nestjs/common';
import type { MarketFeedListener } from './binance-feed.tokens';

@Injectable()
export class LoggingMarketFeedListener implements MarketFeedListener {
  private readonly logger = new Logger(LoggingMarketFeedListener.name);
  private tickers = 0;
  private books = 0;

  onTicker(): void {
    this.tickers += 1;
    if (this.tickers === 1) {
      this.logger.log('Received first normalized ticker update');
    }
  }

  onOrderBook(): void {
    this.books += 1;
    if (this.books === 1) {
      this.logger.log('Received first normalized order-book update');
    }
  }
}
