import { useState, useCallback } from 'react';
import { 
  financeService, 
  FinanceDashboardResponse, 
  FinanceFilters,
  StoreRevenue,
  TopSeller,
  OverdueOrder
} from '../api/finance';

export const useFinance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboard = useCallback(async (filters?: FinanceFilters): Promise<FinanceDashboardResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeService.getDashboard(filters);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRevenueByStore = useCallback(async (filters?: FinanceFilters): Promise<StoreRevenue[]> => {
    setLoading(true);
    setError(null);
    try {
      return await financeService.getRevenueByStore(filters);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar faturamento por loja');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTopSellers = useCallback(async (filters?: FinanceFilters): Promise<TopSeller[]> => {
    setLoading(true);
    setError(null);
    try {
      return await financeService.getTopSellers(filters);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar ranking de vendedores');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getOverdueSummary = useCallback(async (filters?: FinanceFilters): Promise<OverdueOrder[]> => {
    setLoading(true);
    setError(null);
    try {
      return await financeService.getOverdueSummary(filters);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar resumo de inadimplências');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getDashboard,
    getRevenueByStore,
    getTopSellers,
    getOverdueSummary,
  };
};
