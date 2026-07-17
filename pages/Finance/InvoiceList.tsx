import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  Download,
  Printer,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, ActiveFiltersBadge, Pagination, Badge, SortableHeader, SortDirection } from '../../components/Common';
import { usePlucks } from '../../services/hooks/usePlucks';
import { usePermission } from '../../services/hooks/usePermission';
import { storesService } from '../../services/api/stores';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useNotification } from '../../hooks/useNotification';
import { invoicesService, type Invoice as ApiInvoice } from '../../services/api/invoices';
import { invoiceToNFCeData, buildReciboHtml } from '../../utils/nfceCupom';
import { useStore } from '../../contexts/StoreContext';
import { ClientWhatsAppAvatar } from '../../components/ClientWhatsAppAvatar';
import { useBackToList } from '../../hooks/useBackToList';
import { useListUrlState } from '../../hooks/useListUrlState';

const statusToLabel: Record<string, string> = {
  authorized: 'Autorizada',
  pending_transmission: 'Aguardando transmissão',
  pending: 'Pendente',
  rejected: 'Rejeitada',
  denied: 'Denegada',
  cancelled: 'Cancelada',
};

const mapStatusFilterToApi = (statusFilter: string): string | undefined => {
  switch (statusFilter) {
    case 'Autorizada': return 'authorized';
    case 'Aguardando transmissão': return 'pending_transmission';
    case 'Cancelada': return 'cancelled';
    case 'Pendente': return 'pending';
    case 'Rejeitada': return 'rejected';
    default: return undefined;
  }
};

const paymentLabel: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Pagamento na Retirada',
};

const formatCpf = (doc: string | undefined | null): string => {
  if (!doc) return '—';
  const n = doc.replace(/\D/g, '');
  if (n.length !== 11) return doc;
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/** Obtém tipo da nota pela chave (pos 20-21: 55=NF-e, 65=NFC-e). */
function getInvoiceType(accessKey: string | null | undefined): 'NFC-e' | 'NF-e' {
  if (!accessKey || accessKey.length < 22) return 'NF-e';
  const modelo = accessKey.slice(20, 22);
  return modelo === '65' ? 'NFC-e' : 'NF-e';
}

function mapApiInvoiceToRow(inv: ApiInvoice) {
  const client = inv.service_order?.client;
  const firstPayment = inv.payments?.[0];
  const date = inv.emission_date ? new Date(inv.emission_date) : new Date(inv.created_at);
  const accessKey = inv.access_key || '';
  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    series: inv.series,
    invoiceType: getInvoiceType(accessKey),
    osNumber: String(inv.service_order?.os_number ?? inv.service_order_id),
    serviceOrderId: inv.service_order_id,
    client: client?.name || '—',
    clientCpf: formatCpf(client?.document),
    clientPhone: client?.phone || null,
    dateTime: `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    value: Number(inv.total_value) || 0,
    status: statusToLabel[inv.status] || inv.status,
    statusRaw: inv.status,
    storeId: inv.store_id,
    storeName: inv.store?.name || '—',
    accessKey,
    paymentMethod: firstPayment ? paymentLabel[firstPayment.payment_method] || firstPayment.payment_method : '—',
    isDevolucao: Boolean(inv.original_invoice_id),
  };
}

export const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { buildReturnTo } = useBackToList();
  const { getString, getNumber, setUrlState } = useListUrlState();
  const { showSuccess, showError } = useNotification();
  const { hasSuperAdminRole, hasPermission } = usePermission();
  const { selectedStore } = useStore();
  /** Só não-superadmin: lista/stats vêm da loja do header (X-Store-ID); precisa refetch ao trocar unidade. */
  const listStoreContextId = hasSuperAdminRole ? null : selectedStore?.id ?? null;
  const [invoices, setInvoices] = useState<ReturnType<typeof mapApiInvoiceToRow>[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, total_pages: 1, total_items: 0, per_page: 15 });
  const [stats, setStats] = useState({
    month: { count: 0, value: 0 },
    total: { count: 0, value: 0 },
    nfeCount: 0,
    nfceCount: 0,
  });
  const [loading, setLoading] = useState(true);
  // Filtros em edição (valores nos inputs)
  const [searchTerm, setSearchTerm] = useState(() => getString('search'));
  const [statusFilter, setStatusFilter] = useState(() => getString('status'));
  const [tipoFilter, setTipoFilter] = useState(() => getString('tipo'));
  const [storeFilter, setStoreFilter] = useState(() => getString('store_id'));
  const [dateFromFilter, setDateFromFilter] = useState(() => getString('date_from'));
  const [dateToFilter, setDateToFilter] = useState(() => getString('date_to'));
  const [invoiceNumbersFilter, setInvoiceNumbersFilter] = useState(() => getString('invoice_number'));
  // Filtros aplicados (só atualizados ao clicar em "Aplicar Filtros")
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: getString('search'),
    statusFilter: getString('status'),
    tipoFilter: getString('tipo'),
    storeFilter: getString('store_id'),
    dateFromFilter: getString('date_from'),
    dateToFilter: getString('date_to'),
    invoiceNumbersFilter: getString('invoice_number'),
  });
  const [sortBy, setSortBy] = useState<string | null>(() => getString('sort_by', 'created_at'));
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => getString('sort_dir', 'desc') as SortDirection);
  const [currentPage, setCurrentPage] = useState(() => getNumber('page', 1));
  const [perPage, setPerPage] = useState(() => getNumber('per_page', 15));

  const { plucks: storesPlucks } = usePlucks({ service: storesService, autoFetch: true });
  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];

  const activeFilters = useActiveFilters({
    searchTerm: appliedFilters.searchTerm,
    statusFilter: appliedFilters.statusFilter,
    tipoFilter: appliedFilters.tipoFilter,
    storeFilter: hasSuperAdminRole ? appliedFilters.storeFilter : '',
    dateFromFilter: appliedFilters.dateFromFilter,
    dateToFilter: appliedFilters.dateToFilter,
    invoiceNumbersFilter: appliedFilters.invoiceNumbersFilter,
  });

  const fetchList = useCallback(() => {
    const a = appliedFilters;
    const statusApi = mapStatusFilterToApi(a.statusFilter);
    setLoading(true);
    invoicesService
      .list({
        page: currentPage,
        per_page: perPage,
        search: a.searchTerm || undefined,
        status: statusApi,
        tipo: a.tipoFilter === 'NF-e' ? 'nfe' : a.tipoFilter === 'NFC-e' ? 'nfce' : undefined,
        store_id: hasSuperAdminRole ? (a.storeFilter || undefined) : undefined,
        date_from: a.dateFromFilter || undefined,
        date_to: a.dateToFilter || undefined,
        invoice_number: a.invoiceNumbersFilter?.trim() || undefined,
        order_by: sortBy || 'created_at',
        order_dir: sortDirection,
      })
      .then(({ invoices: list, meta: m }) => {
        const arr = Array.isArray(list) ? list : (list ? Object.values(list) : []);
        setInvoices(arr.map(mapApiInvoiceToRow));
        setMeta(m);
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [currentPage, perPage, appliedFilters, sortBy, sortDirection, hasSuperAdminRole, listStoreContextId]);

  const fetchStats = useCallback(() => {
    const a = appliedFilters;
    const statusApi = mapStatusFilterToApi(a.statusFilter);
    const params = {
      store_id: hasSuperAdminRole && a.storeFilter ? Number(a.storeFilter) : undefined,
      status: statusApi,
      tipo: a.tipoFilter === 'NF-e' ? 'nfe' as const : a.tipoFilter === 'NFC-e' ? 'nfce' as const : undefined,
      date_from: a.dateFromFilter || undefined,
      date_to: a.dateToFilter || undefined,
    };
    const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    invoicesService
      .stats(Object.keys(cleanParams).length ? cleanParams : undefined)
      .then((s) => {
        setStats({
          month: { count: s.month_count, value: s.month_value },
          total: { count: s.total_count, value: s.total_value },
          nfeCount: s.nfe_count ?? 0,
          nfceCount: s.nfce_count ?? 0,
        });
      })
      .catch(() => {});
  }, [appliedFilters, hasSuperAdminRole, listStoreContextId]);

  useEffect(() => {
    if (hasSuperAdminRole) return;
    setCurrentPage(1);
  }, [listStoreContextId, hasSuperAdminRole]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setUrlState({
      search: appliedFilters.searchTerm,
      status: appliedFilters.statusFilter,
      tipo: appliedFilters.tipoFilter,
      store_id: appliedFilters.storeFilter,
      date_from: appliedFilters.dateFromFilter,
      date_to: appliedFilters.dateToFilter,
      invoice_number: appliedFilters.invoiceNumbersFilter,
      sort_by: sortBy || 'created_at',
      sort_dir: sortDirection,
      page: currentPage,
      per_page: perPage,
    });
  }, [appliedFilters, sortBy, sortDirection, currentPage, perPage, setUrlState]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Autorizada': return 'success';
      case 'Cancelada': return 'danger';
      case 'Rejeitada': return 'danger';
      case 'Pendente':
      case 'Aguardando transmissão':
        return 'warning';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Autorizada': return <CheckCircle2 size={14} />;
      case 'Cancelada': return <XCircle size={14} />;
      case 'Rejeitada': return <XCircle size={14} />;
      case 'Pendente':
      case 'Aguardando transmissão':
        return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleSort = (key: string, direction: SortDirection) => {
    const apiKey = key === 'date' ? 'created_at' : key === 'value' ? 'total_value' : key === 'invoiceNumber' ? 'invoice_number' : key === 'client' ? 'created_at' : key === 'status' ? 'status' : 'created_at';
    setSortBy(apiKey);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm,
      statusFilter,
      tipoFilter,
      storeFilter,
      dateFromFilter,
      dateToFilter,
      invoiceNumbersFilter,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTipoFilter('');
    setStoreFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setInvoiceNumbersFilter('');
    setAppliedFilters({
      searchTerm: '',
      statusFilter: '',
      tipoFilter: '',
      storeFilter: '',
      dateFromFilter: '',
      dateToFilter: '',
      invoiceNumbersFilter: '',
    });
    setCurrentPage(1);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleDownloadXML = async (invoice: ReturnType<typeof mapApiInvoiceToRow>) => {
    try {
      const blob = await invoicesService.downloadXml(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NF-e-${invoice.invoiceNumber}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Download', 'XML baixado.');
    } catch (e: any) {
      showError('Erro ao baixar XML', e.message || 'Tente novamente.');
    }
  };

  const handlePrintInvoice = async (invoice: ReturnType<typeof mapApiInvoiceToRow>) => {
    const docLabel = invoice.invoiceType;
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) {
      showError('Impressão', 'Permita popups para imprimir.');
      return;
    }
    try {
      const inv = await invoicesService.getById(String(invoice.id));
      const reciboData = invoiceToNFCeData(inv);
      if (!reciboData) {
        showError('Impressão', 'Dados da nota incompletos para montar recibo.');
        printWindow.close();
        return;
      }
      const html = buildReciboHtml(reciboData, docLabel as 'NF-e' | 'NFC-e');
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.document.body?.offsetHeight;
      setTimeout(() => { printWindow.print(); printWindow.close(); showSuccess('Impressão', `Recibo ${docLabel} aberto para impressão.`); }, 400);
    } catch (e: any) {
      showError('Erro ao imprimir', e.message || 'Tente novamente.');
      printWindow.close();
    }
  };

  const [exportXmlLoading, setExportXmlLoading] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportXmlZip = async (format: 'zip' | 'rar') => {
    setExportMenuOpen(false);
    const filters = {
      searchTerm,
      statusFilter,
      tipoFilter,
      storeFilter,
      dateFromFilter,
      dateToFilter,
      invoiceNumbersFilter,
    };
    const statusApi = mapStatusFilterToApi(filters.statusFilter);
    setExportXmlLoading(true);
    try {
      const { blob, filename } = await invoicesService.downloadXmlZip({
        search: filters.searchTerm || undefined,
        status: statusApi,
        tipo: filters.tipoFilter === 'NF-e' ? 'nfe' : filters.tipoFilter === 'NFC-e' ? 'nfce' : undefined,
        store_id: hasSuperAdminRole ? (filters.storeFilter || undefined) : undefined,
        date_from: filters.dateFromFilter || undefined,
        date_to: filters.dateToFilter || undefined,
        invoice_number: filters.invoiceNumbersFilter?.trim() || undefined,
        order_by: sortBy || 'created_at',
        order_dir: sortDirection,
        format,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Exportar XML', `${format === 'rar' ? 'RAR' : 'ZIP'} com os XMLs baixado.`);
    } catch (e: any) {
      let msg = e?.message || 'Nenhuma NF-e autorizada com XML disponível para os filtros.';
      if (e?.response?.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const j = JSON.parse(text);
          msg = j?.data?.errors?.message ?? j?.data?.message ?? msg;
        } catch {
          // mantém msg padrão
        }
      } else if (e?.response?.data?.data?.errors?.message) {
        msg = e.response.data.data.errors.message;
      }
      showError('Erro ao exportar XML', msg);
    } finally {
      setExportXmlLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
            <FileText size={28} style={{ color: 'var(--store-color)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Notas Fiscais Eletrônicas</h1>
            <p className="text-gray-500 font-medium mt-1">Fiscal • Emissão • Controle</p>
          </div>
        </div>
        {hasPermission('invoices.export.xml') && (
          <div className="relative" ref={exportMenuRef}>
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600 bg-white"
              onClick={() => setExportMenuOpen((open) => !open)}
              disabled={exportXmlLoading}
              title={hasSuperAdminRole ? 'Exporta as NF-e autorizadas conforme os filtros (geral ou por loja). Loja: apenas da própria unidade.' : 'Exporta as NF-e autorizadas da sua loja conforme período, status e tipo.'}
            >
              {exportXmlLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {exportXmlLoading ? 'Exportando...' : 'Exportar XML'}
              <ChevronDown size={16} className={`ml-1 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => handleExportXmlZip('zip')}
                  disabled={exportXmlLoading}
                >
                  <Download size={16} className="text-slate-500" />
                  Exportar como ZIP
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => handleExportXmlZip('rar')}
                  disabled={exportXmlLoading}
                >
                  <Download size={16} className="text-slate-500" />
                  Exportar como RAR
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mês Atual</p>
              <p className="text-2xl font-black text-slate-900">{stats.month.count}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{formatCurrency(stats.month.value)}</p>
              {stats.nfeCount > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.nfeCount > 0 && `${stats.nfeCount} NF-e`}
                  <span className="text-slate-400"> (autorizadas)</span>
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notas emitidas</p>
              <p className="text-2xl font-black text-slate-900">{stats.nfeCount}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">autorizadas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.total.value)}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{stats.total.count}</p>
              {stats.nfeCount > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.nfeCount > 0 && `${stats.nfeCount} NF-e`}
                  <span className="text-slate-400"> (autorizadas)</span>
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <DollarSign size={24} className="text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <div className="col-span-full lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Input 
              label="Números da nota"
              placeholder="134, 135, 185"
              value={invoiceNumbersFilter}
              onChange={(e) => setInvoiceNumbersFilter(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">Separe por vírgula, ponto e vírgula ou espaço.</p>
          </div>
          <Input 
            label="Buscar" 
            placeholder="OS, Cliente ou Chave de Acesso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SingleSelect
            label="Status"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Todos' },
              { value: 'Autorizada', label: 'Autorizada' },
              { value: 'Aguardando transmissão', label: 'Aguardando transmissão' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Cancelada', label: 'Cancelada' },
              { value: 'Rejeitada', label: 'Rejeitada' },
            ]}
            placeholder="Todos"
          />
          <SingleSelect
            label="Tipo"
            value={tipoFilter}
            onChange={(val) => setTipoFilter(val)}
            options={[
              { value: '', label: 'Todos' },
              { value: 'NF-e', label: 'NF-e' },
              { value: 'NFC-e', label: 'NFC-e' },
            ]}
            placeholder="Todos"
          />
          {hasSuperAdminRole && (
            <SingleSelect
              label="Unidade"
              value={storeFilter}
              onChange={(val) => setStoreFilter(val)}
              options={[
                { value: '', label: 'Todas' },
                ...safeStoresPlucks.map((store: any) => ({ 
                  value: String(store.id), 
                  label: store.name 
                })),
              ]}
              placeholder="Todas"
            />
          )}
        </div>
        <div className="col-span-full lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Data Início" 
            type="date"
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
          />
          <Input 
            label="Data Fim" 
            type="date"
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
          />
        </div>
      </FilterSection>

      {/* Contagem de resultados */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-slate-400" />
          ) : (
            <p className="text-sm font-medium text-slate-600">
              {meta.total_items === 0 ? 'Nenhum resultado encontrado' :
                meta.total_items === 1 ? '1 resultado encontrado' :
                  `${meta.total_items} resultados encontrados`}
            </p>
          )}
          {activeFilters > 0 && (
            <ActiveFiltersBadge count={activeFilters} />
          )}
        </div>
      </div>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <SortableHeader
                  label="NF-e / Série"
                  sortKey="invoiceNumber"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">OS</th>
                <SortableHeader
                  label="Cliente"
                  sortKey="client"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Data / Hora"
                  sortKey="date"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Valor"
                  sortKey="value"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 size={32} className="animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={40} className="text-slate-400" />
                      <span className="text-sm text-slate-500">Nenhuma nota fiscal encontrada</span>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">#{invoice.invoiceNumber}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {invoice.invoiceType} • Série {invoice.series}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-600" title={`Loja emitente (CNPJ diferente por unidade)`}>
                        {invoice.storeName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/service-orders/${invoice.serviceOrderId}`, { state: { returnTo: buildReturnTo() } })}
                        className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
                      >
                        OS #{invoice.osNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ClientWhatsAppAvatar
                          phone={invoice.clientPhone}
                          clientName={invoice.client}
                        />
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-red-600 transition-colors">{invoice.client}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{invoice.clientCpf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar size={12} /> {invoice.dateTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{formatCurrency(invoice.value)}</span>
                        <span className="text-[9px] font-bold text-slate-500 mt-1">{invoice.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(invoice.status)} className="flex items-center gap-1.5 w-fit">
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                        {invoice.isDevolucao && (
                          <Badge variant="info" className="text-[10px] font-semibold uppercase tracking-wide">
                            Devolução
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Visualizar NF-e"
                          onClick={() => navigate(`/invoices/${invoice.id}`, { state: { returnTo: buildReturnTo() } })}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Download XML"
                          onClick={() => invoice.statusRaw === 'authorized' && handleDownloadXML(invoice)}
                          disabled={invoice.statusRaw !== 'authorized'}
                          className="p-2 rounded-xl shadow-sm border border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-slate-400 hover:text-blue-600 hover:bg-white hover:border-slate-100"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          title={`Imprimir ${invoice.invoiceType}`}
                          onClick={() => invoice.statusRaw === 'authorized' && handlePrintInvoice(invoice)}
                          disabled={invoice.statusRaw !== 'authorized'}
                          className="p-2 rounded-xl shadow-sm border border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-100"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {meta.total_pages > 1 && (
          <Pagination
            pagination={{
              currentPage: meta.current_page,
              totalPages: meta.total_pages,
              totalItems: meta.total_items,
              perPage: meta.per_page,
            }}
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            onPageChange={(page) => setCurrentPage(page)}
            itemName="notas fiscais"
          />
        )}
      </Card>
    </div>
  );
};
