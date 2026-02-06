import { useAuth } from './useAuth';
import { getEffectiveUserPermissions, isSuperAdmin, hasSuperAdminRole } from '../../utils/menuPermissions';

/**
 * Hook para verificar permissões do usuário atual
 * 
 * @returns Função para verificar se o usuário tem uma permissão específica
 */
export const usePermission = () => {
  const { user } = useAuth();

  /**
   * Verifica se o usuário tem uma permissão específica
   * 
   * @param permission Nome da permissão (ex: 'clients.create', 'lenses.update')
   * @returns true se o usuário tem a permissão, false caso contrário
   */
  const hasPermission = (permission: string): boolean => {
    // Se não há usuário, não tem permissão
    if (!user) {
      return false;
    }

    // Superadmin tem todas as permissões
    if (isSuperAdmin(user)) {
      return true;
    }

    // Usar permissões efetivas do backend (all_permissions)
    const userPermissions = getEffectiveUserPermissions(user);
    
    return userPermissions.some(perm => perm.name === permission);
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões fornecidas
   * 
   * @param permissions Array de nomes de permissões
   * @returns true se o usuário tem pelo menos uma das permissões, false caso contrário
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return true; // Se não há permissões requeridas, permite acesso
    }

    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Verifica se o usuário tem todas as permissões fornecidas
   * 
   * @param permissions Array de nomes de permissões
   * @returns true se o usuário tem todas as permissões, false caso contrário
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return true; // Se não há permissões requeridas, permite acesso
    }

    return permissions.every(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: user ? isSuperAdmin(user) : false,
    /** Usa has_superadmin_role da API (fonte da verdade) ou fallback para checagem local */
    hasSuperAdminRole: user
      ? (typeof user.has_superadmin_role === 'boolean' ? user.has_superadmin_role : hasSuperAdminRole(user))
      : false,
  };
};
