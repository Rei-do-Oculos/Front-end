import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface Lens {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateLensDto {
  name: string;
  slug?: string; // Opcional, será gerado pelo backend
}

export interface UpdateLensDto extends Partial<CreateLensDto> {}

export interface LensesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
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

export interface LensesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    lenses: LaravelPaginatedResponse<Lens>;
  };
}

export interface LensResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    lens: Lens;
  };
}

class LensesService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/lenses';
  }

  async getAll(params?: LensesQueryParams & { page?: number }): Promise<PaginatedResponse<Lens>> {
    const response = await apiClient.get<LensesListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.lenses) {
      console.error('Resposta inválida da API de lentes:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.lenses;
    
    // Converter data para array se for objeto
    let lensesData: Lens[] = [];
    if (Array.isArray(laravelPagination.data)) {
      lensesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      lensesData = Object.values(laravelPagination.data) as Lens[];
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

  async getById(id: string): Promise<Lens> {
    const { data } = await apiClient.get<LensResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.lens) {
      throw new Error('Lente não encontrada');
    }
    
    return data.data.lens;
  }

  async create(payload: CreateLensDto): Promise<Lens> {
    const { data } = await apiClient.post<LensResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.lens) {
      throw new Error('Erro ao criar lente');
    }
    
    return data.data.lens;
  }

  async update(id: string, payload: UpdateLensDto): Promise<Lens> {
    // Remover slug se estiver vazio ou undefined, pois será gerado pelo Observer se necessário
    const cleanPayload: any = {};
    if (payload.name !== undefined) {
      cleanPayload.name = payload.name;
    }
    if (payload.slug && payload.slug.trim()) {
      cleanPayload.slug = payload.slug;
    }
    
    const { data } = await apiClient.put<LensResponse>(`${this.endpoint}/${id}`, cleanPayload);
    
    if (!data.success || !data.data?.lens) {
      throw new Error('Erro ao atualizar lente');
    }
    
    return data.data.lens;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir lente');
    }
  }

  async plucks(): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    return data.data.plucks || [];
  }
}

export const lensesService = new LensesService();
