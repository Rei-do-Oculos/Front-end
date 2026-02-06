import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../services/hooks/useAuth';
import { routePermissionMap, hasRoutePermission, getEffectiveUserPermissions, isSuperAdmin } from '../utils/menuPermissions';
import { AccessDeniedCard } from './Common';

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

  // Usar apenas permissões efetivas do backend (all_permissions)
  const userPermissions = getEffectiveUserPermissions(user);

  // DEBUG: Log para verificar permissões
  console.log('[ProtectedRoute] 🔍 Verificação de permissões:', {
    route: location.pathname,
    hash: location.hash,
    userPermissions: userPermissions.map(p => typeof p === 'string' ? p : p.name),
    userAllPermissions: user?.all_permissions?.map((p: any) => p.name || p.slug) || [],
    userId: user?.id,
    userEmail: user?.email,
  });

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

  console.log('[ProtectedRoute] 📋 Permissões requeridas:', {
    route,
    permissionsToCheck,
    foundInMap: !!routePermissionMap[route],
  });

  // Se não há permissões requeridas, permitir acesso (rota pública)
  if (!permissionsToCheck || permissionsToCheck.length === 0) {
    console.log('[ProtectedRoute] ✅ Rota pública, permitindo acesso');
    return <>{children}</>;
  }

  // Verificar se o usuário tem permissão
  const hasPermission = hasRoutePermission(userPermissions, route, user as any);

  console.log('[ProtectedRoute] 🔐 Resultado da verificação:', {
    hasPermission,
    userPermissionsCount: userPermissions.length,
    requiredPermissions: permissionsToCheck,
    userHasRequired: permissionsToCheck.some(perm => 
      userPermissions.some(up => {
        const upName = typeof up === 'string' ? up : up.name;
        return upName === perm;
      })
    ),
  });

  if (!hasPermission) {
    console.warn('[ProtectedRoute] ❌ Acesso negado:', {
      route,
      requiredPermissions: permissionsToCheck,
      userPermissions: userPermissions.map(p => typeof p === 'string' ? p : p.name),
    });
    return <AccessDeniedCard />;
  }

  // Usuário tem permissão, renderizar conteúdo
  return <>{children}</>;
};
