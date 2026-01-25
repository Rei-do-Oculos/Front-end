import { useApi } from './useApi';
import { lensesService, CreateLensDto, UpdateLensDto, LensesQueryParams, Lens } from '../api/lenses';

interface UseLensesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: LensesQueryParams;
}

export const useLenses = (options: UseLensesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Lens, CreateLensDto, UpdateLensDto, LensesQueryParams>({
    service: lensesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    lenses: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchLenses: api.fetch,
    getLens: api.getById,
    createLens: api.create,
    updateLens: api.update,
    deleteLens: api.delete,
    reset: api.reset,
  };
};
