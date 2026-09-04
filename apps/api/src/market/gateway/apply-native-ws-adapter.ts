import type { INestApplication, WebSocketAdapter } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';

/**
 * Nest 11 `WsAdapter` is the correct native-ws runtime, but its typings do not
 * match `WebSocketAdapter.bindMessageHandlers`. Cast at the application boundary.
 */
export function applyNativeWsAdapter(app: INestApplication): void {
  app.useWebSocketAdapter(new WsAdapter(app) as unknown as WebSocketAdapter);
}
