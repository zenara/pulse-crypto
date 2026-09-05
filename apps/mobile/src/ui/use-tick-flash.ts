import { useEffect, useRef, useState } from 'react';

export function useTickFlash(
  value: number | undefined,
): 'up' | 'down' | undefined {
  const previous = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | undefined>();

  useEffect(() => {
    const prior = previous.current;
    previous.current = value;
    if (prior === undefined || value === undefined || prior === value) {
      return;
    }

    setFlash(value > prior ? 'up' : 'down');
    const timer = setTimeout(() => setFlash(undefined), 350);
    return () => clearTimeout(timer);
  }, [value]);

  return flash;
}
