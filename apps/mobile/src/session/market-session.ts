import {
  MarketWebSocketService,
  type MarketSocketFactory,
} from '../networking/market-websocket.service';
import { apiErrorMessage } from '../networking/api-error';
import { fetchPairsMeta } from '../networking/pairs-meta-api';
import { useFavoritesStore } from '../state/favorites-store';
import { useMarketStore } from '../state/market-store';

export interface MarketSessionOptions {
  apiUrl: string | undefined;
  wsUrl: string | undefined;
  fetchPairs?: typeof fetchPairsMeta;
  createSocket?: MarketSocketFactory;
  hydrateFavorites?: () => Promise<void>;
}

/**
 * Owns REST metadata refresh and the market WebSocket.
 * Screens subscribe to Zustand; they must not create sockets.
 */
export class MarketSession {
  private readonly apiUrl: string | undefined;
  private readonly wsUrl: string | undefined;
  private readonly fetchPairs: typeof fetchPairsMeta;
  private readonly createSocket: MarketSocketFactory | undefined;
  private readonly hydrateFavorites: () => Promise<void>;
  private socket: MarketWebSocketService | undefined;
  private stopped = true;
  private metaRequest = 0;

  constructor(options: MarketSessionOptions) {
    this.apiUrl = options.apiUrl;
    this.wsUrl = options.wsUrl;
    this.fetchPairs = options.fetchPairs ?? fetchPairsMeta;
    this.createSocket = options.createSocket;
    this.hydrateFavorites =
      options.hydrateFavorites ??
      (() => useFavoritesStore.getState().hydrate());
  }

  start(): void {
    if (!this.stopped) {
      return;
    }

    this.stopped = false;
    void this.hydrateFavorites();
    void this.refreshMeta();
    this.startSocket();
  }

  stop(): void {
    this.stopped = true;
    this.socket?.stop();
    this.socket = undefined;
  }

  async refreshMeta(): Promise<void> {
    if (!this.apiUrl) {
      return;
    }

    const request = ++this.metaRequest;
    try {
      const pairs = await this.fetchPairs(this.apiUrl);
      if (this.stopped || request !== this.metaRequest) {
        return;
      }
      useMarketStore.getState().setPairs(pairs);
    } catch (error: unknown) {
      if (this.stopped || request !== this.metaRequest) {
        return;
      }
      useMarketStore.getState().setMetaError(apiErrorMessage(error));
    }
  }

  private startSocket(): void {
    if (!this.wsUrl) {
      useMarketStore.getState().setConnectionStatus('error');
      return;
    }

    const service = new MarketWebSocketService({
      url: this.wsUrl,
      createSocket: this.createSocket,
      listener: {
        onStatus: (status) => {
          useMarketStore.getState().setConnectionStatus(status);
        },
        onSnapshot: (states) => {
          useMarketStore.getState().applySnapshot(states);
        },
        onProtocolError: (_code, message) => {
          useMarketStore.getState().setProtocolError(message);
        },
      },
    });
    this.socket = service;
    service.start();
  }
}
