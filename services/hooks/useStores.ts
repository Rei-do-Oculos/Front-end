import { useApi } from './useApi';
import { storesService, CreateStoreDto, UpdateStoreDto, StoresQueryParams } from '../api/stores';
import { Store } from '../api/stores';

interface UseStoresOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: StoresQueryParams;
}

export const useStores = (options: UseStoresOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Store, CreateStoreDto, UpdateStoreDto, StoresQueryParams>({
    service: storesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    stores: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchStores: api.fetch,
    getStore: api.getById,
    createStore: api.create,
    updateStore: api.update,
    deleteStore: api.delete,
    reset: api.reset,
  };
};
