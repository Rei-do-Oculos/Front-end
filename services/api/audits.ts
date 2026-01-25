import { PaginatedResponse } from './base.service';
import { apiClient } from './client';

export interface Audit {
  id: number;
  user_type: string;
  user_id: number;
  event: string;
  auditable_type: string;
  auditable_id: number;
  old_values: string;
  new_values: string;
  url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  auditable?: any;
  store_name?: string | null;
}

export interface AuditsQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  event?: string | string[];
  auditable_type?: string | string[];
  user_id?: string | string[];
  store_id?: string | string[];
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

export interface AuditsListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    audits: LaravelPaginatedResponse<Audit>;
  };
}

class AuditsService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/audits';
  }

  async getAll(params?: AuditsQueryParams & { page?: number }): Promise<PaginatedResponse<Audit>> {
    const response = await apiClient.get<AuditsListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.audits) {
      console.error('Resposta inválida da API de auditorias:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.audits;
    
    // Converter data para array se for objeto (pode acontecer após sanitização)
    let auditsData: Audit[] = [];
    if (Array.isArray(laravelPagination.data)) {
      auditsData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      // Se for um objeto com índices numéricos, converter para array
      auditsData = Object.values(laravelPagination.data) as Audit[];
    }
    
    return {
      data: auditsData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async plucks(): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    return data.data.plucks || [];
  }
}

export const auditsService = new AuditsService();
