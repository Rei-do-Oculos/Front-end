import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  Loader2,
  Filter,
  RefreshCw,
  CreditCard,
  Banknote,
  QrCode,
  Briefcase,
  ShoppingBag,
} from 'lucide-react';
import { Card, Button, Input, SingleSelect, MultiSelect, AccessDeniedCard } from '../../components/Common';
import {
  financeService,
  OperationalFinanceApiResponse,
  FinanceFilters,
} from '../../services/api/finance';

export const OperationalCashFlow: React.FC = () => {
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterPaymentMethods, setFilterPaymentMethods] = useState<string[]>([]);

  const [data, setData] = useState<OperationalFinanceApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const getCurrentMonthRange = useCallback(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: first.toISOString().split('T')[0],
      to: last.toISOString().split('T')[0],
    };
  }, []);

  useEffect(() => {
    const { from, to } = getCurrentMonthRange();
    setFilterDateFrom(from);
    setFilterDateTo(to);
  }, [getCurrentMonthRange]);

  const paymentMethodOptions = useMemo(
    () => [
      { value: 'credit_card', label: 'Cartão de Crédito' },
      { value: 'debit_card', label: 'Cartão de Débito' },
      { value: 'cash', label: 'Dinheiro' },
      { value: 'pix', label: 'PIX' },
      { value: 'permuta', label: 'Permuta' },
    ],
    []
  );

  const buildFilters = useCallback(
    (overrides?: { dateFrom?: string; dateTo?: string; storeId?: string; paymentMethods?: string[] }): FinanceFilters => {
      const filters: FinanceFilters = {};
      const dateFrom = overrides?.dateFrom ?? filterDateFrom;
      const dateTo = overrides?.dateTo ?? filterDateTo;
      const storeId = overrides?.storeId ?? filterStore;
      const paymentMethods = overrides?.paymentMethods ?? filterPaymentMethods;

      if (storeId) {
        filters.store_id = parseInt(storeId, 10);
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
      return filters;
    },
    [filterStore, filterDateFrom, filterDateTo, filterPaymentMethods]
  );

  const loadData = useCallback(
    async (overrides?: { dateFrom?: string; dateTo?: string; storeId?: string; paymentMethods?: string[] }) => {
      setLoading(true);
      setForbidden(false);
      try {
        const filters = buildFilters(overrides);
        const res = await financeService.getOperationalSummary(filters);
        setData(res);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setForbidden(true);
          return;
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [buildFilters]
  );

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const storeOptions = useMemo(() => {
    const list = data?.stores ?? [];
    return [
      { label: 'Todas as lojas permitidas', value: '' },
      ...list.map((store) => ({
        label: store.unity ? `${store.name} (${store.unity})` : store.name,
        value: String(store.id),
      })),
    ];
  }, [data?.stores]);

  const summary = data?.summary;
  const rpm = summary?.revenue_by_payment_method;

  if (forbidden) {
    return <AccessDeniedCard />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Faturamento operacional</h1>
          <p className="text-gray-500 font-medium mt-1">
            Faturamento e formas de pagamento das lojas do grupo.
          </p>
          {reportMonthLabel && (
            <p className="text-sm font-semibold text-slate-600 mt-1">Período (referência): {reportMonthLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleClearFilters}>
            <RefreshCw size={18} /> Limpar filtros
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} style={{ color: 'var(--store-color)' }} />
          <h3 className="text-sm font-bold text-slate-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SingleSelect label="Loja" options={storeOptions} value={filterStore} onChange={setFilterStore} />
          <Input
            label="Data inicial"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <Input
            label="Data final"
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
              Aplicar filtros
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
                >
                  <DollarSign size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Faturamento</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(summary?.revenue ?? 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShoppingBag size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de vendas</p>
              <p className="text-2xl font-black text-slate-900">{summary?.total_orders ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartão</p>
                <p className="text-lg font-black text-blue-600 truncate">
                  {formatCurrency((rpm?.credit_card ?? 0) + (rpm?.debit_card ?? 0))}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600 shrink-0">
                <Banknote size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dinheiro</p>
                <p className="text-lg font-black text-green-600 truncate">{formatCurrency(rpm?.cash ?? 0)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
              >
                <QrCode size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIX</p>
                <p className="text-lg font-black truncate" style={{ color: 'var(--store-color)' }}>
                  {formatCurrency(rpm?.pix ?? 0)}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permuta</p>
                <p className="text-lg font-black text-amber-600 truncate">{formatCurrency(rpm?.permuta ?? 0)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
