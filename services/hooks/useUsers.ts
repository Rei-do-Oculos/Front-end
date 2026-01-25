import { useApi } from './useApi';
import { usersService, CreateUserDto, UpdateUserDto, UsersQueryParams } from '../api/users';
import { User } from '../api/users';

interface UseUsersOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: UsersQueryParams;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<User, CreateUserDto, UpdateUserDto, UsersQueryParams>({
    service: usersService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    users: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchUsers: api.fetch,
    getUser: api.getById,
    createUser: api.create,
    updateUser: api.update,
    deleteUser: api.delete,
    reset: api.reset,
  };
};
