const SOCKET_OPEN = 1;

export interface GatewayClient {
  readyState: number;
  send(data: string, callback?: (error?: Error) => void): void;
  on(event: 'close' | 'error', listener: (...args: unknown[]) => void): void;
}

/**
 * At most one in-flight send and one pending payload per client.
 * A newer snapshot overwrites the pending slot instead of queueing.
 */
export class ClientSession {
  private pending: string | undefined;
  private sending = false;
  private closed = false;

  constructor(
    private readonly socket: GatewayClient,
    private readonly onDead: () => void = () => undefined,
  ) {}

  sendNow(payload: string): void {
    if (this.closed || this.socket.readyState !== SOCKET_OPEN) {
      return;
    }

    if (this.sending) {
      this.pending = payload;
      return;
    }

    this.sending = true;
    this.dispatch(payload);
  }

  offer(payload: string): void {
    if (this.closed) {
      return;
    }

    this.pending = payload;
    this.flush();
  }

  dispose(): void {
    this.closed = true;
    this.pending = undefined;
  }

  private flush(): void {
    if (this.closed || this.sending || this.pending === undefined) {
      return;
    }

    if (this.socket.readyState !== SOCKET_OPEN) {
      this.fail();
      return;
    }

    const payload = this.pending;
    this.pending = undefined;
    this.sending = true;
    this.dispatch(payload);
  }

  private dispatch(payload: string): void {
    try {
      this.socket.send(payload, (error) => {
        this.sending = false;
        if (this.closed) {
          return;
        }
        if (error) {
          this.fail();
          return;
        }
        this.flush();
      });
    } catch {
      this.sending = false;
      this.fail();
    }
  }

  private fail(): void {
    if (this.closed) {
      return;
    }

    this.dispose();
    this.onDead();
  }
}
