import { apiClient } from './client';

export interface StoreExpense {
  id: number;
  name: string;
  unity?: string | null;
  total: number;
}

export interface RevenueByPaymentMethod {
  credit_card: number;
  debit_card: number;
  cash: number;
  pix: number;
}

export interface DashboardStats {
  revenue: number;
  costs: number;
  expenses: number;
  profit: number;
  profit_margin: number;
  total_orders: number;
  average_ticket: number;
  overdue: {
    count: number;
    total: number;
  };
  pending: {
    count: number;
    total: number;
  };
  expenses_by_store?: StoreExpense[];
  revenue_by_payment_method?: RevenueByPaymentMethod;
}

export interface StoreRevenue {
  id: number;
  name: string;
  unity?: string;
  total: number;
  count: number;
  average_ticket: number;
}

export interface TopSeller {
  id: number;
  name: string;
  email: string;
  total: number;
  count: number;
  average_ticket: number;
}

export interface RevenueByPeriod {
  date: string;
  total: number;
  count: number;
}

export interface OverdueOrder {
  id: number;
  os_number: number;
  client_name: string;
  client_phone: string;
  store_name: string;
  price: number;
  arrived_at: string;
  days_overdue: number;
}

export interface FinanceDashboardResponse {
  dashboard: DashboardStats;
  revenue_by_store: StoreRevenue[];
  top_sellers: TopSeller[];
  revenue_by_period: RevenueByPeriod[];
  overdue_summary: OverdueOrder[];
}

export interface FinanceFilters {
  store_id?: number;
  date_from?: string;
  date_to?: string;
  payment_method?: string[];
}

class FinanceService {
  protected endpoint: string;

  constructor() {
    this.endpoint = '/v1/finance';
  }

  private toArray<T>(value: T[] | Record<string, T> | null | undefined): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return Object.values(value) as T[];
    return [];
  }

  async getDashboard(filters?: FinanceFilters): Promise<FinanceDashboardResponse> {
    const response = await apiClient.get<{
      success: boolean;
      data: FinanceDashboardResponse;
    }>(`${this.endpoint}/dashboard`, { params: filters });

    if (!response.data.success || !response.data.data) {
      throw new Error('Erro ao buscar dashboard financeiro');
    }

    const raw = response.data.data;
    const dash = raw.dashboard || {};
    return {
      dashboard: {
        ...dash,
        expenses: dash.expenses ?? 0,
        expenses_by_store: this.toArray<StoreExpense>(dash.expenses_by_store),
      },
      revenue_by_store: this.toArray<StoreRevenue>(raw.revenue_by_store),
      top_sellers: this.toArray<TopSeller>(raw.top_sellers),
      revenue_by_period: this.toArray(raw.revenue_by_period),
      overdue_summary: this.toArray<OverdueOrder>(raw.overdue_summary),
    };
  }

  async getRevenueByStore(filters?: FinanceFilters): Promise<StoreRevenue[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { stores: StoreRevenue[] };
    }>(`${this.endpoint}/revenue-by-store`, { params: filters });

    if (!response.data.success || !response.data.data) {
      throw new Error('Erro ao buscar faturamento por loja');
    }

    return response.data.data.stores;
  }

  async getTopSellers(filters?: FinanceFilters): Promise<TopSeller[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { sellers: TopSeller[] };
    }>(`${this.endpoint}/top-sellers`, { params: filters });

    if (!response.data.success || !response.data.data) {
      throw new Error('Erro ao buscar ranking de vendedores');
    }

    return response.data.data.sellers;
  }

  async getOverdueSummary(filters?: FinanceFilters): Promise<OverdueOrder[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { overdue: OverdueOrder[] };
    }>(`${this.endpoint}/overdue-summary`, { params: filters });

    if (!response.data.success || !response.data.data) {
      throw new Error('Erro ao buscar resumo de inadimplências');
    }

    return response.data.data.overdue;
  }
}

export const financeService = new FinanceService();
