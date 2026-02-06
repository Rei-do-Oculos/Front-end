import { apiClient } from './client';
import { validateId } from '../../utils/security';

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  totalSales?: number;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
}

export interface BaseServiceConfig {
  endpoint: string;
}

export class BaseService<T extends BaseEntity, CreateDto, UpdateDto, QueryParams = {}> {
  protected endpoint: string;

  constructor(config: BaseServiceConfig) {
    if (!config.endpoint || typeof config.endpoint !== 'string') {
      throw new Error('Endpoint deve ser uma string válida');
    }
    
    if (!config.endpoint.startsWith('/')) {
      throw new Error('Endpoint deve começar com /');
    }
    
    this.endpoint = config.endpoint;
  }

  async getAll(params?: QueryParams & { page?: number }): Promise<PaginatedResponse<T>> {
    const { data } = await apiClient.get<PaginatedResponse<T>>(this.endpoint, {
      params,
    });
    return data;
  }

  async getById(id: string): Promise<T> {
    if (!validateId(id)) {
      throw new Error('ID inválido');
    }
    
    const { data } = await apiClient.get<T>(`${this.endpoint}/${id}`);
    return data;
  }

  async create(payload: CreateDto): Promise<T> {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload inválido');
    }
    
    const { data } = await apiClient.post<T>(this.endpoint, payload);
    return data;
  }

  async update(id: string, payload: UpdateDto): Promise<T> {
    if (!validateId(id)) {
      throw new Error('ID inválido');
    }
    
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload inválido');
    }
    
    const { data } = await apiClient.put<T>(`${this.endpoint}/${id}`, payload);
    return data;
  }

  async delete(id: string): Promise<void> {
    if (!validateId(id)) {
      throw new Error('ID inválido');
    }
    
    await apiClient.delete(`${this.endpoint}/${id}`);
  }
}
