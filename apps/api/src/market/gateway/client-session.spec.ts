import { ClientSession, type GatewayClient } from './client-session';

class FakeClient implements GatewayClient {
  readyState = 1;
  readonly sent: string[] = [];
  hold = false;
  private readonly sendCallbacks: Array<(error?: Error) => void> = [];
  private readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  send(data: string, callback?: (error?: Error) => void): void {
    this.sent.push(data);
    if (this.hold) {
      if (callback) {
        this.sendCallbacks.push(callback);
      }
      return;
    }
    callback?.();
  }

  release(error?: Error): void {
    const callbacks = this.sendCallbacks.splice(0);
    for (const callback of callbacks) {
      callback(error);
    }
  }

  on(event: 'close' | 'error', listener: (...args: unknown[]) => void): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

describe('ClientSession', () => {
  it('sends immediately when the socket is open', () => {
    const client = new FakeClient();
    const session = new ClientSession(client);

    session.sendNow('one');

    expect(client.sent).toEqual(['one']);
  });

  it('keeps only the latest pending payload while a send is in flight', () => {
    const client = new FakeClient();
    client.hold = true;
    const session = new ClientSession(client);

    session.offer('s1');
    session.offer('s2');
    session.offer('s3');

    expect(client.sent).toEqual(['s1']);
    client.release();
    expect(client.sent).toEqual(['s1', 's3']);
  });

  it('does not enqueue after dispose', () => {
    const client = new FakeClient();
    const session = new ClientSession(client);

    session.dispose();
    session.offer('later');

    expect(client.sent).toEqual([]);
  });

  it('notifies onDead when send reports an error', () => {
    const client = new FakeClient();
    client.hold = true;
    const onDead = jest.fn();
    const session = new ClientSession(client, onDead);

    session.offer('s1');
    client.release(new Error('write failed'));

    expect(onDead).toHaveBeenCalledTimes(1);
    session.offer('s2');
    expect(client.sent).toEqual(['s1']);
  });
});
