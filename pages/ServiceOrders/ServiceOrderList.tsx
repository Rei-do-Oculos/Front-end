import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, FileText, Building2, CheckCircle, XCircle, Eye, Printer } from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard, Badge } from '../../components/Common';
import { useServiceOrders } from '../../services/hooks/useServiceOrders';
import { usePlucks } from '../../services/hooks/usePlucks';
import { useClients } from '../../services/hooks/useClients';
import { ServiceOrder, serviceOrdersService, ServiceOrderStatus } from '../../services/api/serviceOrders';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../services/hooks/useAuth';
import { userHasAccessToStore } from '../../utils/storeAccess';
import {
  canShowNfeOptionInReceiptModal,
  nfeEligibilitySnapshotFromServiceOrder,
} from '../../utils/serviceOrderNfeEligibility';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ReceiptData } from '../../components/ThermalReceipt';
import { receiptPaymentLinesFromOrder } from '../../utils/receiptPaymentsFromOrder';
import { buildReceiptItemsFromOrder } from '../../utils/receiptItemsFromOrder';
import { usersService } from '../../services/api/users';
import { invoicesService } from '../../services/api/invoices';
import { storesService } from '../../services/api/stores';
import { ClientWhatsAppAvatar } from '../../components/ClientWhatsAppAvatar';

const STATUS_FALLBACK_LABEL: Record<ServiceOrderStatus, string> = {
  pending: 'Pendente',
  sent_to_lab: 'Enviado ao Lab',
  ready_for_pickup: 'Aguardando Retirada',
  completed: 'Finalizada',
  overdue: 'Inadimplente',
};

function statusBadgeVariant(apiColor?: string): 'primary' | 'danger' | 'success' | 'warning' | 'info' {
  const c = (apiColor || '').toLowerCase();
  if (c === 'danger') return 'danger';
  if (c === 'success') return 'success';
  if (c === 'warning') return 'warning';
  if (c === 'info') return 'info';
  return 'primary';
}

function normalizePayments(p: unknown): Array<{ payment_method?: string | null; amount?: number | string | null }> {
  if (!p) return [];
  if (Array.isArray(p)) return p.filter(Boolean);
  if (typeof p === 'object') return Object.values(p as Record<string, { payment_method?: string | null; amount?: number | string | null }>).filter(Boolean);
  return [];
}

function countOrderPayments(order: ServiceOrder): number {
  return normalizePayments((order as any).payments).length;
}

const PAID_AT_SALE_METHODS = new Set(['credit_card', 'debit_card', 'cash', 'pix', 'permuta']);
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Na retirada',
};

type PaymentBadgeResult = { label: string; variant: 'success' | 'warning' | 'info' | 'danger' };

/** Pagamento na retirada, pago no ato, garantia (sem cobrança registrada) ou indefinido. */
function orderPaymentBadge(order: ServiceOrder): PaymentBadgeResult | null {
  const payments = normalizePayments((order as any).payments);

  if (payments.length > 0) {
    const pickupRows = payments.filter((p) => p.payment_method === 'on_pickup');

    if (pickupRows.length > 0) {
      return { label: 'Parcial retirada', variant: 'danger' };
    }

    return { label: 'Pago', variant: 'success' };
  }

  if (order.payment_method === 'on_pickup') {
    return { label: 'Retirada', variant: 'warning' };
  }
  if (order.payment_method && PAID_AT_SALE_METHODS.has(order.payment_method)) {
    return { label: 'Pago', variant: 'success' };
  }
  const w = order.warranty;
  if (w != null && Number(w) > 0) {
    return { label: 'Garantia', variant: 'info' };
  }
  return null;
}

function orderPaymentMethodLabel(order: ServiceOrder): string {
  const methodsFromRows = normalizePayments((order as any).payments)
    .map((p) => String(p.payment_method || '').trim())
    .filter(Boolean);

  if (methodsFromRows.length > 0) {
    const unique = Array.from(new Set(methodsFromRows));
    if (unique.length === 1) {
      return PAYMENT_METHOD_LABELS[unique[0]] || unique[0];
    }
    return `Misto: ${unique.map((m) => PAYMENT_METHOD_LABELS[m] || m).join(' + ')}`;
  }

  const single = String(order.payment_method || '').trim();
  if (!single) return '—';
  return PAYMENT_METHOD_LABELS[single] || single;
}

export const ServiceOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { hasPermission, hasSuperAdminRole } = usePermission();
  const { availableStores, selectedStore } = useStore();
  const { serviceOrders, loading, error, pagination, totalSales, fetchServiceOrders, deleteServiceOrder } = useServiceOrders({
    autoFetch: false,
  });
  const { plucks: storesPlucks } = usePlucks({ service: storesService, autoFetch: true });
  const { plucks: usersPlucks } = usePlucks({ service: usersService, autoFetch: true });
  const { clients, fetchClients } = useClients({ autoFetch: false });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o modal de recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  /** Enquanto busca a OS na API antes de abrir o recibo (dados sempre atualizados). */
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [filterStore, setFilterStore] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterWarranty, setFilterWarranty] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDateField, setFilterDateField] = useState<'created_at' | 'payment_date'>('created_at');
  /** paid | on_pickup | '' — casos “—” na coluna Pagamento: use o filtro Garantia */
  const [filterPaymentSituation, setFilterPaymentSituation] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  // Filtros aplicados - só atualizados ao clicar em "Aplicar Filtros"
  const [appliedFilters, setAppliedFilters] = useState<{
    searchTerm: string;
    filterStore: string;
    filterUser: string;
    filterWarranty: string;
    filterDateFrom: string;
    filterDateTo: string;
    filterDateField: 'created_at' | 'payment_date';
    filterPaymentSituation: string;
    filterPaymentMethod: string;
  }>({
    searchTerm: '',
    filterStore: '',
    filterUser: '',
    filterWarranty: '',
    filterDateFrom: '',
    filterDateTo: '',
    filterDateField: 'created_at',
    filterPaymentSituation: '',
    filterPaymentMethod: '',
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  // Filtros ativos: contar os que estão aplicados (após clicar em Aplicar)
  const activeFilters = useActiveFilters({
    searchTerm: appliedFilters.searchTerm,
    filterStore: appliedFilters.filterStore,
    filterUser: appliedFilters.filterUser,
    filterWarranty: appliedFilters.filterWarranty,
    filterDateFrom: appliedFilters.filterDateFrom,
    filterDateTo: appliedFilters.filterDateTo,
    filterDateField: appliedFilters.filterDateField,
    filterPaymentSituation: appliedFilters.filterPaymentSituation,
    filterPaymentMethod: appliedFilters.filterPaymentMethod,
  });
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const buildParamsFromFilters = (f: typeof appliedFilters): Record<string, any> => {
    const params: Record<string, any> = {};
    if (f.searchTerm) params.search = f.searchTerm;
    if (f.filterStore) params.store_id = f.filterStore;
    else if (availableStores.length > 0) params.store_id = availableStores.map(s => s.id);
    if (f.filterUser) params.user_id = f.filterUser;
    if (f.filterWarranty) params.warranty = f.filterWarranty === 'true';
    if (f.filterDateFrom || f.filterDateTo) {
      params.date_from = f.filterDateFrom || undefined;
      params.date_to = f.filterDateTo || undefined;
      params.date_field = f.filterDateField || 'created_at';
    }
    if (f.filterPaymentSituation === 'paid' || f.filterPaymentSituation === 'on_pickup') {
      params.payment_situation = f.filterPaymentSituation;
    }
    if (f.filterPaymentMethod) {
      params.payment_method = [f.filterPaymentMethod];
    }
    return params;
  };

  // Prefill via URL (ex.: vindo do Fluxo de Caixa)
  useEffect(() => {
    const qStore = searchParams.get('store_id') || '';
    const qFrom = searchParams.get('date_from') || '';
    const qTo = searchParams.get('date_to') || '';
    const qDateField = (searchParams.get('date_field') || '').toLowerCase() === 'payment_date' ? 'payment_date' : 'created_at';
    const qMethod = searchParams.get('payment_method') || '';
    if (!qStore && !qFrom && !qTo && !qMethod && qDateField === 'created_at') return;

    const next = {
      searchTerm: '',
      filterStore: qStore,
      filterUser: '',
      filterWarranty: '',
      filterDateFrom: qFrom,
      filterDateTo: qTo,
      filterDateField: qDateField as 'created_at' | 'payment_date',
      filterPaymentSituation: '',
      filterPaymentMethod: qMethod,
    };

    setSearchTerm(next.searchTerm);
    setFilterStore(next.filterStore);
    setFilterUser(next.filterUser);
    setFilterWarranty(next.filterWarranty);
    setFilterDateFrom(next.filterDateFrom);
    setFilterDateTo(next.filterDateTo);
    setFilterDateField(next.filterDateField);
    setFilterPaymentSituation(next.filterPaymentSituation);
    setFilterPaymentMethod(next.filterPaymentMethod);
    setAppliedFilters(next);

    const params = buildParamsFromFilters(next);
    params.order_by = sortBy || 'created_at';
    params.order_dir = sortDirection || 'desc';
    params.per_page = perPage;
    fetchServiceOrders(1, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Carregar clientes para recibos
  useEffect(() => {
    fetchClients(1, { per_page: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar OS; refetch ao trocar de loja (API usa X-Store-ID / store_id)
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const params = buildParamsFromFilters(appliedFilters);
        params.order_by = sortBy || 'created_at';
        params.order_dir = sortDirection || 'desc';
        params.per_page = perPage;
        if (availableStores.length > 0 && !appliedFilters.filterStore) {
          params.store_id = availableStores.map(s => s.id);
        }
        await fetchServiceOrders(1, params);
      } catch (err) {
        console.error('Erro ao carregar ordens de serviço:', err);
      }
    };
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, availableStores, selectedStore?.id]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    const params = buildParamsFromFilters(appliedFilters);
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    fetchServiceOrders(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const next = {
        searchTerm,
        filterStore,
        filterUser,
        filterWarranty,
        filterDateFrom,
        filterDateTo,
        filterDateField,
        filterPaymentSituation,
        filterPaymentMethod,
      };
      setAppliedFilters(next);
      const params = buildParamsFromFilters(next);
      params.order_by = sortBy || 'created_at';
      params.order_dir = sortDirection || 'desc';
      params.per_page = perPage;
      await fetchServiceOrders(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchTerm('');
    setFilterStore('');
    setFilterUser('');
    setFilterWarranty('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateField('created_at');
    setFilterPaymentSituation('');
    setFilterPaymentMethod('');
    const empty = {
      searchTerm: '',
      filterStore: '',
      filterUser: '',
      filterWarranty: '',
      filterDateFrom: '',
      filterDateTo: '',
      filterDateField: 'created_at' as const,
      filterPaymentSituation: '',
      filterPaymentMethod: '',
    };
    setAppliedFilters(empty);
    try {
      const params = buildParamsFromFilters(empty);
      params.order_by = sortBy || 'created_at';
      params.order_dir = sortDirection || 'desc';
      params.per_page = perPage;
      await fetchServiceOrders(1, params);
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    try {
      const params = buildParamsFromFilters(appliedFilters);
      params.per_page = newPerPage;
      params.order_by = sortBy || 'created_at';
      params.order_dir = sortDirection || 'desc';
      await fetchServiceOrders(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleDeleteClick = (order: ServiceOrder) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const buildFetchParams = () => {
    const params = buildParamsFromFilters(appliedFilters);
    params.order_by = sortBy || 'created_at';
    params.order_dir = sortDirection || 'desc';
    params.per_page = perPage;
    return params;
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setDeleting(true);
    try {
      await deleteServiceOrder(String(orderToDelete.id));
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      showSuccess('Ordem de serviço excluída com sucesso!');
      await fetchServiceOrders(pagination.currentPage, buildFetchParams());
    } catch (err: any) {
      console.error('Erro ao excluir ordem de serviço:', err);
      showError(err.message || 'Erro ao excluir ordem de serviço');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatOsNumber = (osNumber: number) => {
    return String(osNumber).padStart(4, '0');
  };

  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];
  const safeUsersPlucks = Array.isArray(usersPlucks) ? usersPlucks : [];

  // Função para preparar dados do recibo
  const prepareReceiptData = (order: ServiceOrder): ReceiptData => {
    const storesForReceipt = safeStoresPlucks;
    const clientsList = Array.isArray(clients) ? clients : [];
    
    // Buscar dados da loja (plucks ou relation order.store)
    const storeFromPlucks = storesForReceipt.find((s: any) => s.id === order.store_id);
    const clientData = clientsList.find(c => c.id === order.client_id);
    
    const totalPrice = typeof order.price === 'number' ? order.price : parseFloat(String(order.price)) || 0;
    const payLines = receiptPaymentLinesFromOrder(order);
    const items = buildReceiptItemsFromOrder(order);
    
    const doctorName = String(order.doctor_name ?? '').trim();
    const doctorCrm = String(order.doctor_crm ?? '').trim();
    const prescriptionDate = order.prescription_date || null;

    return {
      osNumber: order.os_number,
      date: new Date(order.created_at).toLocaleString('pt-BR'),
      expectedPickupDate: order.expected_pickup_date || null,
      seller: order.user?.name || 'Vendedor',
      ...(doctorName && doctorCrm ? { doctorName, doctorCrm, ...(prescriptionDate ? { prescriptionDate } : {}) } : {}),
      store: {
        name: storeFromPlucks?.name || order.store?.name || 'Loja',
        fancy_name:
          order.store?.fancy_name
          || storeFromPlucks?.fancy_name
          || storeFromPlucks?.name
          || order.store?.name
          || 'Loja',
        receipt_header: order.store?.receipt_header ?? storeFromPlucks?.receipt_header ?? null,
        cnpj: order.store?.cnpj || '00.000.000/0000-00',
        ie: order.store?.ie ?? null,
        logradouro: order.store?.logradouro || '',
        numero: order.store?.numero || '',
        bairro: order.store?.bairro || '',
        municipio: order.store?.municipio || '',
        uf: order.store?.uf || '',
        telefone: order.store?.telefone ?? null,
        unity: order.store?.unity ?? null,
        logo: order.store?.logo ?? null,
        color: order.store?.color,
      },
      client: {
        name: clientData?.name || order.client?.name || 'Cliente',
        document: clientData?.document || order.client?.document || null,
      },
      prescription: {
        far_od_spherical: order.far_od_spherical,
        far_od_cylindrical: order.far_od_cylindrical,
        far_od_axis: order.far_od_axis,
        far_oe_spherical: order.far_oe_spherical,
        far_oe_cylindrical: order.far_oe_cylindrical,
        far_oe_axis: order.far_oe_axis,
        near_od_spherical: order.near_od_spherical,
        near_od_cylindrical: order.near_od_cylindrical,
        near_od_axis: order.near_od_axis,
        near_oe_spherical: order.near_oe_spherical,
        near_oe_cylindrical: order.near_oe_cylindrical,
        near_oe_axis: order.near_oe_axis,
        addition: order.addition,
        far_dnp: order.far_dnp,
        near_dnp: order.near_dnp,
      },
      items,
      total: totalPrice,
      paymentMethod: payLines.length > 0 ? null : (order.payment_method || null),
      installments: payLines.length > 0 ? null : (order.installments || null),
      payments: payLines.length > 0 ? payLines : undefined,
    };
  };

  // Recarrega a OS no servidor antes de montar o recibo (pagamento, preço, cliente, loja, etc.)
  const handlePrintClick = async (order: ServiceOrder) => {
    setPrintingOrderId(order.id);
    try {
      const fresh = await serviceOrdersService.getById(String(order.id));
      setOrderToPrint(fresh);
      setShowReceiptModal(true);
    } catch (err: any) {
      showError(
        'Não foi possível carregar a OS',
        err?.response?.data?.message || err?.message || 'Tente novamente.',
      );
    } finally {
      setPrintingOrderId(null);
    }
  };

  // Callback quando confirma no modal de recibo
  const handleReceiptConfirm = () => {
    setShowReceiptModal(false);
    setOrderToPrint(null);
  };

  // Emitir NFC-e ou NF-e ao imprimir pela lista (envia à Brasil NFe)
  const handleGenerateInvoice = async (modelo: 55 | 65, options?: { includeDocument?: boolean }): Promise<{ pdfBase64?: string; invoice?: import('../../services/api/invoices').Invoice } | null> => {
    if (!orderToPrint?.id) return null;
    const inv = await invoicesService.generateFromServiceOrder(
      String(orderToPrint.id), true, modelo, undefined, options?.includeDocument ?? false
    );
    return { pdfBase64: inv.pdf_base64 ?? undefined, invoice: inv };
  };

  const ordersList = Array.isArray(serviceOrders) ? serviceOrders : [];

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Pedidos (OS)</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie as ordens de serviço.</p>
          </div>
        </div>
        {hasPermission('service-orders.create') && (
          <Button onClick={() => navigate('/service-orders/create')}>
            <Plus size={18} /> Nova OS
          </Button>
        )}
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-6">
          <Input 
            label="Nº OS / Cliente" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Input 
            label="Data Início" 
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <Input 
            label="Data Fim" 
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
          <SingleSelect
            label="Tipo de data"
            value={filterDateField}
            onChange={(val) => setFilterDateField((val as 'created_at' | 'payment_date') || 'created_at')}
            options={[
              { value: 'created_at', label: 'Cadastro da OS' },
              { value: 'payment_date', label: 'Pagamento' },
            ]}
            placeholder="Cadastro da OS"
          />
        </div>
        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <SingleSelect
            label="Ótica"
            value={filterStore}
            onChange={(val) => setFilterStore(val)}
            options={safeStoresPlucks.map((s: any) => ({ value: String(s.id), label: s.name }))}
            placeholder="Todas as óticas"
          />
          <SingleSelect
            label="Vendedor"
            value={filterUser}
            onChange={(val) => setFilterUser(val)}
            options={safeUsersPlucks.map((u: any) => ({ value: String(u.id), label: u.name }))}
            placeholder="Todos"
          />
          <SingleSelect
            label="Garantia"
            value={filterWarranty}
            onChange={(val) => setFilterWarranty(val)}
            options={[
              { value: 'true', label: 'Sim' },
              { value: 'false', label: 'Não' },
            ]}
            placeholder="Todos"
          />
          <SingleSelect
            label="Pagamento"
            value={filterPaymentSituation}
            onChange={(val) => setFilterPaymentSituation(val)}
            options={[
              { value: 'paid', label: 'Pago' },
              { value: 'on_pickup', label: 'Retirada' },
            ]}
            placeholder="Todos"
          />
          <SingleSelect
            label="Forma pgto"
            value={filterPaymentMethod}
            onChange={(val) => setFilterPaymentMethod(val)}
            options={[
              { value: 'credit_card', label: 'Cartão de crédito' },
              { value: 'debit_card', label: 'Cartão de débito' },
              { value: 'cash', label: 'Dinheiro' },
              { value: 'pix', label: 'PIX' },
              { value: 'permuta', label: 'Permuta' },
              { value: 'on_pickup', label: 'Na retirada' },
            ]}
            placeholder="Todas"
          />
        </div>
      </FilterSection>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {pagination && (
            <p className="text-sm font-medium text-slate-600">
              {pagination.totalItems === 0 ? 'Nenhum resultado encontrado' : 
               pagination.totalItems === 1 ? '1 resultado encontrado' : 
               `${pagination.totalItems} resultados encontrados`}
            </p>
          )}
          {activeFilters > 0 && (
            <ActiveFiltersBadge count={activeFilters} />
          )}
          {!loading && activeFilters > 0 && (totalSales ?? 0) > 0 && (
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
              style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color-dark)' }}
            >
              <span>Total de suas vendas: {formatCurrency(totalSales ?? 0)}</span>
            </div>
          )}
        </div>
        {pagination && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Mostrar:
            </label>
            <select
              value={String(perPage)}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100">
                <SortableHeader
                  label="Nº"
                  sortKey="os_number"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Ótica</th>
                <SortableHeader
                  label="Preço"
                  sortKey="price"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Pagamento</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Registrado por</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Garantia</th>
                <SortableHeader
                  label="Cadastrado em"
                  sortKey="created_at"
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
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando ordens de serviço...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar ordens de serviço</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : ordersList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhuma ordem de serviço encontrada</span>
                  </td>
                </tr>
              ) : (
                ordersList.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                        {formatOsNumber(order.os_number)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ClientWhatsAppAvatar
                          phone={order.client?.phone}
                          clientName={order.client?.name}
                        />
                        <div>
                          <p 
                            className="text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                            onClick={() => order.client_id && navigate(`/clients/${order.client_id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            {order.client?.name || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.store ? (
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{order.store.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                      {formatCurrency(order.price || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadgeVariant(order.status_color)}>
                        {order.status_label || STATUS_FALLBACK_LABEL[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const pay = orderPaymentBadge(order);
                        return pay ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant={pay.variant}>{pay.label}</Badge>
                            <span className="text-[11px] text-slate-500">{orderPaymentMethodLabel(order)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={order.warranty ? 'success' : 'danger'}>
                        {order.warranty ? 'Sim' : 'Não'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('service-orders.read') && (
                          <button 
                            title="Visualizar OS"
                            onClick={() => navigate(`/service-orders/${order.id}`)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {hasPermission('service-orders.read') && (
                          <button 
                            type="button"
                            title="Imprimir Recibo"
                            disabled={printingOrderId !== null}
                            onClick={() => handlePrintClick(order)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all disabled:opacity-50 disabled:cursor-wait"
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            {printingOrderId === order.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Printer size={16} />
                            )}
                          </button>
                        )}
                        {hasPermission('service-orders.update') && !(order as any).is_other_store && (
                          <button 
                            title="Editar OS"
                            onClick={() => navigate(`/service-orders/${order.id}/edit`)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {hasPermission('service-orders.update') && (order as any).is_other_store && (
                          <button 
                            title="Não é possível editar OS de outra loja"
                            disabled
                            className="p-2 text-slate-200 cursor-not-allowed rounded-xl"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {hasPermission('service-orders.delete') && !(order as any).is_other_store && (order.status !== 'completed' || hasSuperAdminRole) && (
                          <button 
                            title="Excluir OS"
                            onClick={() => handleDeleteClick(order)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <Pagination
            pagination={pagination}
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            onPageChange={(page) => {
              const params = buildParamsFromFilters(appliedFilters);
              params.order_by = sortBy || 'created_at';
              params.order_dir = sortDirection || 'desc';
              params.per_page = perPage;
              fetchServiceOrders(page, params);
            }}
            itemName="ordens de serviço"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setOrderToDelete(null);
          }
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir a OS <strong>#{orderToDelete?.os_number}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setOrderToDelete(null);
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Excluir
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Recibo */}
      {showReceiptModal && orderToPrint && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setOrderToPrint(null);
          }}
          onConfirm={handleReceiptConfirm}
          onGenerateInvoice={handleGenerateInvoice}
          canGenerateInvoice={
            userHasAccessToStore(orderToPrint.store_id ?? orderToPrint.store?.id, user) &&
            canShowNfeOptionInReceiptModal(nfeEligibilitySnapshotFromServiceOrder(orderToPrint))
          }
          receiptData={prepareReceiptData(orderToPrint)}
          order={orderToPrint}
          clientPhone={(Array.isArray(clients) ? clients : []).find(c => c.id === orderToPrint.client_id)?.phone || (orderToPrint.client as any)?.phone}
        />
      )}
    </div>
  );
};
