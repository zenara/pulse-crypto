import {
  boundOrderBookLevels,
  calculateBookPressure,
  calculateSpread,
} from './order-book.js';

describe('boundOrderBookLevels', () => {
  it('sorts bids descending and asks ascending, then limits depth', () => {
    const bids = boundOrderBookLevels(
      [
        { price: 99, quantity: 1 },
        { price: 101, quantity: 2 },
        { price: 100, quantity: 3 },
      ],
      'bid',
      2,
    );
    const asks = boundOrderBookLevels(
      [
        { price: 103, quantity: 1 },
        { price: 102, quantity: 2 },
        { price: 104, quantity: 3 },
      ],
      'ask',
      2,
    );

    expect(bids).toEqual([
      { price: 101, quantity: 2 },
      { price: 100, quantity: 3 },
    ]);
    expect(asks).toEqual([
      { price: 102, quantity: 2 },
      { price: 103, quantity: 1 },
    ]);
  });

  it('drops invalid and zero-quantity levels', () => {
    expect(
      boundOrderBookLevels(
        [
          { price: 1, quantity: 0 },
          { price: 0, quantity: 1 },
          { price: Number.NaN, quantity: 1 },
          { price: 2, quantity: 4 },
        ],
        'bid',
        10,
      ),
    ).toEqual([{ price: 2, quantity: 4 }]);
  });
});

describe('calculateSpread', () => {
  it('uses best ask minus best bid', () => {
    expect(
      calculateSpread(
        [{ price: 100, quantity: 1 }],
        [{ price: 101.5, quantity: 1 }],
      ),
    ).toBe(1.5);
  });

  it('returns null when a side is missing', () => {
    expect(calculateSpread([{ price: 100, quantity: 1 }], [])).toBeNull();
    expect(calculateSpread([], [{ price: 101, quantity: 1 }])).toBeNull();
  });
});

describe('calculateBookPressure', () => {
  it('splits volume into buy and sell percents that sum to 100', () => {
    const pressure = calculateBookPressure(
      [
        { price: 1, quantity: 1 },
        { price: 0.9, quantity: 1 },
      ],
      [{ price: 1.1, quantity: 6 }],
    );

    expect(pressure).not.toBeNull();
    expect(pressure?.buyPressure).toBeCloseTo(25);
    expect(pressure?.sellPressure).toBeCloseTo(75);
    expect((pressure?.buyPressure ?? 0) + (pressure?.sellPressure ?? 0)).toBe(100);
  });

  it('returns null when total volume is zero', () => {
    expect(calculateBookPressure([], [])).toBeNull();
  });
});
