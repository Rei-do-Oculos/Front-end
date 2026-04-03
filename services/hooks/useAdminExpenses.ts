import { useApi } from './useApi';
import {
  adminExpensesService,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpensesQueryParams,
  Expense,
} from '../api/expenses';

interface UseExpensesOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: ExpensesQueryParams;
}

export const useAdminExpenses = (options: UseExpensesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Expense, CreateExpenseDto, UpdateExpenseDto, ExpensesQueryParams>({
    service: adminExpensesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    expenses: api.data,
    loading: api.loading,
    totalValue: api.totalSales ?? 0,
    error: api.error,
    pagination: api.pagination,
    fetchExpenses: api.fetch,
    getExpense: api.getById,
    createExpense: api.create,
    updateExpense: api.update,
    deleteExpense: api.delete,
    reset: api.reset,
  };
};
