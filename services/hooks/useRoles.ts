import { useApi } from './useApi';
import { rolesService, CreateRoleDto, UpdateRoleDto, RolesQueryParams, Role } from '../api/roles';

interface UseRolesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: RolesQueryParams;
}

export const useRoles = (options: UseRolesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Role, CreateRoleDto, UpdateRoleDto, RolesQueryParams>({
    service: rolesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  const syncPermissions = async (id: string, permissionIds: number[]): Promise<Role> => {
    return rolesService.syncPermissions(id, permissionIds);
  };

  return {
    roles: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchRoles: api.fetch,
    getRole: api.getById,
    createRole: api.create,
    updateRole: api.update,
    deleteRole: api.delete,
    syncPermissions,
    reset: api.reset,
  };
};
