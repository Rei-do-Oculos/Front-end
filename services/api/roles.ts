import { BaseService, PaginatedResponse, BaseEntity } from './base.service';
import { apiClient } from './client';

export interface Role extends BaseEntity {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  guard_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRoleDto {
  name: string;
  guard_name?: string;
  permissions?: Array<{ id: number } | number>;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export interface RolesQueryParams {
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

export interface RolesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    roles: LaravelPaginatedResponse<Role>;
  };
}

class RolesService extends BaseService<Role, CreateRoleDto, UpdateRoleDto, RolesQueryParams> {
  constructor() {
    super({ endpoint: '/v1/roles' });
  }

  async getAll(params?: RolesQueryParams & { page?: number }): Promise<PaginatedResponse<Role>> {
    const response = await apiClient.get<RolesListResponse>(this.endpoint, {
      params,
    });
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.roles) {
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.roles;
    
    // Converter data para array se for objeto
    let rolesData: Role[] = [];
    if (Array.isArray(laravelPagination.data)) {
      rolesData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      rolesData = Object.values(laravelPagination.data) as Role[];
    }
    
    // Garantir que permissions seja sempre um array
    rolesData = rolesData.map((role) => {
      if (role.permissions && !Array.isArray(role.permissions)) {
        // Se permissions não for array, converter
        if (typeof role.permissions === 'object' && role.permissions !== null) {
          role.permissions = Object.values(role.permissions);
        } else {
          role.permissions = [];
        }
      } else if (!role.permissions) {
        role.permissions = [];
      }
      return role;
    });
    
    // Log para debug - verificar se permissões estão vindo
    console.log('[rolesService.getAll] Roles recebidos:', rolesData.length);
    rolesData.forEach((role, index) => {
      console.log(`[rolesService.getAll] Role ${index + 1}:`, {
        id: role.id,
        name: role.name,
        permissionsCount: Array.isArray(role.permissions) ? role.permissions.length : 0,
        permissions: Array.isArray(role.permissions) ? role.permissions.slice(0, 3).map(p => p.name) : [],
      });
    });
    
    return {
      data: rolesData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async plucks(): Promise<any[]> {
    console.log('[rolesService.plucks] Fazendo requisição para:', `${this.endpoint}/plucks`);
    const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
    console.log('[rolesService.plucks] Resposta completa da API:', data);
    console.log('[rolesService.plucks] data.data.plucks:', data.data?.plucks);
    
    let plucks = data.data?.plucks || [];
    
    // Converter objeto para array se necessário (quando PHP retorna objeto associativo)
    if (!Array.isArray(plucks) && typeof plucks === 'object' && plucks !== null) {
      console.log('[rolesService.plucks] Convertendo objeto para array');
      plucks = Object.values(plucks);
    }
    
    console.log('[rolesService.plucks] Plucks retornados:', plucks, 'Count:', plucks.length, 'É array?', Array.isArray(plucks));
    return plucks;
  }

  async create(payload: CreateRoleDto): Promise<Role> {
    const { data } = await apiClient.post<{ success: boolean; action: string; data: { role: Role } }>(
      `${this.endpoint}/create`,
      payload
    );
    
    if (!data.success || !data.data?.role) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.role;
  }

  async update(id: string, payload: UpdateRoleDto): Promise<Role> {
    const { data } = await apiClient.put<{ success: boolean; action: string; data: { role: Role } }>(
      `${this.endpoint}/${id}`,
      payload
    );
    
    if (!data.success || !data.data?.role) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.role;
  }

  async getById(id: string): Promise<Role> {
    const { data } = await apiClient.get<{ success: boolean; action: string; data: { role: Role } }>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.role) {
      throw new Error('Role não encontrada');
    }

    const role = data.data.role;
    
    // Garantir que permissions seja sempre um array
    if (role.permissions && !Array.isArray(role.permissions)) {
      if (typeof role.permissions === 'object' && role.permissions !== null) {
        role.permissions = Object.values(role.permissions);
      } else {
        role.permissions = [];
      }
    } else if (!role.permissions) {
      role.permissions = [];
    }
    
    return role;
  }

  async syncPermissions(id: string, permissionIds: number[]): Promise<Role> {
    const { data } = await apiClient.post<{ success: boolean; action: string; data: { role: Role } }>(
      `${this.endpoint}/${id}/permissions/sync`,
      { permissions: permissionIds }
    );
    
    if (!data.success || !data.data?.role) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.role;
  }
}

export const rolesService = new RolesService();
