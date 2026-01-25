import { BaseService } from './base.service';
import { Order } from '../../types';

export interface CreateOrderDto {
  clientId: string;
  osNumber: string;
  optician: string;
  price: number;
  registeredBy: string;
  hasWarranty: boolean;
  farRx?: {
    od: { sph: string; cyl: string; axis: string };
    oe: { sph: string; cyl: string; axis: string };
  };
  nearRx?: {
    od: { sph: string; cyl: string; axis: string };
    oe: { sph: string; cyl: string; axis: string };
  };
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {}

export interface OrdersQueryParams {
  page?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

class OrdersService extends BaseService<Order, CreateOrderDto, UpdateOrderDto, OrdersQueryParams> {
  constructor() {
    super({ endpoint: '/orders' });
  }
}

export const ordersService = new OrdersService();
