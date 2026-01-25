import { useApi } from './useApi';
import { auditsService, AuditsQueryParams } from '../api/audits';
import { Audit } from '../api/audits';

interface UseAuditsOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: AuditsQueryParams;
}

export const useAudits = (options: UseAuditsOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Audit, never, never, AuditsQueryParams>({
    service: auditsService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    audits: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchAudits: api.fetch,
    getAudit: api.getById,
    reset: api.reset,
  };
};
