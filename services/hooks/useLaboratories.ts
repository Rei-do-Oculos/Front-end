import { useApi } from './useApi';
import { laboratoriesService, CreateLaboratoryDto, UpdateLaboratoryDto, LaboratoriesQueryParams, Laboratory } from '../api/laboratories';

interface UseLaboratoriesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: LaboratoriesQueryParams;
}

export const useLaboratories = (options: UseLaboratoriesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Laboratory, CreateLaboratoryDto, UpdateLaboratoryDto, LaboratoriesQueryParams>({
    service: laboratoriesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    laboratories: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchLaboratories: api.fetch,
    getLaboratory: api.getById,
    createLaboratory: api.create,
    updateLaboratory: api.update,
    deleteLaboratory: api.delete,
    reset: api.reset,
  };
};
