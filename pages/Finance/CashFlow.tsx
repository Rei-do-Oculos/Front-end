import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Building2, 
  Users, 
  ShoppingBag,
  Clock,
  Phone,
  Eye,
  Loader2,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Badge, Input, SingleSelect } from '../../components/Common';
import { useFinance } from '../../services/hooks/useFinance';
import { useStores } from '../../services/hooks/useStores';
import { usePermission } from '../../services/hooks/usePermission';
import { 
  FinanceDashboardResponse, 
  StoreRevenue, 
  TopSeller, 
  OverdueOrder 
} from '../../services/api/finance';

export const CashFlow: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { getDashboard, loading } = useFinance();
  const { stores, fetchStores } = useStores({ autoFetch: false });

  // Filtros
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Dados
  const [dashboardData, setDashboardData] = useState<FinanceDashboardResponse | null>(null);

  // Carregar lojas para filtro
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Definir período padrão (últimos 30 dias)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFilterDateTo(today.toISOString().split('T')[0]);
    setFilterDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Carregar dados
  const loadData = useCallback(async () => {
    const filters: any = {};
    
    if (filterStore) {
      filters.store_id = parseInt(filterStore);
    }
    if (filterDateFrom) {
      filters.date_from = filterDateFrom;
    }
    if (filterDateTo) {
      filters.date_to = filterDateTo;
    }

    const data = await getDashboard(filters);
    if (data) {
      setDashboardData(data);
    }
  }, [getDashboard, filterStore, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (filterDateFrom && filterDateTo) {
      loadData();
    }
  }, [loadData, filterDateFrom, filterDateTo]);

  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setFilterStore('');
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setFilterDateTo(today.toISOString().split('T')[0]);
    setFilterDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatOsNumber = (osNumber: number) => {
    return String(osNumber).padStart(4, '0');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      if (dateString.includes('/')) {
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const [day, month, year] = datePart.split('/');
        return `${day}/${month}/${year}`;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const storeOptions = [
    { label: 'Todas as Lojas', value: '' },
    ...stores.map(store => ({
      label: store.unity ? `${store.name} (${store.unity})` : store.name,
      value: String(store.id),
    })),
  ];

  const dashboard = dashboardData?.dashboard;

  // Normalizar para array (API pode retornar objeto com chaves numéricas)
  const toArray = <T,>(value: T[] | Record<string, T> | null | undefined): T[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return Object.values(value) as T[];
    return [];
  };

  const revenueByStore = toArray<StoreRevenue>(dashboardData?.revenue_by_store);
  const topSellers = toArray<TopSeller>(dashboardData?.top_sellers);
  const overdueSummary = toArray<OverdueOrder>(dashboardData?.overdue_summary);

  // Calcular totais para a barra de progresso
  const totalRevenue = dashboard?.revenue || 0;
  const maxStoreRevenue = revenueByStore.length > 0 ? Math.max(...revenueByStore.map(s => s.total)) : 0;
  const maxSellerRevenue = topSellers.length > 0 ? Math.max(...topSellers.map(s => s.total)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-gray-500 font-medium mt-1">Acompanhe o desempenho financeiro</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClearFilters}>
            <RefreshCw size={18} /> Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} style={{ color: 'var(--store-color)' }} />
          <h3 className="text-sm font-bold text-slate-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SingleSelect
            label="Loja"
            options={storeOptions}
            value={filterStore}
            onChange={setFilterStore}
          />
          <Input
            label="Data Inicial"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <Input
            label="Data Final"
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} className="w-full">
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
        </div>
      ) : (
        <>
          {/* Cards Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faturamento */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
                >
                  <DollarSign size={24} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {dashboard?.total_orders || 0} vendas
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Faturamento</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(dashboard?.revenue || 0)}</p>
            </div>

            {/* Custos */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-50 text-red-600">
                  <TrendingDown size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custos</p>
              <p className="text-2xl font-black text-red-600">{formatCurrency(dashboard?.costs || 0)}</p>
            </div>

            {/* Lucro */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp size={24} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {dashboard?.profit_margin || 0}% margem
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lucro</p>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(dashboard?.profit || 0)}</p>
            </div>

            {/* Ticket Médio */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
                >
                  <ShoppingBag size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(dashboard?.average_ticket || 0)}</p>
            </div>
          </div>

          {/* Cards Secundários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aguardando Retirada */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={24} />
                </div>
                <span className="text-sm font-bold text-amber-600">
                  {dashboard?.pending?.count || 0} OS
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aguardando Retirada</p>
              <p className="text-2xl font-black text-amber-600">{formatCurrency(dashboard?.pending?.total || 0)}</p>
            </div>

            {/* Inadimplências */}
            <div 
              className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate('/finance/overdue')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <span className="text-sm font-bold text-red-600">
                  {dashboard?.overdue?.count || 0} OS
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inadimplências</p>
              <p className="text-2xl font-black text-red-600">{formatCurrency(dashboard?.overdue?.total || 0)}</p>
              <p className="text-xs text-slate-500 mt-2">Clique para ver detalhes</p>
            </div>
          </div>

          {/* Faturamento por Loja e Ranking de Vendedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faturamento por Loja */}
            {hasPermission('finance.revenue-by-store') && (
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Faturamento por Loja</h3>
                      <p className="text-xs text-slate-500">{revenueByStore.length} lojas com vendas</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {revenueByStore.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Nenhum faturamento no período</p>
                  ) : (
                    <div className="space-y-4">
                      {revenueByStore.map((store, index) => (
                        <div key={store.id} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                                style={{ backgroundColor: 'var(--store-color)' }}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {store.name}
                                  {store.unity && <span className="text-slate-400 font-normal"> ({store.unity})</span>}
                                </p>
                                <p className="text-[10px] text-slate-400">{store.count} vendas • Ticket: {formatCurrency(store.average_ticket)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black" style={{ color: 'var(--store-color)' }}>
                              {formatCurrency(store.total)}
                            </p>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${(store.total / maxStoreRevenue) * 100}%`,
                                backgroundColor: 'var(--store-color)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Ranking de Vendedores */}
            {hasPermission('finance.top-sellers') && (
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
                    >
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Top Vendedores</h3>
                      <p className="text-xs text-slate-500">Ranking por faturamento</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {topSellers.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Nenhuma venda no período</p>
                  ) : (
                    <div className="space-y-4">
                      {topSellers.map((seller, index) => (
                        <div key={seller.id} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span 
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                                  index === 0 ? 'bg-amber-500' : 
                                  index === 1 ? 'bg-slate-400' : 
                                  index === 2 ? 'bg-amber-700' : ''
                                }`}
                                style={index > 2 ? { backgroundColor: 'var(--store-color)' } : undefined}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{seller.name}</p>
                                <p className="text-[10px] text-slate-400">{seller.count} vendas • Ticket: {formatCurrency(seller.average_ticket)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black" style={{ color: 'var(--store-color)' }}>
                              {formatCurrency(seller.total)}
                            </p>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${(seller.total / maxSellerRevenue) * 100}%`,
                                backgroundColor: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--store-color)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Resumo de Inadimplências */}
          {hasPermission('finance.overdue-summary') && overdueSummary.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Inadimplências Recentes</h3>
                      <p className="text-xs text-slate-500">Clientes com pagamento pendente</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/finance/overdue')}>
                    Ver Todas
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Nº OS</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Loja</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Dias em Atraso</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {overdueSummary.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-red-600">{formatOsNumber(order.os_number)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{order.client_name}</p>
                          <p className="text-xs text-slate-400">{order.client_phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-500 uppercase">{order.store_name}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="danger">{order.days_overdue} dias</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-red-600">{formatCurrency(order.price)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              title="Ver OS"
                              onClick={() => navigate(`/service-orders/${order.id}`)}
                              className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={`tel:${order.client_phone}`}
                              title="Ligar para cliente"
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Phone size={16} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
