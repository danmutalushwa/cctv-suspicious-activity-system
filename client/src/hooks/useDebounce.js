import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useDebouncedCallback = (callback, delay = 500) => {
  const [timeoutId, setTimeoutId] = useState(null);

  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => callback(...args), delay);
    setTimeoutId(id);
  };
};