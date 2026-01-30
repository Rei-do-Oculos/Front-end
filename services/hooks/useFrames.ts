import { useApi } from './useApi';
import { framesService, CreateFrameDto, UpdateFrameDto, FramesQueryParams, Frame } from '../api/frames';

interface UseFramesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: FramesQueryParams;
}

export const useFrames = (options: UseFramesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Frame, CreateFrameDto, UpdateFrameDto, FramesQueryParams>({
    service: framesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    frames: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchFrames: api.fetch,
    getFrame: api.getById,
    createFrame: api.create,
    updateFrame: api.update,
    deleteFrame: api.delete,
    reset: api.reset,
  };
};
