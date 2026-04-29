import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type Primitive = string | number | boolean | null | undefined;
type UrlState = Record<string, Primitive | string[]>;

interface SetUrlStateOptions {
  replace?: boolean;
}

export const useListUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getString = useCallback(
    (key: string, fallback = '') => {
      return searchParams.get(key) ?? fallback;
    },
    [searchParams],
  );

  const getNumber = useCallback(
    (key: string, fallback: number) => {
      const value = searchParams.get(key);
      if (!value) return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    [searchParams],
  );

  const setUrlState = useCallback(
    (nextState: UrlState, options?: SetUrlStateOptions) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(nextState).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const cleaned = value.filter(Boolean);
          if (cleaned.length === 0) {
            nextParams.delete(key);
          } else {
            nextParams.set(key, cleaned.join(','));
          }
          return;
        }

        if (value === '' || value === null || value === undefined) {
          nextParams.delete(key);
          return;
        }

        nextParams.set(key, String(value));
      });

      setSearchParams(nextParams, { replace: options?.replace ?? true });
    },
    [searchParams, setSearchParams],
  );

  const clearKeys = useCallback(
    (keys: string[], options?: SetUrlStateOptions) => {
      const nextParams = new URLSearchParams(searchParams);
      keys.forEach((key) => nextParams.delete(key));
      setSearchParams(nextParams, { replace: options?.replace ?? true });
    },
    [searchParams, setSearchParams],
  );

  return {
    searchParams,
    getString,
    getNumber,
    setUrlState,
    clearKeys,
  };
};
