import { useApi } from './useApi';
import { clientsService, CreateClientDto, UpdateClientDto, ClientsQueryParams, Client } from '../api/clients';

interface UseClientsOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: ClientsQueryParams;
}

export const useClients = (options: UseClientsOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Client, CreateClientDto, UpdateClientDto, ClientsQueryParams>({
    service: clientsService,
    autoFetch,
    initialPage,
    initialParams,
  });

  const migrateToStore = async (id: string, storeId: number) => {
    return await clientsService.migrateToStore(id, storeId);
  };

  return {
    clients: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchClients: api.fetch,
    getClient: api.getById,
    createClient: api.create,
    updateClient: api.update,
    deleteClient: api.delete,
    migrateToStore,
    reset: api.reset,
  };
};
