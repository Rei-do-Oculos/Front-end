import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface StoreRef {
  id: number;
  name: string;
  unity?: string | null;
  fancy_name?: string;
}

export interface FrameRef {
  id: number;
  description: string;
  code: string;
}

export interface StoreFrame {
  id: number;
  frame_id: number;
  from_store_id: number | null;
  to_store_id: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /** Relações eager-loaded */
  frame?: FrameRef | null;
  fromStore?: StoreRef | null;
  toStore?: StoreRef | null;
  relationships?: {
    frame?: FrameRef | null;
    from_store?: StoreRef | null;
    to_store?: StoreRef | null;
  };
}

export interface CreateStoreFrameDto {
  frame_id: number;
  from_store_id?: number | null;
  to_store_id: number;
  notes?: string | null;
}

export interface UpdateStoreFrameDto extends Partial<CreateStoreFrameDto> {}

export interface StoreFramesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  frame_id?: number;
  from_store_id?: number;
  to_store_id?: number;
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

export interface StoreFramesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    storeFrames: LaravelPaginatedResponse<StoreFrame>;
  };
}

export interface StoreFrameResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    storeFrame: StoreFrame;
  };
}

class StoreFramesService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/store-frames';
  }

  async getAll(params?: StoreFramesQueryParams & { page?: number }): Promise<PaginatedResponse<StoreFrame>> {
    const response = await apiClient.get<StoreFramesListResponse>(this.endpoint, {
      params,
      timeout: 60000, // 60 segundos para listagem de transferências (pode ter muitos dados)
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.storeFrames) {
      console.error('Resposta inválida da API de transferências:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.storeFrames;
    
    // Converter data para array se for objeto
    let storeFramesData: StoreFrame[] = [];
    if (Array.isArray(laravelPagination.data)) {
      storeFramesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      storeFramesData = Object.values(laravelPagination.data) as StoreFrame[];
    }
    
    // Log para debug - verificar se os relacionamentos estão vindo
    if (storeFramesData.length > 0) {
      const firstItem = storeFramesData[0];
      console.log('[StoreFramesService.getAll] Primeiro item recebido:', {
        id: firstItem.id,
        frame_id: firstItem.frame_id,
        from_store_id: firstItem.from_store_id,
        to_store_id: firstItem.to_store_id,
        hasFromStore: !!firstItem.fromStore,
        hasToStore: !!firstItem.toStore,
        hasRelationships: !!firstItem.relationships,
        fromStore: firstItem.fromStore,
        toStore: firstItem.toStore,
        relationships: firstItem.relationships,
        fullItem: firstItem,
      });
    }
    
    return {
      data: storeFramesData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async getById(id: string): Promise<StoreFrame> {
    const { data } = await apiClient.get<StoreFrameResponse>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.storeFrame) {
      throw new Error('Transferência não encontrada');
    }
    
    return data.data.storeFrame;
  }

  async create(payload: CreateStoreFrameDto): Promise<StoreFrame> {
    const { data } = await apiClient.post<StoreFrameResponse>(`${this.endpoint}/create`, payload);
    
    if (!data.success || !data.data?.storeFrame) {
      throw new Error('Erro ao criar transferência');
    }
    
    return data.data.storeFrame;
  }

  async update(id: string, payload: UpdateStoreFrameDto): Promise<StoreFrame> {
    const { data } = await apiClient.put<StoreFrameResponse>(`${this.endpoint}/${id}`, payload);
    
    if (!data.success || !data.data?.storeFrame) {
      throw new Error('Erro ao atualizar transferência');
    }
    
    return data.data.storeFrame;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    
    if (!data.success) {
      throw new Error('Erro ao excluir transferência');
    }
  }

  async plucks(): Promise<any[]> {
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    return data.data.plucks || [];
  }
}

export const storeFramesService = new StoreFramesService();
