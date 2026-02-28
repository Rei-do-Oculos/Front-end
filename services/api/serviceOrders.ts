import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

// Status types
export type ServiceOrderStatus = 'pending' | 'sent_to_lab' | 'ready_for_pickup' | 'completed' | 'overdue';

export interface ServiceOrder {
  id: number;
  os_number: number;
  client_id: number;
  store_id: number;
  user_id: number;
  laboratory_id: number | null;
  expected_pickup_date: string | null;
  // Longe - OD
  far_od_spherical: string | null;
  far_od_cylindrical: string | null;
  far_od_axis: string | null;
  // Longe - OE
  far_oe_spherical: string | null;
  far_oe_cylindrical: string | null;
  far_oe_axis: string | null;
  // Perto - OD
  near_od_spherical: string | null;
  near_od_cylindrical: string | null;
  near_od_axis: string | null;
  // Perto - OE
  near_oe_spherical: string | null;
  near_oe_cylindrical: string | null;
  near_oe_axis: string | null;
  // Adição e DNP
  addition: string | null;
  far_dnp: string | null;
  near_dnp: string | null;
  // Armação
  frame_code: string | null;
  rim_use: number | null;
  warranty: number | null;
  // Tipos de lente
  single_vision: boolean;
  bifocal: boolean;
  multifocal: boolean;
  anti_reflective: boolean;
  transitions: boolean;
  frame_included: boolean;
  tinting: boolean;
  // Valores
  price: number;
  payment_method: 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'on_pickup' | null;
  installments: number | null;
  file_path: string | null;
  notes: string | null;
  verified: boolean;
  // Status
  status: ServiceOrderStatus;
  sent_to_lab_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  overdue_days: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relationships
  client?: {
    id: number;
    name: string;
    document?: string;
  };
  store?: {
    id: number;
    name: string;
    unity?: string;
  };
  user?: {
    id: number;
    name: string;
  };
  laboratory?: {
    id: number;
    name: string;
  };
  laboratory_lenses?: Array<{
    id: number;
    name: string;
    delivery_days?: number | null;
    cost_price: number;
    sale_price: number;
    cost_price_at_sale?: number | null;
    sale_price_at_sale?: number | null;
    promotion_applied?: boolean;
  }>;
  frames?: Array<{
    id: number;
    description: string;
    code: string;
  }>;
  lenses?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  payments?: Array<{
    id: number;
    payment_method: 'credit_card' | 'debit_card' | 'cash' | 'pix';
    amount: number;
    installments: number | null;
  }>;
  // Status computed
  status_label?: string;
  status_color?: string;
  expected_arrival?: string | null;
  is_overdue?: boolean;
  // NF-e
  invoice_id?: number | null;
  invoice?: {
    id: number;
    invoice_number: string;
    series: string;
    status: string;
    access_key?: string | null;
  } | null;
}

export interface CreateServiceOrderDto {
  client_id: number;
  store_id: number;
  user_id: number;
  laboratory_id?: number | null;
  expected_pickup_date?: string | null;
  // Longe - OD
  far_od_spherical?: string | null;
  far_od_cylindrical?: string | null;
  far_od_axis?: string | null;
  // Longe - OE
  far_oe_spherical?: string | null;
  far_oe_cylindrical?: string | null;
  far_oe_axis?: string | null;
  // Perto - OD
  near_od_spherical?: string | null;
  near_od_cylindrical?: string | null;
  near_od_axis?: string | null;
  // Perto - OE
  near_oe_spherical?: string | null;
  near_oe_cylindrical?: string | null;
  near_oe_axis?: string | null;
  // Adição e DNP
  addition?: string | null;
  far_dnp?: string | null;
  near_dnp?: string | null;
  // Armação
  frame_code?: string | null;
  rim_use?: number | null;
  warranty?: number | null;
  // Tipos de lente
  single_vision?: boolean;
  bifocal?: boolean;
  multifocal?: boolean;
  anti_reflective?: boolean;
  transitions?: boolean;
  frame_included?: boolean;
  tinting?: boolean;
  // Valores
  price?: number;
  payment_method?: 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'on_pickup' | null;
  installments?: number | null;
  file_path?: string | null;
  notes?: string | null;
  verified?: boolean;
  // Relationships (many-to-many)
  laboratory_lenses?: number[];
  frames?: number[];
  lenses?: number[];
  // Pagamentos parciais/mistos
  payments?: Array<{
    payment_method: 'credit_card' | 'debit_card' | 'cash' | 'pix';
    amount: number;
    installments?: number | null;
  }>;
}

export interface UpdateServiceOrderDto extends Partial<CreateServiceOrderDto> {}

export interface ServiceOrdersQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  os_number?: number;
  client_id?: number;
  store_id?: number | number[];
  user_id?: number;
  laboratory_id?: number;
  verified?: boolean;
  status?: ServiceOrderStatus | ServiceOrderStatus[];
  has_laboratory?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface LaravelPaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ServiceOrdersListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    service_orders: LaravelPaginatedResponse<ServiceOrder>;
    total_sales?: number;
  };
}

export interface ServiceOrderResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    service_order: ServiceOrder;
  };
}

class ServiceOrdersService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/service-orders';
  }

  async getAll(params?: ServiceOrdersQueryParams & { page?: number }): Promise<PaginatedResponse<ServiceOrder>> {
    const response = await apiClient.get<ServiceOrdersListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.service_orders) {
      console.error('Resposta inválida da API de ordens de serviço:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.service_orders;
    
    let ordersData: ServiceOrder[] = [];
    if (Array.isArray(laravelPagination.data)) {
      ordersData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      ordersData = Object.values(laravelPagination.data) as ServiceOrder[];
    }
    
    return {
      data: ordersData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
      totalSales: responseData.data?.total_sales ?? 0,
    };
  }

  async getById(id: string): Promise<ServiceOrder> {
    const { data } = await apiClient.get<ServiceOrderResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.service_order) {
      throw new Error('Ordem de serviço não encontrada');
    }
    
    return data.data.service_order;
  }

  async create(payload: CreateServiceOrderDto): Promise<ServiceOrder> {
    const { data } = await apiClient.post<ServiceOrderResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.service_order) {
      throw new Error('Erro ao criar ordem de serviço');
    }
    
    return data.data.service_order;
  }

  async update(id: string, payload: UpdateServiceOrderDto): Promise<ServiceOrder> {
    const { data } = await apiClient.put<ServiceOrderResponse>(`${this.endpoint}/${id}`, payload);
    
    if (!data.success || !data.data?.service_order) {
      throw new Error('Erro ao atualizar ordem de serviço');
    }
    
    return data.data.service_order;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir ordem de serviço');
    }
  }

  async plucks(params?: { client_id?: number }): Promise<any[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`, {
        params: params ?? {},
      });
      let plucks = data.data?.plucks || [];
      if (!Array.isArray(plucks) && typeof plucks === 'object') {
        plucks = Object.values(plucks);
      }
      return plucks;
    } catch {
      return [];
    }
  }

  // ==========================================
  // MÉTODOS DE LABORATÓRIO
  // ==========================================

  /**
   * Listar ordens de serviço do laboratório (com laboratório vinculado)
   */
  async getLabOrders(params?: ServiceOrdersQueryParams & { page?: number }): Promise<PaginatedResponse<ServiceOrder>> {
    const response = await apiClient.get<ServiceOrdersListResponse>(`${this.endpoint}/lab`, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.service_orders) {
      console.error('Resposta inválida da API de ordens de serviço:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.service_orders;
    
    let ordersData: ServiceOrder[] = [];
    if (Array.isArray(laravelPagination.data)) {
      ordersData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      ordersData = Object.values(laravelPagination.data) as ServiceOrder[];
    }
    
    return {
      data: ordersData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
      totalSales: responseData.data?.total_sales ?? 0,
    };
  }

  /**
   * Listar ordens de serviço inadimplentes (overdue)
   */
  async getOverdueOrders(params?: ServiceOrdersQueryParams & { page?: number }): Promise<PaginatedResponse<ServiceOrder>> {
    const response = await apiClient.get<ServiceOrdersListResponse>(`${this.endpoint}/overdue`, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.service_orders) {
      console.error('Resposta inválida da API de ordens de serviço:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.service_orders;
    
    let ordersData: ServiceOrder[] = [];
    if (Array.isArray(laravelPagination.data)) {
      ordersData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      ordersData = Object.values(laravelPagination.data) as ServiceOrder[];
    }
    
    return {
      data: ordersData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
      totalSales: responseData.data?.total_sales ?? 0,
    };
  }

  /**
   * Marcar OS como enviada para o laboratório
   */
  async sendToLab(id: string): Promise<{ success: boolean; message: string; service_order: ServiceOrder }> {
    const { data } = await apiClient.post<{
      success: boolean;
      action: string;
      data: {
        message: string;
        service_order: ServiceOrder;
      };
    }>(`${this.endpoint}/${id}/send-to-lab`);
    
    return {
      success: data.success,
      message: data.data?.message || '',
      service_order: data.data?.service_order,
    };
  }

  /**
   * Marcar OS como produto chegou na ótica
   */
  async markArrived(id: string): Promise<{ success: boolean; message: string; service_order: ServiceOrder }> {
    const { data } = await apiClient.post<{
      success: boolean;
      action: string;
      data: {
        message: string;
        service_order: ServiceOrder;
      };
    }>(`${this.endpoint}/${id}/arrived`);
    
    return {
      success: data.success,
      message: data.data?.message || '',
      service_order: data.data?.service_order,
    };
  }

  /**
   * Marcar OS como retirada pelo cliente (finalizada)
   */
  async markCompleted(id: string): Promise<{ success: boolean; message: string; service_order: ServiceOrder }> {
    const { data } = await apiClient.post<{
      success: boolean;
      action: string;
      data: {
        message: string;
        service_order: ServiceOrder;
      };
    }>(`${this.endpoint}/${id}/completed`);
    
    return {
      success: data.success,
      message: data.data?.message || '',
      service_order: data.data?.service_order,
    };
  }

  /**
   * Reverter envio para laboratório (voltar para pendente)
   */
  async revertSendToLab(id: string): Promise<{ success: boolean; message: string; service_order: ServiceOrder }> {
    const { data } = await apiClient.post<{
      success: boolean;
      action: string;
      data: {
        message: string;
        service_order: ServiceOrder;
      };
    }>(`${this.endpoint}/${id}/revert-send-to-lab`);
    
    return {
      success: data.success,
      message: data.data?.message || '',
      service_order: data.data?.service_order,
    };
  }

  /**
   * Reverter chegada (voltar para enviado ao lab)
   */
  async revertArrived(id: string): Promise<{ success: boolean; message: string; service_order: ServiceOrder }> {
    const { data } = await apiClient.post<{
      success: boolean;
      action: string;
      data: {
        message: string;
        service_order: ServiceOrder;
      };
    }>(`${this.endpoint}/${id}/revert-arrived`);
    
    return {
      success: data.success,
      message: data.data?.message || '',
      service_order: data.data?.service_order,
    };
  }

}

export const serviceOrdersService = new ServiceOrdersService();
