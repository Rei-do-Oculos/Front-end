import { useApi } from './useApi';
import { frameTypesService, CreateFrameTypeDto, UpdateFrameTypeDto, FrameTypesQueryParams, FrameType } from '../api/frameTypes';

interface UseFrameTypesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: FrameTypesQueryParams;
}

export const useFrameTypes = (options: UseFrameTypesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<FrameType, CreateFrameTypeDto, UpdateFrameTypeDto, FrameTypesQueryParams>({
    service: frameTypesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    frameTypes: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchFrameTypes: api.fetch,
    getFrameType: api.getById,
    createFrameType: api.create,
    updateFrameType: api.update,
    deleteFrameType: api.delete,
    reset: api.reset,
  };
};
