import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { reconnectDelayMs } from '@pulse-crypto/shared';
import {
  type BinanceFeedConfig,
  buildBinanceCombinedStreamUrl,
} from './binance-feed.config';
import {
  BINANCE_FEED_CONFIG,
  MARKET_FEED_LISTENER,
  WEBSOCKET_FACTORY,
  type FeedWebSocket,
  type MarketFeedListener,
  type WebSocketFactory,
} from './binance-feed.tokens';
import { parseBinanceMessage } from './binance-message.parser';

@Injectable()
export class BinanceFeedService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceFeedService.name);
  private socket: FeedWebSocket | undefined;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private attempt = 0;
  private stopped = true;

  constructor(
    @Inject(BINANCE_FEED_CONFIG) private readonly config: BinanceFeedConfig,
    @Inject(WEBSOCKET_FACTORY) private readonly createSocket: WebSocketFactory,
    @Inject(MARKET_FEED_LISTENER) private readonly listener: MarketFeedListener,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.log('Binance feed disabled');
      return;
    }
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(): void {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    this.attempt = 0;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearReconnectTimer();
    this.detachSocket();
  }

  private connect(): void {
    if (this.stopped) {
      return;
    }

    this.detachSocket();
    const url = buildBinanceCombinedStreamUrl(this.config);
    this.logger.log('Connecting to Binance market stream');

    let socket: FeedWebSocket;
    try {
      socket = this.createSocket(url);
    } catch (error) {
      this.logger.error(
        'Failed to create Binance WebSocket',
        error instanceof Error ? error.stack : undefined,
      );
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;

    socket.on('open', () => {
      if (this.socket !== socket) {
        return;
      }
      this.attempt = 0;
      this.logger.log('Binance connected');
    });

    socket.on('message', (data) => {
      if (this.socket !== socket) {
        return;
      }
      this.handleMessage(data);
    });

    socket.on('error', (error) => {
      if (this.socket !== socket) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Binance socket error: ${message}`);
    });

    socket.on('close', () => {
      if (this.socket !== socket) {
        return;
      }
      this.socket = undefined;
      if (this.stopped) {
        return;
      }
      this.logger.warn('Binance disconnected');
      this.scheduleReconnect();
    });
  }

  private handleMessage(data: unknown): void {
    const raw = toText(data);
    if (raw === undefined) {
      return;
    }

    const parsed = parseBinanceMessage(raw);
    if (parsed.kind === 'ticker') {
      this.listener.onTicker(parsed.update);
      return;
    }
    if (parsed.kind === 'orderBook') {
      this.listener.onOrderBook(parsed.update);
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) {
      return;
    }

    this.attempt += 1;
    const delayMs = reconnectDelayMs(this.attempt);
    this.logger.log(`Binance reconnecting in ${delayMs}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delayMs);
  }

  private detachSocket(): void {
    const socket = this.socket;
    this.socket = undefined;
    if (!socket) {
      return;
    }
    try {
      socket.close();
    } catch {
      // Ignore close races during shutdown or reconnect.
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }
}

function toText(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString('utf8');
  }
  return undefined;
}
