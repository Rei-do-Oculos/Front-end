import { useApi } from './useApi';
import { ordersService, CreateOrderDto, UpdateOrderDto, OrdersQueryParams } from '../api/orders';
import { Order } from '../../types';

interface UseOrdersOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: OrdersQueryParams;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Order, CreateOrderDto, UpdateOrderDto, OrdersQueryParams>({
    service: ordersService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    orders: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchOrders: api.fetch,
    getOrder: api.getById,
    createOrder: api.create,
    updateOrder: api.update,
    deleteOrder: api.delete,
    reset: api.reset,
  };
};
