import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, LoginDto, User } from '../services/api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
        setUser(response.data.user);
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
        const errorMsg = response.data?.errors?.email?.[0] ||
          response.data?.errors?.password?.[0] ||
          'Credenciais inválidas';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const d = err.response?.data;
      const pick = (errors: unknown): string | null => {
        if (!errors || typeof errors !== 'object') return null;
        const o = errors as Record<string, unknown>;
        for (const key of ['email', 'password', 'message']) {
          const v = o[key];
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
          if (typeof v === 'string' && v.trim()) return v;
        }
        for (const v of Object.values(o)) {
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
          if (typeof v === 'string' && v.trim()) return v;
        }
        return null;
      };
      const apiError =
        pick(d?.errors) ||
        (typeof d?.message === 'string' && d.message.trim() ? d.message : null) ||
        pick(d?.data?.errors) ||
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

  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      const response = await authService.me();
      if (response.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
