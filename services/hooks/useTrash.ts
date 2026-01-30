import { useState, useEffect, useCallback } from 'react';
import { trashService, TrashItem, TrashQueryParams } from '../api/trash';

interface UseTrashOptions {
  autoFetch?: boolean;
}

interface UseTrashReturn {
  items: TrashItem[];
  loading: boolean;
  error: Error | null;
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  } | null;
  fetchItems: (page?: number, params?: TrashQueryParams) => Promise<void>;
  restoreItem: (model: string, id: number) => Promise<void>;
}

export const useTrash = (options: UseTrashOptions = {}): UseTrashReturn => {
  const { autoFetch = false } = options;
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);

  const fetchItems = useCallback(async (page = 1, params: TrashQueryParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await trashService.list({
        ...params,
        page,
      });
      // Backend retorna { success, action, data: { request, items, pagination } }
      // items pode vir como array ou como objeto { 0: {...} } (PHP/Laravel às vezes serializa assim)
      const inner = response?.data?.data ?? response?.data ?? response;
      if (response?.success && inner) {
        let itemsArray: TrashItem[] = [];
        if (Array.isArray(inner.items)) {
          itemsArray = inner.items;
        } else if (inner.items && typeof inner.items === 'object') {
          itemsArray = Object.values(inner.items);
        }
        setItems(itemsArray);
        setPagination(inner.pagination ?? null);
      } else {
        setItems([]);
        setPagination(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar lixeira');
      setError(error);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreItem = useCallback(async (model: string, id: number) => {
    setLoading(true);
    setError(null);
    try {
      await trashService.restore(model, id);
      // Refresh the list after restore
      await fetchItems(pagination?.currentPage || 1);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao restaurar item');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchItems, pagination]);

  useEffect(() => {
    if (autoFetch) {
      fetchItems(1);
    }
  }, [autoFetch, fetchItems]);

  return {
    items,
    loading,
    error,
    pagination,
    fetchItems,
    restoreItem,
  };
};
