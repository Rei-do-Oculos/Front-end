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
    token: string;
  };
}

export interface Store {
  id: number;
  name: string;
  unity?: string | null;
  fancy_name: string;
  color: string;
  logo?: string | null;
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

class AuthService {
  private readonly endpoint = '/v1/auth';

  async login(credentials: LoginDto): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      `${this.endpoint}/login`,
      credentials
    );
    
    if (data.success && data.data.token) {
      localStorage.setItem('authToken', data.data.token);
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
    }
  }

  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>(`${this.endpoint}/me`);
    
    // Debug: Log da resposta bruta da API
    console.log('[authService.me] 📡 Resposta bruta da API:', {
      success: data.success,
      hasUser: !!data.data?.user,
      userStructure: data.data?.user ? {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        roles: data.data.user.roles,
        permissions: data.data.user.permissions,
        stores: data.data.user.stores,
        storesCount: Array.isArray(data.data.user.stores) ? data.data.user.stores.length : 
                    (data.data.user.stores && typeof data.data.user.stores === 'object' ? Object.keys(data.data.user.stores).length : 0),
        rolesType: typeof data.data.user.roles,
        permissionsType: typeof data.data.user.permissions,
        storesType: typeof data.data.user.stores,
        rolesIsArray: Array.isArray(data.data.user.roles),
        permissionsIsArray: Array.isArray(data.data.user.permissions),
        storesIsArray: Array.isArray(data.data.user.stores),
      } : null,
    });
    
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

    // Debug: Log após normalização
    console.log('[authService.me] ✅ Dados normalizados:', {
      rolesCount: Array.isArray(data.data?.user?.roles) ? data.data.user.roles.length : 0,
      permissionsCount: Array.isArray(data.data?.user?.permissions) ? data.data.user.permissions.length : 0,
      allPermissionsCount: Array.isArray(data.data?.user?.all_permissions) ? data.data.user.all_permissions.length : 0,
      rolesWithPermissions: Array.isArray(data.data?.user?.roles) ? data.data.user.roles.map(r => ({
        name: r.name,
        permissionsCount: Array.isArray(r.permissions) ? r.permissions.length : 0,
      })) : [],
      allPermissions: Array.isArray(data.data?.user?.all_permissions) ? data.data.user.all_permissions.map(p => p.name || p.slug) : [],
    });
    
    return data;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export const authService = new AuthService();
