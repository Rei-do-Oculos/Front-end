import { useApi } from './useApi';
import { storeFramesService, CreateStoreFrameDto, UpdateStoreFrameDto, StoreFramesQueryParams, StoreFrame } from '../api/storeFrames';

interface UseStoreFramesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: StoreFramesQueryParams;
}

export const useStoreFrames = (options: UseStoreFramesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<StoreFrame, CreateStoreFrameDto, UpdateStoreFrameDto, StoreFramesQueryParams>({
    service: storeFramesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    storeFrames: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchStoreFrames: api.fetch,
    getStoreFrame: api.getById,
    createStoreFrame: api.create,
    updateStoreFrame: api.update,
    deleteStoreFrame: api.delete,
    reset: api.reset,
  };
};
