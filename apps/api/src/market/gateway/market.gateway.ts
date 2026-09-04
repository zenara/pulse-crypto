import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { MarketState } from '@pulse-crypto/contracts';
import type { MarketSnapshotSink } from '../processing/market-processor.tokens';
import { ClientSession, type GatewayClient } from './client-session';
import { MARKET_WS_PATH } from './market-ws.path';

@WebSocketGateway({ path: MARKET_WS_PATH })
export class MarketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, MarketSnapshotSink
{
  private readonly logger = new Logger(MarketGateway.name);
  private readonly clients = new Map<GatewayClient, ClientSession>();
  private latestEncoded: string | undefined;

  handleConnection(client: GatewayClient): void {
    const session = new ClientSession(client, () => {
      this.removeClient(client);
    });
    this.clients.set(client, session);
    client.on('error', (error: unknown) => {
      this.logger.warn(
        `Market client socket error${error instanceof Error ? `: ${error.message}` : ''}`,
      );
      this.removeClient(client);
    });

    session.sendNow(
      JSON.stringify({
        type: 'connection.ready',
        timestamp: Date.now(),
      }),
    );

    if (this.latestEncoded) {
      session.offer(this.latestEncoded);
    }
  }

  handleDisconnect(client: GatewayClient): void {
    this.removeClient(client);
  }

  publish(snapshot: MarketState[]): void {
    this.latestEncoded = JSON.stringify({
      type: 'market.snapshot',
      timestamp: Date.now(),
      data: snapshot,
    });

    for (const session of this.clients.values()) {
      session.offer(this.latestEncoded);
    }
  }

  private removeClient(client: GatewayClient): void {
    const session = this.clients.get(client);
    if (!session) {
      return;
    }

    this.clients.delete(client);
    session.dispose();
  }
}
