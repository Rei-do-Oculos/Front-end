import { useState, useEffect, useCallback } from 'react';
import { BaseService, PaginatedResponse, BaseEntity } from '../api/base.service';

interface ServiceWithGetAll<T, QueryParams> {
  getAll(params?: QueryParams & { page?: number }): Promise<PaginatedResponse<T>>;
  getById?(id: string): Promise<T>;
  create?(payload: any): Promise<T>;
  update?(id: string, payload: any): Promise<T>;
  delete?(id: string): Promise<void>;
}

interface UseApiOptions<T, QueryParams> {
  service: ServiceWithGetAll<T, QueryParams>;
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: QueryParams;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T, CreateDto, UpdateDto, QueryParams> {
  data: T[];
  loading: boolean;
  error: Error | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  totalSales?: number;
  fetch: (page?: number, params?: QueryParams) => Promise<void>;
  getById: (id: string) => Promise<T | undefined>;
  create: (payload: CreateDto) => Promise<T>;
  update: (id: string, payload: UpdateDto) => Promise<T>;
  delete: (id: string) => Promise<void>;
  reset: () => void;
}

export const useApi = <
  T extends { id: string | number },
  CreateDto,
  UpdateDto,
  QueryParams = {}
>(
  options: UseApiOptions<T, QueryParams>
): UseApiReturn<T, CreateDto, UpdateDto, QueryParams> => {
  const {
    service,
    autoFetch = false,
    initialPage = 1,
    initialParams = {} as QueryParams,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
  });
  const [totalSales, setTotalSales] = useState<number>(0);

  const fetch = useCallback(
    async (page = 1, params?: QueryParams) => {
      console.log('[useApi] 🔍 fetch chamado', { page, params, serviceName: service.constructor.name });
      setLoading(true);
      setError(null);
      try {
        console.log('[useApi] Chamando service.getAll com:', { page, ...params });
        const response = await service.getAll({ page, ...params } as any);
        console.log('[useApi] ✅ Resposta recebida:', {
          hasData: !!response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'não é array',
          dataType: typeof response.data,
          meta: response.meta,
          response,
        });
        setData(Array.isArray(response.data) ? response.data : []);
        setPagination(response.meta || { currentPage: 1, totalPages: 1, totalItems: 0 });
        setTotalSales(response.totalSales ?? 0);
        onSuccess?.(response.data);
        console.log('[useApi] ✅ Estado atualizado com sucesso');
      } catch (err) {
        console.error('[useApi] ❌ Erro no fetch:', err);
        console.error('[useApi] Detalhes do erro:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          error: err,
        });
        const error = err instanceof Error ? err : new Error('Erro ao carregar dados');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
        console.log('[useApi] Loading finalizado');
      }
    },
    [service, onSuccess, onError]
  );

  const getById = useCallback(
    async (id: string): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const item = await service.getById(id);
        return item;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao carregar item');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [service, onError]
  );

  const create = useCallback(
    async (payload: CreateDto): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const newItem = await service.create(payload);
        setData((prev) => [newItem, ...prev]);
        return newItem;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao criar item');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [service, onError]
  );

  const update = useCallback(
    async (id: string, payload: UpdateDto): Promise<T> => {
      if (!service.update) {
        throw new Error('Método update não disponível neste serviço');
      }
      setLoading(true);
      setError(null);
      try {
        const updatedItem = await service.update(id, payload);
        setData((prev) =>
          prev.map((item) => (String(item.id) === String(id) ? updatedItem : item))
        );
        return updatedItem;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao atualizar item');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [service, onError]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      if (!service.delete) {
        throw new Error('Método delete não disponível neste serviço');
      }
      setLoading(true);
      setError(null);
      try {
        await service.delete(id);
        setData((prev) => prev.filter((item) => String(item.id) !== String(id)));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao excluir item');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [service, onError]
  );

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    });
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetch(initialPage, initialParams);
    }
  }, [autoFetch, initialPage]);

  return {
    data,
    loading,
    error,
    pagination,
    totalSales,
    fetch,
    getById,
    create,
    update,
    delete: deleteItem,
    reset,
  };
};
