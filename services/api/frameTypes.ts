import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface FrameType {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateFrameTypeDto {
  name: string;
  slug?: string;
  store_id?: number;
}

export interface UpdateFrameTypeDto extends Partial<CreateFrameTypeDto> {}

export interface FrameTypesQueryParams {
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

export interface FrameTypesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    frameTypes: LaravelPaginatedResponse<FrameType>;
  };
}

export interface FrameTypeResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    frameType: FrameType;
  };
}

class FrameTypesService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/frame-types';
  }

  async getAll(params?: FrameTypesQueryParams & { page?: number }): Promise<PaginatedResponse<FrameType>> {
    const response = await apiClient.get<FrameTypesListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.frameTypes) {
      console.error('Resposta inválida da API de tipos de armação:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.frameTypes;
    
    // Converter data para array se for objeto
    let frameTypesData: FrameType[] = [];
    if (Array.isArray(laravelPagination.data)) {
      frameTypesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      frameTypesData = Object.values(laravelPagination.data) as FrameType[];
    }
    
    return {
      data: frameTypesData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async getById(id: string): Promise<FrameType> {
    const { data } = await apiClient.get<FrameTypeResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.frameType) {
      throw new Error('Tipo de armação não encontrado');
    }
    
    return data.data.frameType;
  }

  async create(payload: CreateFrameTypeDto): Promise<FrameType> {
    const { data } = await apiClient.post<FrameTypeResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.frameType) {
      throw new Error('Erro ao criar tipo de armação');
    }
    
    return data.data.frameType;
  }

  async update(id: string, payload: UpdateFrameTypeDto): Promise<FrameType> {
    // Remover slug se estiver vazio ou undefined, pois será gerado pelo Observer se necessário
    const cleanPayload: any = {};
    if (payload.name !== undefined) {
      cleanPayload.name = payload.name;
    }
    if (payload.slug && payload.slug.trim()) {
      cleanPayload.slug = payload.slug;
    }
    
    const { data } = await apiClient.put<FrameTypeResponse>(`${this.endpoint}/${id}`, cleanPayload);
    
    if (!data.success || !data.data?.frameType) {
      throw new Error('Erro ao atualizar tipo de armação');
    }
    
    return data.data.frameType;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir tipo de armação');
    }
  }

  async plucks(): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    return data.data.plucks || [];
  }
}

export const frameTypesService = new FrameTypesService();
