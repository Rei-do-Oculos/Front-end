import { apiClient } from './client';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  action: string;
  data: {
    user: User;
  };
}

export interface Store {
  id: number;
  name: string;
  unity?: string | null;
  fancy_name: string;
  color: string;
  logo?: string | null;
  cnpj?: string | null;
  active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles: Role[];
  permissions: Permission[];
  all_permissions?: Permission[]; // Todas as permissões (via roles + diretas)
  stores?: Store[];
  /** Definido pelo backend: true apenas para role 'superadmin', não Admin */
  has_superadmin_role?: boolean;
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

export interface MeResponse {
  success: boolean;
  action: string;
  data: {
    user: User;
  };
}

export interface ProfileUpdateDto {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
}

class AuthService {
  private readonly endpoint = '/v1/auth';

  async login(credentials: LoginDto): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      `${this.endpoint}/login`,
      credentials
    );
    
    if (data.success && data.data.user) {
      // Token em cookie HttpOnly (backend) - não armazenar em localStorage (vulnerável a XSS)
      localStorage.setItem('isLoggedIn', 'true');
      
      // Normalizar estrutura do usuário
      if (data.data.user) {
        // Garantir que user.stores seja sempre um array
        if (data.data.user.stores) {
          if (!Array.isArray(data.data.user.stores)) {
            if (typeof data.data.user.stores === 'object' && data.data.user.stores !== null) {
              data.data.user.stores = Object.values(data.data.user.stores);
            } else {
              data.data.user.stores = [];
            }
          }
        } else {
          data.data.user.stores = [];
        }

        // Garantir que user.roles seja sempre um array
        if (!Array.isArray(data.data.user.roles)) {
          if (typeof data.data.user.roles === 'object' && data.data.user.roles !== null) {
            data.data.user.roles = Object.values(data.data.user.roles);
          } else {
            data.data.user.roles = [];
          }
        }
        
        // Garantir que cada role tenha permissions como array
        if (Array.isArray(data.data.user.roles)) {
          data.data.user.roles = data.data.user.roles.map(role => {
            if (role && !Array.isArray(role.permissions)) {
              if (typeof role.permissions === 'object' && role.permissions !== null) {
                role.permissions = Object.values(role.permissions);
              } else {
                role.permissions = [];
              }
            }
            return role;
          });
        }

        // Garantir que user.permissions seja sempre um array
        if (!Array.isArray(data.data.user.permissions)) {
          if (typeof data.data.user.permissions === 'object' && data.data.user.permissions !== null) {
            data.data.user.permissions = Object.values(data.data.user.permissions);
          } else {
            data.data.user.permissions = [];
          }
        }

        // Garantir que user.all_permissions seja sempre um array
        if (data.data.user.all_permissions) {
          if (!Array.isArray(data.data.user.all_permissions)) {
            if (typeof data.data.user.all_permissions === 'object' && data.data.user.all_permissions !== null) {
              data.data.user.all_permissions = Object.values(data.data.user.all_permissions);
            } else {
              data.data.user.all_permissions = [];
            }
          }
        } else {
          data.data.user.all_permissions = [];
        }
      }
    }
    
    return data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.endpoint}/logout`);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
      sessionStorage.clear();
      // Cookie é limpo pelo backend na resposta
    }
  }

  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>(`${this.endpoint}/me`);
    
    // Garantir que user.stores seja sempre um array
    if (data.success && data.data.user && data.data.user.stores) {
      if (!Array.isArray(data.data.user.stores)) {
        if (typeof data.data.user.stores === 'object' && data.data.user.stores !== null) {
          data.data.user.stores = Object.values(data.data.user.stores);
        } else {
          data.data.user.stores = [];
        }
      }
    } else if (data.success && data.data.user) {
      data.data.user.stores = [];
    }

    // Garantir que user.roles seja sempre um array
    if (data.success && data.data.user) {
      if (!Array.isArray(data.data.user.roles)) {
        if (typeof data.data.user.roles === 'object' && data.data.user.roles !== null) {
          data.data.user.roles = Object.values(data.data.user.roles);
        } else {
          data.data.user.roles = [];
        }
      }
      
      // Garantir que cada role tenha permissions como array
      if (Array.isArray(data.data.user.roles)) {
        data.data.user.roles = data.data.user.roles.map(role => {
          if (role && !Array.isArray(role.permissions)) {
            if (typeof role.permissions === 'object' && role.permissions !== null) {
              role.permissions = Object.values(role.permissions);
            } else {
              role.permissions = [];
            }
          }
          return role;
        });
      }
    }

    // Garantir que user.permissions seja sempre um array
    if (data.success && data.data.user) {
      if (!Array.isArray(data.data.user.permissions)) {
        if (typeof data.data.user.permissions === 'object' && data.data.user.permissions !== null) {
          data.data.user.permissions = Object.values(data.data.user.permissions);
        } else {
          data.data.user.permissions = [];
        }
      }
    }
    
    // Garantir que all_permissions seja sempre um array
    if (data.success && data.data.user && data.data.user.all_permissions) {
      if (!Array.isArray(data.data.user.all_permissions)) {
        if (typeof data.data.user.all_permissions === 'object' && data.data.user.all_permissions !== null) {
          data.data.user.all_permissions = Object.values(data.data.user.all_permissions);
        } else {
          data.data.user.all_permissions = [];
        }
      }
    } else if (data.success && data.data.user) {
      data.data.user.all_permissions = [];
    }
    
    return data;
  }

  async updateProfile(payload: ProfileUpdateDto): Promise<MeResponse> {
    const { data } = await apiClient.put<MeResponse>(`${this.endpoint}/profile`, payload);
    if (!data.success || !data.data?.user) {
      throw new Error('Erro ao atualizar perfil');
    }
    return data;
  }

  isAuthenticated(): boolean {
    // Cookie HttpOnly não é acessível via JS; usar flag de localStorage ou confiar em /me
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  getToken(): string | null {
    // Token em cookie HttpOnly - não acessível via JS (segurança)
    return null;
  }
}

export const authService = new AuthService();
