import { useState, useEffect } from 'react';

interface ServiceWithPlucks {
  plucks(): Promise<Array<{ id: number | string; name: string }>>;
}

interface UsePlucksOptions {
  service: ServiceWithPlucks;
  autoFetch?: boolean;
}

export const usePlucks = <T extends { id: number | string; name: string }>(
  options: UsePlucksOptions
) => {
  const { service, autoFetch = true } = options;
  const [plucks, setPlucks] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlucks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.plucks();
      const formattedData = Array.isArray(data) ? (data as T[]) : [];
      setPlucks(formattedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar plucks');
      setError(error);
      setPlucks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPlucks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    plucks,
    loading,
    error,
    fetchPlucks,
    reset: () => {
      setPlucks([]);
      setError(null);
    },
  };
};
