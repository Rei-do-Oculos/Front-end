import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
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
  Filter,
  RefreshCw,
  Receipt,
  FileDown,
  CreditCard,
  Banknote,
  QrCode,
  Briefcase,
} from 'lucide-react';
import { exportCashFlowPdf } from '../../utils/cashFlowExport';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : (import.meta.env.VITE_API_URL || '').replace(/\/api(\/.*)?$/, '') || window.location.origin;
const buildLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/')) return `${API_BASE}${logoPath}`;
  const path = logoPath.startsWith('storage/') ? logoPath : `storage/${logoPath}`;
  return import.meta.env.DEV ? `/${path}` : `${API_BASE}/${path}`;
};
import { Card, Button, Badge, Input, SingleSelect, MultiSelect } from '../../components/Common';
import { useFinance } from '../../services/hooks/useFinance';
import { useStores } from '../../services/hooks/useStores';
import { useStore } from '../../contexts/StoreContext';
import { usePermission } from '../../services/hooks/usePermission';
import { 
  FinanceDashboardResponse, 
  StoreRevenue, 
  TopSeller, 
  OverdueOrder 
} from '../../services/api/finance';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const CashFlow: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { selectedStore } = useStore();
  const { getDashboard, loading } = useFinance();
  const { stores, fetchStores } = useStores({ autoFetch: false });

  // Filtros
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterPaymentMethods, setFilterPaymentMethods] = useState<string[]>([]);

  // Dados
  const [dashboardData, setDashboardData] = useState<FinanceDashboardResponse | null>(null);

  // Exportação
  const [exportingPdf, setExportingPdf] = useState(false);

  // Carregar lojas para filtro
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Período do mês atual (primeiro e último dia)
  const getCurrentMonthRange = useCallback(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: first.toISOString().split('T')[0],
      to: last.toISOString().split('T')[0],
    };
  }, []);

  // Definir período padrão: mês atual
  useEffect(() => {
    const { from, to } = getCurrentMonthRange();
    setFilterDateFrom(from);
    setFilterDateTo(to);
  }, [getCurrentMonthRange]);

  const paymentMethodOptions = useMemo(() => [
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'permuta', label: 'Permuta' },
  ], []);

  // Carregar dados (apenas quando o usuário clica em Aplicar/Limpar)
  const loadData = useCallback(async (overrides?: { dateFrom?: string; dateTo?: string; storeId?: string; paymentMethods?: string[] }) => {
    const filters: any = {};
    const dateFrom = overrides?.dateFrom ?? filterDateFrom;
    const dateTo = overrides?.dateTo ?? filterDateTo;
    const storeId = overrides?.storeId ?? filterStore;
    const paymentMethods = overrides?.paymentMethods ?? filterPaymentMethods;

    if (storeId) {
      filters.store_id = parseInt(storeId);
    }
    if (dateFrom) {
      filters.date_from = dateFrom;
    }
    if (dateTo) {
      filters.date_to = dateTo;
    }
    if (paymentMethods && paymentMethods.length > 0) {
      filters.payment_method = paymentMethods;
    }

    const data = await getDashboard(filters);
    if (data) {
      setDashboardData(data);
    }
  }, [getDashboard, filterStore, filterDateFrom, filterDateTo, filterPaymentMethods]);

  // Carregar apenas na montagem inicial (com mês atual)
  const hasInitiallyLoaded = React.useRef(false);
  useEffect(() => {
    if (filterDateFrom && filterDateTo && !hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      loadData();
    }
  }, [filterDateFrom, filterDateTo, loadData]);

  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setFilterStore('');
    setFilterPaymentMethods([]);
    const { from, to } = getCurrentMonthRange();
    setFilterDateFrom(from);
    setFilterDateTo(to);
    loadData({ dateFrom: from, dateTo: to, storeId: '', paymentMethods: [] });
  };

  // Nome do mês para exibir (baseado no filtro de data)
  const reportMonthLabel = useMemo(() => {
    if (!filterDateFrom) return '';
    try {
      const [y, m] = filterDateFrom.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      const str = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return '';
    }
  }, [filterDateFrom]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatOsNumber = (osNumber: number) => {
    return String(osNumber).padStart(4, '0');
  };

  const goToOrdersByPaymentMethod = (paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'permuta') => {
    const params = new URLSearchParams();
    const storeIdForNavigation = filterStore || (selectedStore?.id ? String(selectedStore.id) : '');
    if (storeIdForNavigation) params.set('store_id', storeIdForNavigation);
    if (filterDateFrom) params.set('date_from', filterDateFrom);
    if (filterDateTo) params.set('date_to', filterDateTo);
    params.set('payment_method', paymentMethod);
    navigate(`/service-orders?${params.toString()}`);
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

  const exportFilters = useMemo(() => {
    const storeLabel = !filterStore
      ? 'Todas as Lojas'
      : (() => {
          const s = stores.find((st) => String(st.id) === filterStore);
          return s ? (s.unity ? `${s.name} (${s.unity})` : s.name) : 'Todas as Lojas';
        })();
    const paymentMethodLabels = filterPaymentMethods.length > 0
      ? filterPaymentMethods
          .map((v) => paymentMethodOptions.find((o) => o.value === v)?.label ?? v)
          .join(', ')
      : null;
    return {
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      storeId: filterStore,
      storeLabel,
      paymentMethods: paymentMethodLabels,
    };
  }, [filterDateFrom, filterDateTo, filterStore, filterPaymentMethods, paymentMethodOptions, stores]);

  const handleExportPdf = async () => {
    if (!dashboardData || !filterDateFrom || !filterDateTo) return;
    setExportingPdf(true);
    try {
      await exportCashFlowPdf({
        data: dashboardData,
        filters: exportFilters,
        storeData: selectedStore ? { name: selectedStore.name, fancy_name: selectedStore.fancy_name, color: selectedStore.color, logo: selectedStore.logo } : undefined,
        storeColor: selectedStore?.color,
        storeLogo: selectedStore?.logo,
        logoUrlBuilder: buildLogoUrl,
      });
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };


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

  const baseBarOptions = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        borderRadius: 12,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: (v: string) => formatCurrency(Number(v)) },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#475569', maxRotation: 0 },
      },
    },
  }), []);

  const optionsFaturamentoPorLoja = useMemo(() => ({
    ...baseBarOptions,
    plugins: {
      ...baseBarOptions.plugins,
      tooltip: {
        ...baseBarOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: { raw: number; dataIndex: number }) => {
            const store = revenueByStore[ctx.dataIndex];
            if (!store) return formatCurrency(ctx.raw);
            return `${formatCurrency(ctx.raw)} • ${store.count} vendas • Ticket: ${formatCurrency(store.average_ticket)}`;
          },
        },
      },
    },
  }), [baseBarOptions, revenueByStore]);

  const optionsTopVendedores = useMemo(() => ({
    ...baseBarOptions,
    plugins: {
      ...baseBarOptions.plugins,
      tooltip: {
        ...baseBarOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: { raw: number; dataIndex: number }) => {
            const seller = topSellers[ctx.dataIndex];
            if (!seller) return formatCurrency(ctx.raw);
            return `${formatCurrency(ctx.raw)} • ${seller.count} vendas • Ticket: ${formatCurrency(seller.average_ticket)}`;
          },
        },
      },
    },
  }), [baseBarOptions, topSellers]);

  const chartFaturamentoPorLoja = useMemo(() => ({
    labels: revenueByStore.map((s) => (s.unity ? `${s.name} (${s.unity})` : s.name)),
    datasets: [{
      label: 'Faturamento',
      data: revenueByStore.map((s) => s.total),
      backgroundColor: 'rgba(220, 38, 38, 0.75)',
      borderColor: '#dc2626',
      borderWidth: 1,
      borderRadius: 6,
    }],
  }), [revenueByStore]);

  const chartTopVendedores = useMemo(() => {
    const rankColors = ['rgba(245, 158, 11, 0.85)', 'rgba(148, 163, 184, 0.85)', 'rgba(180, 83, 9, 0.85)'];
    const defaultColor = 'rgba(220, 38, 38, 0.75)';
    return {
      labels: topSellers.map((s) => s.name),
      datasets: [{
        label: 'Faturamento',
        data: topSellers.map((s) => s.total),
        backgroundColor: topSellers.map((_, i) => (i < 3 ? rankColors[i] : defaultColor)),
        borderColor: topSellers.map((_, i) => (i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#dc2626')),
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  }, [topSellers]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-gray-500 font-medium mt-1">Acompanhe o desempenho financeiro</p>
          {reportMonthLabel && (
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Relatório do mês de: {reportMonthLabel}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={!dashboardData || loading || exportingPdf}
          >
            {exportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            {exportingPdf ? 'Exportando…' : 'Exportar'}
          </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <MultiSelect
            label="Forma de pagamento"
            options={paymentMethodOptions}
            value={filterPaymentMethods}
            onChange={setFilterPaymentMethods}
            placeholder="Todas"
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
          {/* Totais por forma de pagamento: Crédito, Débito, Dinheiro, PIX e Permuta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <button
              type="button"
              onClick={() => goToOrdersByPaymentMethod('credit_card')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-blue-200 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartão Crédito</p>
                <p className="text-lg font-black text-blue-600 truncate">
                  {formatCurrency(dashboard?.revenue_by_payment_method?.credit_card ?? 0)}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => goToOrdersByPaymentMethod('debit_card')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-indigo-200 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartão Débito</p>
                <p className="text-lg font-black text-indigo-600 truncate">
                  {formatCurrency(dashboard?.revenue_by_payment_method?.debit_card ?? 0)}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => goToOrdersByPaymentMethod('cash')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-green-200 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-green-50 text-green-600 shrink-0">
                <Banknote size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dinheiro</p>
                <p className="text-lg font-black text-green-600 truncate">
                  {formatCurrency(dashboard?.revenue_by_payment_method?.cash ?? 0)}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => goToOrdersByPaymentMethod('pix')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-red-200 transition-all text-left"
            >
              <div 
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
              >
                <QrCode size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIX</p>
                <p className="text-lg font-black truncate" style={{ color: 'var(--store-color)' }}>
                  {formatCurrency(dashboard?.revenue_by_payment_method?.pix ?? 0)}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => goToOrdersByPaymentMethod('permuta')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-amber-200 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <RefreshCw size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permuta</p>
                <p className="text-lg font-black text-amber-600 truncate">
                  {formatCurrency(dashboard?.revenue_by_payment_method?.permuta ?? 0)}
                </p>
              </div>
            </button>
          </div>

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

            {/* Lucro (já desconta custos + despesas operacionais da loja) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp size={24} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {dashboard?.profit_margin ?? 0}% margem
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lucro operacional</p>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(dashboard?.profit ?? 0)}</p>
              {hasPermission('expenses-admin.list') && (
                <p className="text-xs text-slate-500 mt-2 leading-snug">
                  Após despesas administrativas:{' '}
                  <span className="font-bold text-slate-800">{formatCurrency(dashboard?.profit_after_administrative ?? dashboard?.profit ?? 0)}</span>
                  <span className="text-slate-400"> ({dashboard?.profit_margin_after_administrative ?? 0}% s/ faturamento)</span>
                </p>
              )}
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

          {/* Cards Secundários: retirada, inadimplência, despesas loja; + administrativas se tiver permissão */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
              hasPermission('expenses-admin.list') ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            }`}
          >
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

            {/* Despesas (valor conforme filtro de data/loja, mesmo estilo Inadimplências) */}
            <div 
              className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate('/finance/expenses')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                  <Receipt size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Despesas da loja</p>
              <p className="text-2xl font-black text-orange-600">{formatCurrency(dashboard?.expenses ?? 0)}</p>
              <p className="text-xs text-slate-500 mt-2">Operacionais • data do pagamento ou do cadastro</p>
            </div>

            {hasPermission('expenses-admin.list') && (
              <div
                className="bg-white p-6 rounded-2xl border border-violet-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate('/finance/admin-expenses')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-violet-50 text-violet-700">
                    <Briefcase size={24} />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Despesas administrativas</p>
                <p className="text-2xl font-black text-violet-700">{formatCurrency(dashboard?.administrative_expenses ?? 0)}</p>
                <p className="text-xs text-slate-500 mt-2">Gestão • clique para ver detalhes</p>
              </div>
            )}
          </div>

          {/* Faturamento por Loja e Top Vendedores (2 na linha, meio a meio) */}
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
                    <div className="max-h-[520px] overflow-y-auto overflow-x-hidden">
                      <div className="w-full" style={{ minHeight: 280, height: Math.max(280, revenueByStore.length * 44) }}>
                        <Bar
                          data={chartFaturamentoPorLoja}
                          options={optionsFaturamentoPorLoja}
                        />
                      </div>
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
                    <div className="max-h-[520px] overflow-y-auto overflow-x-hidden">
                      <div className="w-full" style={{ minHeight: 280, height: Math.max(280, topSellers.length * 44) }}>
                        <Bar
                          data={chartTopVendedores}
                          options={optionsTopVendedores}
                        />
                      </div>
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
