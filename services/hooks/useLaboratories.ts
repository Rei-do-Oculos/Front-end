import { useCallback } from 'react';
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

  // Método especial para deletar com verificação de lentes
  const deleteLaboratoryWithCheck = async (id: string, confirmDeleteLenses: boolean = false) => {
    return laboratoriesService.delete(id, confirmDeleteLenses);
  };

  // Método para buscar histórico de OS finalizadas do laboratório
  const getHistory = useCallback(async (laboratoryId: number, params?: {
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }) => {
    return laboratoriesService.getHistory(laboratoryId, params);
  }, []);

  return {
    laboratories: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchLaboratories: api.fetch,
    getLaboratory: api.getById,
    createLaboratory: api.create,
    updateLaboratory: api.update,
    deleteLaboratory: deleteLaboratoryWithCheck,
    getHistory,
    reset: api.reset,
  };
};
