import { useApi } from './useApi';
import { permissionsService, CreatePermissionDto, UpdatePermissionDto, PermissionsQueryParams } from '../api/permissions';
import { Permission } from '../api/permissions';

interface UsePermissionsOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: PermissionsQueryParams;
}

export const usePermissions = (options: UsePermissionsOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Permission, CreatePermissionDto, UpdatePermissionDto, PermissionsQueryParams>({
    service: permissionsService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    permissions: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchPermissions: api.fetch,
    getPermission: api.getById,
    createPermission: api.create,
    updatePermission: api.update,
    deletePermission: api.delete,
    reset: api.reset,
  };
};
