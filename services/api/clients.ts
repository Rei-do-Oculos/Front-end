import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface Store {
  id: number;
  name: string;
  unity?: string;
}

export interface ClientUncollectedRecord {
  id: number;
  client_id: number;
  store_id: number;
  service_order_id: number | null;
  os_number: number;
  total_price: number;
  amount_due: number;
  amount_paid: number;
  os_status: string;
  reason: string;
  status: 'open' | 'resolved';
  notes: string | null;
  block_pickup_payment: boolean;
  arrived_at: string | null;
  sale_date: string | null;
  created_at: string;
  relationships?: {
    store?: { id: number; name: string; unity?: string };
    reason_label?: string;
    status_label?: string;
    archived_by_user?: { id: number; name: string };
  };
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  document: string;
  /** true quando o cliente foi inativado na tela de inadimplências (não pode usar pagamento na retirada) */
  block_pickup_payment?: boolean;
  observations?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  stores?: Store[];
  relationships?: {
    stores?: Array<Store & { is_origin?: boolean; deleted?: boolean }>;
    original_store?: Store & { deleted?: boolean } | null;
  };
}

export interface CreateClientDto {
  name: string;
  email?: string | null;
  phone: string;
  document: string;
  observations?: string | null;
  stores?: number[];
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface ClientsQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  document?: string;
  phone?: string;
  date_from?: string;
  date_to?: string;
  stores?: number[];
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

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

export interface ClientsListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    clients: LaravelPaginatedResponse<Client>;
  };
}

export interface ClientResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    client: Client;
  };
}

class ClientsService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/clients';
  }

  async getAll(params?: ClientsQueryParams & { page?: number }): Promise<PaginatedResponse<Client>> {
    console.log('[clientsService.getAll] Parâmetros enviados:', params);
    
    const response = await apiClient.get<ClientsListResponse>(this.endpoint, {
      params,
    });
    
    console.log('[clientsService.getAll] Resposta completa:', response.data);
    
    const responseData = response.data;
    
    if (!responseData.success) {
      console.error('[clientsService.getAll] Resposta sem success:', responseData);
      throw new Error(responseData.message || 'Resposta inválida da API');
    }
    
    if (!responseData.data?.clients) {
      console.error('[clientsService.getAll] Resposta sem clients:', responseData);
      // Retornar resposta vazia ao invés de lançar erro
      return {
        data: [],
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        },
      };
    }
    
    const laravelPagination = responseData.data.clients;
    
    console.log('[clientsService.getAll] Laravel pagination:', laravelPagination);
    
    // Converter data para array se for objeto
    let clientsData: Client[] = [];
    if (Array.isArray(laravelPagination.data)) {
      clientsData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      clientsData = Object.values(laravelPagination.data) as Client[];
    }
    
    console.log('[clientsService.getAll] Clientes processados:', {
      count: clientsData.length,
      firstClient: clientsData[0] || null,
    });
    
    return {
      data: clientsData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async getById(id: string): Promise<Client> {
    const { data } = await apiClient.get<ClientResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.client) {
      throw new Error('Cliente não encontrado');
    }
    
    return data.data.client;
  }

  async create(payload: CreateClientDto): Promise<Client> {
    const { data } = await apiClient.post<ClientResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.client) {
      throw new Error('Erro ao criar cliente');
    }
    
    return data.data.client;
  }

  async update(id: string, payload: UpdateClientDto): Promise<Client> {
    const { data } = await apiClient.put<ClientResponse>(`${this.endpoint}/${id}`, payload);
    
    if (!data.success || !data.data?.client) {
      throw new Error('Erro ao atualizar cliente');
    }
    
    return data.data.client;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir cliente');
    }
  }

  async plucks(): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    return data.data.plucks || [];
  }

  async migrateToStore(id: string, storeId: number): Promise<Client> {
    const { data } = await apiClient.post<ClientResponse>(`${this.endpoint}/${id}/migrate`, {
      store_id: storeId,
    });
    
    if (!data.success || !data.data?.client) {
      throw new Error('Erro ao migrar cliente');
    }
    
    return data.data.client;
  }

  /**
   * Get client history with service orders and statistics
   */
  async getHistory(clientId: string, params?: {
    page?: number;
    per_page?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }): Promise<{
    client: Client;
    service_orders: any;
    uncollected_records?: ClientUncollectedRecord[];
    statistics: {
      total_spent: number;
      total_orders: number;
      average_ticket: number;
      last_purchase: string | null;
      is_overdue: boolean;
      overdue_count: number;
      overdue_total: number;
      has_uncollected?: boolean;
      uncollected_count?: number;
      uncollected_total?: number;
    };
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        client: Client;
        service_orders: any;
        statistics: {
          total_spent: number;
          total_orders: number;
          average_ticket: number;
          last_purchase: string | null;
          is_overdue: boolean;
          overdue_count: number;
          overdue_total: number;
          has_uncollected?: boolean;
          uncollected_count?: number;
          uncollected_total?: number;
        };
        uncollected_records?: ClientUncollectedRecord[];
      };
    }>(`${this.endpoint}/${clientId}/history`, { params });

    if (!response.data.success || !response.data.data) {
      throw new Error('Erro ao buscar histórico do cliente');
    }

    return response.data.data;
  }
}

export const clientsService = new ClientsService();
