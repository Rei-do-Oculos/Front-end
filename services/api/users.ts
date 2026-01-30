import { BaseService, PaginatedResponse, BaseEntity } from './base.service';
import { apiClient } from './client';

export interface Store {
  id: number;
  name: string;
  fancy_name: string;
  color: string;
}

export interface User extends BaseEntity {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  active?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles?: Role[];
  permissions?: Permission[];
  stores?: Store[];
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles?: Array<{ id: number } | number>;
  permissions?: Array<{ id: number } | number>;
  stores?: Array<{ id: number } | number>;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password_confirmation'>> {
  password?: string;
}

export interface UsersQueryParams {
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

export interface UsersListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    users: LaravelPaginatedResponse<User>;
  };
}

class UsersService extends BaseService<User, CreateUserDto, UpdateUserDto, UsersQueryParams> {
  constructor() {
    super({ endpoint: '/v1/users' });
  }

  async getAll(params?: UsersQueryParams & { page?: number }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<UsersListResponse>(this.endpoint, {
      params,
    });
    
    const responseData = response.data;
    
    if (!responseData.success || !responseData.data?.users) {
      console.error('Resposta inválida da API de usuários:', responseData);
      throw new Error('Resposta inválida da API');
    }
    
    const laravelPagination = responseData.data.users;
    
    // Converter data para array se for objeto (pode acontecer após sanitização)
    let usersData: User[] = [];
    if (Array.isArray(laravelPagination.data)) {
      usersData = laravelPagination.data;
    } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
      usersData = Object.values(laravelPagination.data) as User[];
    }
    
    // Garantir que roles, permissions e stores sejam sempre arrays
    usersData = usersData.map((user) => {
      // Normalizar roles
      if (user.roles && !Array.isArray(user.roles)) {
        if (typeof user.roles === 'object' && user.roles !== null) {
          user.roles = Object.values(user.roles);
        } else {
          user.roles = [];
        }
      } else if (!user.roles) {
        user.roles = [];
      }
      
      // Normalizar permissions
      if (user.permissions && !Array.isArray(user.permissions)) {
        if (typeof user.permissions === 'object' && user.permissions !== null) {
          user.permissions = Object.values(user.permissions);
        } else {
          user.permissions = [];
        }
      } else if (!user.permissions) {
        user.permissions = [];
      }
      
      // Normalizar stores
      if ((user as any).stores && !Array.isArray((user as any).stores)) {
        if (typeof (user as any).stores === 'object' && (user as any).stores !== null) {
          (user as any).stores = Object.values((user as any).stores);
        } else {
          (user as any).stores = [];
        }
      } else if (!(user as any).stores) {
        (user as any).stores = [];
      }
      
      return user;
    });
    return {
      data: usersData,
      meta: {
        currentPage: laravelPagination.current_page || 1,
        totalPages: laravelPagination.last_page || 1,
        totalItems: laravelPagination.total || 0,
      },
    };
  }

  async plucks(): Promise<any[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
      const { data } = response;
      if (!data.success || !data.data?.plucks) return [];
      let plucks = data.data.plucks;
      if (!Array.isArray(plucks) && typeof plucks === 'object' && plucks !== null) {
        plucks = Object.values(plucks);
      }
      return Array.isArray(plucks) ? plucks : [];
    } catch {
      return [];
    }
  }

  async create(payload: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post<{ success: boolean; action: string; data: { user: User } }>(
      `${this.endpoint}/create`,
      payload
    );
    
    if (!data.success || !data.data?.user) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.user;
  }

  async update(id: string, payload: UpdateUserDto): Promise<User> {
    const { data } = await apiClient.put<{ success: boolean; action: string; data: { user: User } }>(
      `${this.endpoint}/${id}`,
      payload
    );
    
    if (!data.success || !data.data?.user) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.user;
  }

  async getById(id: string): Promise<User> {
    const { data } = await apiClient.get<{ success: boolean; action: string; data: { user: User } }>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.user) {
      throw new Error('Usuário não encontrado');
    }

    const user = data.data.user;
    
    // Garantir que roles, permissions e stores sejam sempre arrays
    if (user.roles && !Array.isArray(user.roles)) {
      if (typeof user.roles === 'object' && user.roles !== null) {
        user.roles = Object.values(user.roles);
      } else {
        user.roles = [];
      }
    } else if (!user.roles) {
      user.roles = [];
    }
    
    if (user.permissions && !Array.isArray(user.permissions)) {
      if (typeof user.permissions === 'object' && user.permissions !== null) {
        user.permissions = Object.values(user.permissions);
      } else {
        user.permissions = [];
      }
    } else if (!user.permissions) {
      user.permissions = [];
    }
    
    // Normalizar stores se existir
    if ((user as any).stores && !Array.isArray((user as any).stores)) {
      if (typeof (user as any).stores === 'object' && (user as any).stores !== null) {
        (user as any).stores = Object.values((user as any).stores);
      } else {
        (user as any).stores = [];
      }
    } else if (!(user as any).stores) {
      (user as any).stores = [];
    }
    
    return user;
  }
}

export const usersService = new UsersService();
