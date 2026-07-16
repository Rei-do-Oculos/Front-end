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

  const setOverdueInactive = useCallback(async (id: string, overdueInactive: boolean) => {
    setActionLoading(true);
    try {
      return await serviceOrdersService.setOverdueInactive(id, overdueInactive);
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

  // Atualizar pagamento e finalizar em um único passo (tela change-payment)
  const completeWithPayment = useCallback(async (
    id: string,
    payload: Parameters<typeof serviceOrdersService.completeWithPayment>[1]
  ) => {
    setActionLoading(true);
    try {
      return await serviceOrdersService.completeWithPayment(id, payload);
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Reverter envio para laboratório
  const revertSendToLab = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.revertSendToLab(id);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Reverter chegada
  const revertArrived = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const result = await serviceOrdersService.revertArrived(id);
      return result;
    } finally {
      setActionLoading(false);
    }
  }, []);


  const deleteServiceOrder = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      return await serviceOrdersService.delete(id);
    } finally {
      setActionLoading(false);
    }
  }, []);

  const archiveNotPickedUp = useCallback(
    async (
      id: string,
      options?: {
        uncollected_notes?: string;
        block_pickup_payment?: boolean;
      }
    ) => {
      setActionLoading(true);
      try {
        return await serviceOrdersService.archiveNotPickedUp(id, options);
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const revertNotPickedUp = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      return await serviceOrdersService.revertNotPickedUp(id);
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    serviceOrders: api.data,
    loading: api.loading,
    totalSales: api.totalSales ?? 0,
    actionLoading,
    error: api.error,
    pagination: api.pagination,
    fetchServiceOrders: api.fetch,
    getServiceOrder: api.getById,
    createServiceOrder: api.create,
    updateServiceOrder: api.update,
    deleteServiceOrder,
    archiveNotPickedUp,
    revertNotPickedUp,
    reset: api.reset,
    // Lab actions
    fetchLabOrders,
    sendToLab,
    markArrived,
    markCompleted,
    completeWithPayment,
    // Revert actions
    revertSendToLab,
    revertArrived,
    // Overdue actions
    fetchOverdueOrders,
    setOverdueInactive,
  };
};
