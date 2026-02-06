import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface FrameTypeRef {
  id: number;
  name: string;
  slug: string;
}

export interface StoreRef {
  id: number;
  name: string;
  unity?: string | null;
  fancy_name?: string;
}

export interface Frame {
  id: number;
  description: string;
  code: string;
  frame_type_id: number;
  gender: 'masculino' | 'feminino' | 'unissex';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /** Relação eager-loaded na listagem (pode vir como frameType ou frame_type) */
  frameType?: FrameTypeRef | null;
  frame_type?: FrameTypeRef | null;
  /** Loja atual (último store_frame); pode vir como latestStoreFrame ou latest_store_frame */
  latestStoreFrame?: { 
    toStore?: StoreRef | null;
    cost_price?: number | null;
    sale_price?: number | null;
  } | null;
  latest_store_frame?: { 
    to_store?: StoreRef | null;
    cost_price?: number | null;
    sale_price?: number | null;
  } | null;
  relationships?: {
    frame_type?: FrameTypeRef | null;
  };
}

export interface CreateFrameDto {
  description: string;
  code: string;
  frame_type_id: number;
  gender: 'masculino' | 'feminino' | 'unissex';
  /** Loja onde a armação está (obrigatório no cadastro) */
  store_id?: number;
  /** Preços por loja */
  cost_price?: number;
  sale_price?: number;
}

export interface UpdateFrameDto extends Partial<CreateFrameDto> {}

export interface FramesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  description?: string;
  code?: string;
  frame_type_id?: number | number[];
  gender?: 'masculino' | 'feminino' | 'unissex' | ('masculino' | 'feminino' | 'unissex')[];
  store_id?: number | number[];
  date_from?: string;
  date_to?: string;
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

export interface FramesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    frames: LaravelPaginatedResponse<Frame>;
  };
}

export interface FrameResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    frame: Frame;
  };
}

class FramesService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/frames';
  }

  async getAll(params?: FramesQueryParams & { page?: number }): Promise<PaginatedResponse<Frame>> {
    const response = await apiClient.get<FramesListResponse>(this.endpoint, {
      params,
      timeout: 60000, // 60 segundos para listagem de armações (pode ter muitos dados)
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.frames) {
      console.error('Resposta inválida da API de armações:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.frames;
    
    // Converter data para array se for objeto
    let framesData: Frame[] = [];
    if (Array.isArray(laravelPagination.data)) {
      framesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      framesData = Object.values(laravelPagination.data) as Frame[];
    }
    
    return {
      data: framesData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async getById(id: string): Promise<Frame> {
    const { data } = await apiClient.get<FrameResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.frame) {
      throw new Error('Armação não encontrada');
    }
    
    return data.data.frame;
  }

  async create(payload: CreateFrameDto): Promise<Frame> {
    const { data } = await apiClient.post<FrameResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.frame) {
      throw new Error('Erro ao criar armação');
    }
    
    return data.data.frame;
  }

  async update(id: string, payload: UpdateFrameDto): Promise<Frame> {
    const { data } = await apiClient.put<FrameResponse>(`${this.endpoint}/${id}`, payload);
    
    if (!data.success || !data.data?.frame) {
      throw new Error('Erro ao atualizar armação');
    }
    
    return data.data.frame;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir armação');
    }
  }

  async plucks(): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    return data.data.plucks || [];
  }
}

export const framesService = new FramesService();
