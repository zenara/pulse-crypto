import {
  isWebSocketMessage,
  type ConnectionStatus,
  type MarketState,
} from '@pulse-crypto/contracts';
import { reconnectDelayMs } from '@pulse-crypto/shared';

export interface MarketSocket {
  close(): void;
  onopen: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onclose: ((event?: unknown) => void) | null;
}

export type MarketSocketFactory = (url: string) => MarketSocket;

export interface MarketWebSocketListener {
  onStatus(status: ConnectionStatus): void;
  onSnapshot(states: MarketState[]): void;
  onProtocolError(code: string, message: string): void;
}

export interface MarketWebSocketOptions {
  url: string;
  listener: MarketWebSocketListener;
  createSocket?: MarketSocketFactory;
}

/**
 * Owns the mobile ↔ backend WebSocket. Screens must not create sockets.
 * Latest snapshots are forwarded to the listener; this service does not store markets.
 */
export class MarketWebSocketService {
  private readonly url: string;
  private readonly listener: MarketWebSocketListener;
  private readonly createSocket: MarketSocketFactory;
  private socket: MarketSocket | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  private stopped = true;

  constructor(options: MarketWebSocketOptions) {
    this.url = options.url;
    this.listener = options.listener;
    this.createSocket = options.createSocket ?? defaultSocketFactory;
  }

  start(): void {
    if (!this.stopped) {
      return;
    }
    if (!this.url) {
      this.listener.onStatus('error');
      return;
    }

    this.stopped = false;
    this.attempt = 0;
    this.listener.onStatus('connecting');
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearReconnectTimer();
    this.detachSocket();
    this.listener.onStatus('disconnected');
  }

  private connect(): void {
    if (this.stopped) {
      return;
    }

    this.detachSocket();

    let socket: MarketSocket;
    try {
      socket = this.createSocket(this.url);
    } catch {
      this.listener.onStatus('error');
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }
      this.attempt = 0;
      this.listener.onStatus('connected');
    };

    socket.onmessage = (event) => {
      if (this.socket !== socket) {
        return;
      }
      this.handleMessage(event.data);
    };

    socket.onerror = () => {
      // RN typically follows error with close. Reconnect only from close.
    };

    socket.onclose = () => {
      if (this.socket !== socket) {
        return;
      }
      this.socket = undefined;
      if (this.stopped) {
        return;
      }
      this.listener.onStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== 'string') {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    if (!isWebSocketMessage(parsed)) {
      return;
    }

    if (parsed.type === 'market.snapshot') {
      if (!Array.isArray(parsed.data)) {
        return;
      }
      this.listener.onSnapshot(parsed.data);
      return;
    }

    if (parsed.type === 'error') {
      const code = parsed.data?.code;
      const message = parsed.data?.message;
      if (typeof code === 'string' && typeof message === 'string') {
        this.listener.onProtocolError(code, message);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) {
      return;
    }

    this.attempt += 1;
    this.listener.onStatus('reconnecting');
    const delayMs = reconnectDelayMs(this.attempt);
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

function defaultSocketFactory(url: string): MarketSocket {
  return new WebSocket(url) as MarketSocket;
}
