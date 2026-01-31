import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { serviceOrdersService, CreateServiceOrderDto, UpdateServiceOrderDto, ServiceOrdersQueryParams, ServiceOrder } from '../api/serviceOrders';

interface UseServiceOrdersOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: ServiceOrdersQueryParams;
}

export const useServiceOrders = (options: UseServiceOrdersOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;
  const [actionLoading, setActionLoading] = useState(false);

  const api = useApi<ServiceOrder, CreateServiceOrderDto, UpdateServiceOrderDto, ServiceOrdersQueryParams>({
    service: serviceOrdersService,
    autoFetch,
    initialPage,
    initialParams,
  });

  // Buscar OS do laboratório
  const fetchLabOrders = useCallback(async (params?: ServiceOrdersQueryParams & { page?: number }) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.getLabOrders(params);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Buscar OS inadimplentes
  const fetchOverdueOrders = useCallback(async (params?: ServiceOrdersQueryParams & { page?: number }) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.getOverdueOrders(params);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Enviar para laboratório
  const sendToLab = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.sendToLab(id);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Marcar como chegou
  const markArrived = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.markArrived(id);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Marcar como retirado/finalizado
  const markCompleted = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.markCompleted(id);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    serviceOrders: api.data,
    loading: api.loading,
    actionLoading,
    error: api.error,
    pagination: api.pagination,
    fetchServiceOrders: api.fetch,
    getServiceOrder: api.getById,
    createServiceOrder: api.create,
    updateServiceOrder: api.update,
    deleteServiceOrder: api.delete,
    reset: api.reset,
    // Lab actions
    fetchLabOrders,
    sendToLab,
    markArrived,
    markCompleted,
    // Overdue actions
    fetchOverdueOrders,
  };
};
