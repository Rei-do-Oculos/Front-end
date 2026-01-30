import { apiClient } from './client';

export interface TrashItem {
  id: number;
  model: string;
  model_label: string;
  name: string;
  deleted_at: string;
  data: any;
}

export interface TrashQueryParams {
  model?: string;
  search?: string;
  page?: number;
  per_page?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface TrashListResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    items: TrashItem[];
    pagination?: {
      currentPage: number;
      perPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

export interface RestoreRequest {
  model: string;
  id: number;
}

class TrashService {
  private endpoint = '/v1/trash';

  async list(params: TrashQueryParams = {}): Promise<TrashListResponse> {
    const { data } = await apiClient.get<TrashListResponse>(this.endpoint, { params });
    return data;
  }

  async restore(model: string, id: number): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/restore`, { model, id });
    return data;
  }
}

export const trashService = new TrashService();
