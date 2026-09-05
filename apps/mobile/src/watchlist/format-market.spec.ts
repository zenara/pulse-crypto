import { changeTone, formatChangePercent, formatPrice } from './format-market';

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
});
