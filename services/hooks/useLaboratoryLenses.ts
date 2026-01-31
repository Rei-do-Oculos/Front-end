import { useApi } from './useApi';
import { laboratoryLensesService, CreateLaboratoryLensDto, UpdateLaboratoryLensDto, LaboratoryLensesQueryParams, LaboratoryLens } from '../api/laboratoryLenses';

interface UseLaboratoryLensesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: LaboratoryLensesQueryParams;
}

export const useLaboratoryLenses = (options: UseLaboratoryLensesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<LaboratoryLens, CreateLaboratoryLensDto, UpdateLaboratoryLensDto, LaboratoryLensesQueryParams>({
    service: laboratoryLensesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    laboratoryLenses: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchLaboratoryLenses: api.fetch,
    getLaboratoryLens: api.getById,
    createLaboratoryLens: api.create,
    updateLaboratoryLens: api.update,
    deleteLaboratoryLens: api.delete,
    reset: api.reset,
  };
};
