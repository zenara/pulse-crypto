import type { ConnectionStatus } from '@pulse-crypto/contracts';

const LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  error: 'Error',
};

export function connectionStatusLabel(status: ConnectionStatus): string {
  return LABELS[status];
}
