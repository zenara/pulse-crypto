import { act, renderHook } from '@testing-library/react-native';
import { useTickFlash } from './use-tick-flash';

describe('useTickFlash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('flashes up then clears', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | undefined }) => useTickFlash(value),
      { initialProps: { value: 1 as number | undefined } },
    );

    expect(result.current).toBeUndefined();
    rerender({ value: 2 });
    expect(result.current).toBe('up');

    act(() => {
      jest.advanceTimersByTime(350);
    });
    expect(result.current).toBeUndefined();
  });

  it('does not flash on non-finite values', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number | undefined }) => useTickFlash(value),
      { initialProps: { value: 1 as number | undefined } },
    );

    rerender({ value: Number.NaN });
    expect(result.current).toBeUndefined();
    rerender({ value: Number.NaN });
    expect(result.current).toBeUndefined();
  });
});
