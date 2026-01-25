import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../services/hooks/useAuth';
import { routePermissionMap, hasRoutePermission, getAllUserPermissions, isSuperAdmin } from '../utils/menuPermissions';
import { ShieldCheck } from 'lucide-react';
import { Card, Button } from './Common';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

/**
 * Componente de proteção de rotas
 * Verifica se o usuário tem permissão para acessar a rota atual
 * Se não tiver, redireciona ou mostra mensagem de acesso negado
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions 
}) => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Superadmin tem acesso a tudo
  if (isSuperAdmin(user)) {
    return <>{children}</>;
  }

  // Obter todas as permissões do usuário
  const userPermissions = getAllUserPermissions(user);

  // Se não foram passadas permissões específicas, tentar obter do mapeamento de rotas
  // Com HashRouter, a rota real está em location.hash (sem o #)
  // Com BrowserRouter, a rota está em location.pathname
  let route = location.pathname;
  if (location.hash && location.hash.length > 1) {
    // Remover o # do início do hash
    route = location.hash.substring(1);
  }
  
  let permissionsToCheck = requiredPermissions;

  if (!permissionsToCheck || permissionsToCheck.length === 0) {
    // Tentar match exato primeiro
    permissionsToCheck = routePermissionMap[route] || [];
    
    // Se não encontrou, tentar match com padrões dinâmicos
    if (permissionsToCheck.length === 0) {
      // Procurar por padrões que correspondam (ex: /clients/123/edit -> /clients/:id/edit)
      for (const [pattern, perms] of Object.entries(routePermissionMap)) {
        // Converter padrão para regex (ex: /clients/:id/edit -> /clients/\d+/edit)
        const regexPattern = pattern
          .replace(/:[^/]+/g, '\\d+') // Substituir :id, :param por \d+
          .replace(/\//g, '\\/'); // Escapar barras
        
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(route)) {
          permissionsToCheck = perms;
          break;
        }
      }
    }
  }

  // Se não há permissões requeridas, permitir acesso (rota pública)
  if (!permissionsToCheck || permissionsToCheck.length === 0) {
    return <>{children}</>;
  }

  // Verificar se o usuário tem permissão
  const hasPermission = hasRoutePermission(userPermissions, route, user as any);

  if (!hasPermission) {
    // Log para debug
    console.warn('[ProtectedRoute] Acesso negado:', {
      route,
      requiredPermissions: permissionsToCheck,
      userPermissions: userPermissions.map(p => p.name),
      userId: user.id,
    });

    // Mostrar página de acesso negado
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                <ShieldCheck size={40} style={{ color: 'var(--store-color)' }} />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Acesso Negado
              </h1>
              <p className="text-slate-600">
                Você não tem permissão para acessar esta página.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Usuário tem permissão, renderizar conteúdo
  return <>{children}</>;
};
