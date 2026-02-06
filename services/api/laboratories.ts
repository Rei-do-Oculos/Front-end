import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface Laboratory {
  id: number;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_name: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateLaboratoryDto {
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_name?: string;
  notes?: string;
  active?: boolean;
}

export interface UpdateLaboratoryDto extends Partial<CreateLaboratoryDto> {}

export interface LaboratoriesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  active?: boolean;
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

export interface LaboratoriesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    laboratories: LaravelPaginatedResponse<Laboratory>;
  };
}

export interface LaboratoryResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    laboratory: Laboratory;
  };
}

class LaboratoriesService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/laboratories';
  }

  async getAll(params?: LaboratoriesQueryParams & { page?: number }): Promise<PaginatedResponse<Laboratory>> {
    console.log('[LaboratoriesService] 🔍 getAll chamado', {
      endpoint: this.endpoint,
      params,
    });
    
    try {
      console.log('[LaboratoriesService] Fazendo requisição para:', this.endpoint);
      const response = await apiClient.get<LaboratoriesListResponse>(this.endpoint, {
        params,
      });
      
      console.log('[LaboratoriesService] ✅ Resposta recebida:', {
        status: response.status,
        hasData: !!response.data,
        responseData: response.data,
        fullResponse: JSON.stringify(response.data, null, 2),
      });
      
      const responseData = response.data;
      
      if (!responseData.success || !responseData.data?.laboratories) {
        console.error('[LaboratoriesService] ❌ Resposta inválida da API:', {
          success: responseData.success,
          hasData: !!responseData.data,
          hasLaboratories: !!responseData.data?.laboratories,
          responseData,
        });
        throw new Error('Resposta inválida da API');
      }
      
      const laravelPagination = responseData.data.laboratories;
      console.log('[LaboratoriesService] Paginação Laravel:', {
        current_page: laravelPagination.current_page,
        last_page: laravelPagination.last_page,
        total: laravelPagination.total,
        dataType: typeof laravelPagination.data,
        isArray: Array.isArray(laravelPagination.data),
        dataLength: Array.isArray(laravelPagination.data) ? laravelPagination.data.length : 'N/A',
        dataKeys: typeof laravelPagination.data === 'object' && laravelPagination.data ? Object.keys(laravelPagination.data) : [],
        dataValue: laravelPagination.data,
      });
      
      // Converter data para array se for objeto
      let laboratoriesData: Laboratory[] = [];
      if (Array.isArray(laravelPagination.data)) {
        laboratoriesData = laravelPagination.data;
        console.log('[LaboratoriesService] data é array, usando diretamente');
      } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
        const values = Object.values(laravelPagination.data);
        console.log('[LaboratoriesService] data é objeto, convertendo com Object.values:', {
          keys: Object.keys(laravelPagination.data),
          valuesLength: values.length,
          values,
        });
        laboratoriesData = values as Laboratory[];
      } else {
        console.log('[LaboratoriesService] data é null/undefined ou tipo inválido, retornando array vazio');
        laboratoriesData = [];
      }
      
      console.log('[LaboratoriesService] ✅ Laboratórios processados:', {
        count: laboratoriesData.length,
        laboratories: laboratoriesData,
      });
      
      return {
        data: laboratoriesData,
        meta: {
          currentPage: laravelPagination.current_page || 1,
          totalPages: laravelPagination.last_page || 1,
          totalItems: laravelPagination.total || 0,
        },
      };
    } catch (error) {
      console.error('[LaboratoriesService] ❌ Erro no getAll:', error);
      console.error('[LaboratoriesService] Detalhes:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error,
      });
      throw error;
    }
  }

  async getById(id: string): Promise<Laboratory> {
    const { data } = await apiClient.get<LaboratoryResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.laboratory) {
      throw new Error('Laboratório não encontrado');
    }
    
    return data.data.laboratory;
  }

  async create(payload: CreateLaboratoryDto): Promise<Laboratory> {
    const { data } = await apiClient.post<LaboratoryResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.laboratory) {
      throw new Error('Erro ao criar laboratório');
    }
    
    return data.data.laboratory;
  }

  async update(id: string, payload: UpdateLaboratoryDto): Promise<Laboratory> {
    const { data } = await apiClient.put<LaboratoryResponse>(`${this.endpoint}/${id}`, payload);
    
    if (!data.success || !data.data?.laboratory) {
      throw new Error('Erro ao atualizar laboratório');
    }
    
    return data.data.laboratory;
  }

  async delete(id: string, confirmDeleteLenses: boolean = false): Promise<{
    success: boolean;
    requires_confirmation?: boolean;
    lenses_count?: number;
    message?: string;
    lenses_deleted?: number;
  }> {
    const { data } = await apiClient.delete<{ 
      success: boolean; 
      action: string; 
      data: {
        requires_confirmation?: boolean;
        lenses_count?: number;
        message?: string;
        lenses_deleted?: number;
        laboratory?: Laboratory;
      } 
    }>(`${this.endpoint}/${id}`, {
      data: { confirm_delete_lenses: confirmDeleteLenses }
    });
    
    if (!data.success) {
      throw new Error('Erro ao excluir laboratório');
    }

    // Se precisa de confirmação
    if (data.action === 'delete_confirmation_required' && data.data?.requires_confirmation) {
      return {
        success: true,
        requires_confirmation: true,
        lenses_count: data.data.lenses_count,
        message: data.data.message,
      };
    }

    return {
      success: true,
      requires_confirmation: false,
      lenses_deleted: data.data?.lenses_deleted || 0,
    };
  }

  async plucks(): Promise<any[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
      let plucks = data.data?.plucks || [];
      if (!Array.isArray(plucks) && typeof plucks === 'object') {
        plucks = Object.values(plucks);
      }
      return plucks;
    } catch {
      return [];
    }
  }

  /**
   * Get history of completed service orders for a laboratory
   */
  async getHistory(laboratoryId: number, params?: {
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        service_orders: {
          current_page: number;
          data: any[];
          last_page: number;
          total: number;
        };
      };
    }>(`${this.endpoint}/${laboratoryId}/history`, { params });

    const responseData = response.data;

    if (!responseData.success || !responseData.data?.service_orders) {
      throw new Error('Resposta inválida da API');
    }

    const pagination = responseData.data.service_orders;

    let ordersData: any[] = [];
    if (Array.isArray(pagination.data)) {
      ordersData = pagination.data;
    } else if (pagination.data && typeof pagination.data === 'object') {
      ordersData = Object.values(pagination.data);
    }

    return {
      data: ordersData,
      meta: {
        currentPage: pagination.current_page || 1,
        totalPages: pagination.last_page || 1,
        totalItems: pagination.total || 0,
      },
    };
  }

  /**
   * Get history report (totals, top lenses) for PDF generation
   */
  async getHistoryReport(laboratoryId: number, params?: {
    date_from?: string;
    date_to?: string;
    laboratory_lens_ids?: number[];
  }): Promise<{
    total_os: number;
    total_cost: number;
    top_lenses: Array<{ id: number; name: string; count: number; total_cost: number }>;
    laboratory: { id: number; name: string };
    date_from: string | null;
    date_to: string | null;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        total_os: number;
        total_cost: number;
        top_lenses: Array<{ id: number; name: string; count: number; total_cost: number }>;
        laboratory: { id: number; name: string };
        date_from: string | null;
        date_to: string | null;
      };
    }>(`${this.endpoint}/${laboratoryId}/history-report`, { params });

    const d = response.data?.data;
    if (!response.data?.success || !d) {
      throw new Error('Erro ao buscar relatório');
    }
    return d;
  }
}

export const laboratoriesService = new LaboratoriesService();
