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
  delivery_days: number | null;
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
  delivery_days?: number;
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
    const response = await apiClient.get<LaboratoriesListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.laboratories) {
      console.error('Resposta inválida da API de laboratórios:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.laboratories;
    
    // Converter data para array se for objeto
    let laboratoriesData: Laboratory[] = [];
    if (Array.isArray(laravelPagination.data)) {
      laboratoriesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      laboratoriesData = Object.values(laravelPagination.data) as Laboratory[];
    }
    
    return {
      data: laboratoriesData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
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
}

export const laboratoriesService = new LaboratoriesService();
