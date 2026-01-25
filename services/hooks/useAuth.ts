import { useState, useEffect, useCallback } from 'react';
import { authService, LoginDto, User } from '../api/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.me();
      
      if (response.success && response.data.user) {
        const userData = response.data.user;
        
        // Debug: Log completo da estrutura do usuário
        console.log('[useAuth] 👤 Dados do usuário recebidos:', {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          roles: userData.roles,
          permissions: userData.permissions,
          rolesStructure: Array.isArray(userData.roles) ? userData.roles.map(r => ({
            id: r.id,
            name: r.name,
            hasPermissions: !!r.permissions,
            permissionsCount: Array.isArray(r.permissions) ? r.permissions.length : 0,
            permissions: r.permissions,
          })) : 'Não é array',
          permissionsStructure: Array.isArray(userData.permissions) ? userData.permissions.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          })) : 'Não é array',
        });
        
        setUser(userData);
      } else {
        throw new Error('Falha ao obter dados do usuário');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar autenticação');
      setUser(null);
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginDto) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        // Se não teve sucesso, verifica se há mensagem de erro na resposta
        const errorMsg = response.data?.errors?.email?.[0] || 
                         response.data?.errors?.password?.[0] ||
                         'Credenciais inválidas';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      // Tenta extrair a mensagem de erro da resposta da API
      const apiError = err.response?.data?.data?.errors?.email?.[0] ||
                       err.response?.data?.data?.errors?.password?.[0] ||
                       err.response?.data?.message ||
                       err.message ||
                       'Erro ao fazer login';
      setError(apiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoading,
    error,
    login,
    logout,
    checkAuth,
  };
};
