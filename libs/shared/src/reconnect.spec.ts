import { reconnectDelayMs } from './reconnect.js';

describe('reconnectDelayMs', () => {
  it('follows 1s, 2s, 4s, 8s, 16s, then caps at 30s', () => {
    expect(reconnectDelayMs(1)).toBe(1_000);
    expect(reconnectDelayMs(2)).toBe(2_000);
    expect(reconnectDelayMs(3)).toBe(4_000);
    expect(reconnectDelayMs(4)).toBe(8_000);
    expect(reconnectDelayMs(5)).toBe(16_000);
    expect(reconnectDelayMs(6)).toBe(30_000);
    expect(reconnectDelayMs(12)).toBe(30_000);
  });

  it('treats invalid attempts as the first delay', () => {
    expect(reconnectDelayMs(0)).toBe(1_000);
    expect(reconnectDelayMs(-3)).toBe(1_000);
  });
});
