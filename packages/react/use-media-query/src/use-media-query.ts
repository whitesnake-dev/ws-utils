import { useEffect, useState } from 'react';

/**
 * A hook that returns a boolean value indicating whether the given media query matches the current viewport.
 *
 * @param query - The media query string to match.
 * @returns - The result indicating whether the media query matches.
 */
export const useMediaQuery = (query: string): boolean => {
  const [value, setValue] = useState<boolean>(false);

  useEffect(() => {
    const onChange = (event: MediaQueryListEvent) => {
      setValue(event.matches);
    };

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
};
