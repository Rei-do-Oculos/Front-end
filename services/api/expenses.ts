import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'permuta';

export interface Expense {
  id: number;
  store_id: number;
  name: string;
  value: number | string;
  payment_method: string;
  date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  store?: {
    id: number;
    name: string;
    unity?: string | null;
  };
}

export interface CreateExpenseDto {
  store_id?: number;
  name: string;
  value: number | string;
  payment_method: PaymentMethod;
  date?: string | null;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

export interface ExpensesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  store_id?: number | number[];
  payment_method?: string | string[];
  date_from?: string;
  date_to?: string;
}

export interface LaravelPaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ExpensesListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    expenses: LaravelPaginatedResponse<Expense>;
  };
}

export interface ExpenseResponse {
  success: boolean;
  action: string;
  data: {
    request?: any;
    expense: Expense;
  };
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
};

class ExpensesService {
  protected endpoint = '/v1/expenses';

  async getAll(params?: ExpensesQueryParams & { page?: number }): Promise<PaginatedResponse<Expense>> {
    const response = await apiClient.get<ExpensesListResponse>(this.endpoint, { params: params as any });
    const responseData = response.data;
    if (!responseData.success || !responseData.data?.expenses) {
      throw new Error('Resposta inválida da API de despesas');
    }
    const pag = responseData.data.expenses;
    let data: Expense[] = Array.isArray(pag.data) ? pag.data : (pag.data ? Object.values(pag.data) : []);
    return {
      data,
      meta: {
        currentPage: pag.current_page || 1,
        totalPages: pag.last_page || 1,
        totalItems: pag.total || 0,
      },
    };
  }

  async getById(id: string): Promise<Expense> {
    const { data } = await apiClient.get<ExpenseResponse>(`${this.endpoint}/${id}`);
    if (!data.success || !data.data?.expense) throw new Error('Despesa não encontrada');
    return data.data.expense;
  }

  async create(payload: CreateExpenseDto): Promise<Expense> {
    const { data } = await apiClient.post<ExpenseResponse>(`${this.endpoint}/create`, payload);
    if (!data.success || !data.data?.expense) throw new Error('Erro ao criar despesa');
    return data.data.expense;
  }

  async update(id: string, payload: UpdateExpenseDto): Promise<Expense> {
    const { data } = await apiClient.put<ExpenseResponse>(`${this.endpoint}/${id}`, payload);
    if (!data.success || !data.data?.expense) throw new Error('Erro ao atualizar despesa');
    return data.data.expense;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean; action: string; data: any }>(`${this.endpoint}/${id}`);
    if (!data.success) throw new Error('Erro ao excluir despesa');
  }

  async plucks(): Promise<any[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
      const plucks = data.data?.plucks ?? [];
      return Array.isArray(plucks) ? plucks : Object.values(plucks);
    } catch {
      return [];
    }
  }
}

export const expensesService = new ExpensesService();
