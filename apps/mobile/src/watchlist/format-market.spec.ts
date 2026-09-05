import {
  changeTone,
  formatChangePercent,
  formatPressure,
  formatPrice,
  formatUpdatedAt,
} from './format-market';

describe('market formatting', () => {
  it('formats missing and large prices', () => {
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice(65000.5)).toBe('65,000.50');
    expect(formatPrice(0.123456)).toBe('0.123456');
  });

  it('formats 24-hour change with a sign', () => {
    expect(formatChangePercent(undefined)).toBe('—');
    expect(formatChangePercent(1.25)).toBe('+1.25%');
    expect(formatChangePercent(-1.25)).toBe('-1.25%');
    expect(formatChangePercent(0)).toBe('0.00%');
    expect(changeTone(1)).toBe('up');
    expect(changeTone(-1)).toBe('down');
    expect(changeTone(0)).toBe('neutral');
  });

  it('formats pressure, null spread, and timestamps', () => {
    expect(formatPressure(null)).toBe('—');
    expect(formatPressure(55.25)).toBe('55.3%');
    expect(formatPrice(null)).toBe('—');
    expect(formatUpdatedAt(undefined)).toBe('—');
    expect(formatUpdatedAt(1_720_802_025_000)).toBe('2024-07-12T16:33:45.000Z');
  });
});
