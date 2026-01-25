import { BaseService, PaginatedResponse, BaseEntity } from './base.service';
import { apiClient } from './client';

export interface Permission extends BaseEntity {
  id: number;
  name: string;
  slug: string;
  guard_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatePermissionDto {
  name: string;
  slug: string;
  guard_name?: string;
  description?: string;
}

export interface UpdatePermissionDto extends Partial<CreatePermissionDto> {}

export interface PermissionsQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
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

export interface PermissionsListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    permissions: LaravelPaginatedResponse<Permission>;
  };
}

class PermissionsService extends BaseService<Permission, CreatePermissionDto, UpdatePermissionDto, PermissionsQueryParams> {
  constructor() {
    super({ endpoint: '/v1/permissions' });
  }

  async getAll(params?: PermissionsQueryParams & { page?: number }): Promise<PaginatedResponse<Permission>> {
    const response = await apiClient.get<PermissionsListResponse>(this.endpoint, {
      params,
    });
    const laravelPagination = response.data.data.permissions;
    return {
      data: laravelPagination.data,
      meta: {
        currentPage: laravelPagination.current_page,
        totalPages: laravelPagination.last_page,
        totalItems: laravelPagination.total,
      },
    };
  }

  async plucks(): Promise<any[]> {
    console.log('[permissionsService.plucks] Fazendo requisição para:', `${this.endpoint}/plucks`);
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    console.log('[permissionsService.plucks] Resposta completa da API:', data);
    console.log('[permissionsService.plucks] data.data.plucks:', data.data?.plucks);
    
    let plucks = data.data?.plucks || [];
    
    // Converter objeto para array se necessário (quando PHP retorna objeto associativo)
    if (!Array.isArray(plucks) && typeof plucks === 'object' && plucks !== null) {
      console.log('[permissionsService.plucks] Convertendo objeto para array');
      plucks = Object.values(plucks);
    }
    
    console.log('[permissionsService.plucks] Plucks retornados:', plucks, 'Count:', plucks.length, 'É array?', Array.isArray(plucks));
    return plucks;
  }

  async create(payload: CreatePermissionDto): Promise<Permission> {
    const { data } = await apiClient.post<{ success: boolean; action: string; data: { permission: Permission } }>(
      `${this.endpoint}/create`,
      payload
    );
    
    if (!data.success || !data.data?.permission) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.permission;
  }

  async update(id: string, payload: UpdatePermissionDto): Promise<Permission> {
    const { data } = await apiClient.put<{ success: boolean; action: string; data: { permission: Permission } }>(
      `${this.endpoint}/${id}`,
      payload
    );
    
    if (!data.success || !data.data?.permission) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.permission;
  }

  async getById(id: string): Promise<Permission> {
    const { data } = await apiClient.get<{ success: boolean; action: string; data: { permission: Permission } }>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.permission) {
      throw new Error('Permissão não encontrada');
    }

    return data.data.permission;
  }
}

export const permissionsService = new PermissionsService();
