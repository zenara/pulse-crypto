import { Injectable } from '@nestjs/common';
import type { MarketSnapshotSink } from './market-processor.tokens';

@Injectable()
export class NoopMarketSnapshotSink implements MarketSnapshotSink {
  publish(): void {
    // Phase 5 replaces this with the WebSocket gateway.
  }
}
