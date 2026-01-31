import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface LaboratoryLens {
  id: number;
  laboratory_id: number;
  name: string;
  description: string | null;
  cost_price: number;
  sale_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  laboratory?: {
    id: number;
    name: string;
  };
}

export interface CreateLaboratoryLensDto {
  laboratory_id: number;
  name: string;
  description?: string;
  cost_price: number;
  sale_price: number;
  active?: boolean;
}

export interface UpdateLaboratoryLensDto extends Partial<CreateLaboratoryLensDto> {}

export interface LaboratoryLensesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  laboratory_id?: number;
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

export interface LaboratoryLensesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    laboratory_lenses: LaravelPaginatedResponse<LaboratoryLens>;
  };
}

export interface LaboratoryLensResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    laboratory_lens: LaboratoryLens;
  };
}

class LaboratoryLensesService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/laboratory-lenses';
  }

  async getAll(params?: LaboratoryLensesQueryParams & { page?: number }): Promise<PaginatedResponse<LaboratoryLens>> {
    const response = await apiClient.get<LaboratoryLensesListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.laboratory_lenses) {
      console.error('Resposta inválida da API de lentes de laboratório:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.laboratory_lenses;
    
    // Converter data para array se for objeto
    let lensesData: LaboratoryLens[] = [];
    if (Array.isArray(laravelPagination.data)) {
      lensesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      lensesData = Object.values(laravelPagination.data) as LaboratoryLens[];
    }
    
    return {
      data: lensesData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async getById(id: string): Promise<LaboratoryLens> {
    const { data } = await apiClient.get<LaboratoryLensResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.laboratory_lens) {
      throw new Error('Lente de laboratório não encontrada');
    }
    
    return data.data.laboratory_lens;
  }

  async create(payload: CreateLaboratoryLensDto): Promise<LaboratoryLens> {
    const { data } = await apiClient.post<LaboratoryLensResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.laboratory_lens) {
      throw new Error('Erro ao criar lente de laboratório');
    }
    
    return data.data.laboratory_lens;
  }

  async update(id: string, payload: UpdateLaboratoryLensDto): Promise<LaboratoryLens> {
    const { data } = await apiClient.put<LaboratoryLensResponse>(`${this.endpoint}/${id}`, payload);
    
    if (!data.success || !data.data?.laboratory_lens) {
      throw new Error('Erro ao atualizar lente de laboratório');
    }
    
    return data.data.laboratory_lens;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir lente de laboratório');
    }
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

export const laboratoryLensesService = new LaboratoryLensesService();
