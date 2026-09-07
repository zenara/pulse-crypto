import { useEffect, useRef, useState } from 'react';

export function useTickFlash(
  value: number | undefined,
): 'up' | 'down' | undefined {
  const previous = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | undefined>();

  useEffect(() => {
    const prior = previous.current;
    previous.current = value;
    if (
      prior === undefined ||
      value === undefined ||
      !Number.isFinite(prior) ||
      !Number.isFinite(value) ||
      prior === value
    ) {
      return;
    }

    const next = value > prior ? 'up' : 'down';
    setFlash((current) => (current === next ? current : next));
    const timer = setTimeout(() => {
      setFlash((current) => (current === undefined ? current : undefined));
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);

  return flash;
}
