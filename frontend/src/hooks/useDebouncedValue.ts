import { useEffect, useState } from 'react';

// Returns `value` after it has stayed unchanged for `delay` ms. Replaces the
// copy-pasted debounce effects in the list pages' search inputs.
const useDebouncedValue = <T,>(value: T, delay = 500): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebouncedValue;
