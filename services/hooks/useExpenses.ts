import { useApi } from './useApi';
import {
  expensesService,
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

export const useExpenses = (options: UseExpensesOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Expense, CreateExpenseDto, UpdateExpenseDto, ExpensesQueryParams>({
    service: expensesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    expenses: api.data,
    loading: api.loading,
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
