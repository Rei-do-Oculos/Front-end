import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, FileDown, Phone, Building2, Eye, CheckCircle, X, Check } from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard, Badge } from '../../components/Common';
import { useServiceOrders } from '../../services/hooks/useServiceOrders';
import { usePlucks } from '../../services/hooks/usePlucks';
import { storesService } from '../../services/api/stores';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ReceiptData } from '../../components/ThermalReceipt';
import { receiptPaymentLinesFromOrder } from '../../utils/receiptPaymentsFromOrder';
import { buildReceiptItemsFromOrder } from '../../utils/receiptItemsFromOrder';
import { useAuth } from '../../services/hooks/useAuth';
import { userHasAccessToStore } from '../../utils/storeAccess';
import {
  canShowNfeOptionInReceiptModal,
  hasPickupPaymentPending,
  nfeEligibilitySnapshotFromServiceOrder,
} from '../../utils/serviceOrderNfeEligibility';
import { ClientWhatsAppAvatar } from '../../components/ClientWhatsAppAvatar';
import { invoicesService } from '../../services/api/invoices';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import { generateInadimplenciasReportPdf } from '../../utils/inadimplenciasReportPdf';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : (import.meta.env.VITE_API_URL || '').replace(/\/api(\/.*)?$/, '') || window.location.origin;
const buildLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/')) return `${API_BASE}${logoPath}`;
  const path = logoPath.startsWith('storage/') ? logoPath : `storage/${logoPath}`;
  return import.meta.env.DEV ? `/${path}` : `${API_BASE}/${path}`;
};

export const Inadimplencias: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { availableStores, selectedStore, storeColor, storeLogo } = useStore();
  const { user } = useAuth();
  const { 
    actionLoading, 
    error, 
    fetchOverdueOrders,
    markCompleted,
    setOverdueInactive,
  } = useServiceOrders({ autoFetch: false });
  
  // Usar usePlucks para trazer todas as lojas que o usuário tem acesso
  const { plucks: storesPlucks } = usePlucks({
    service: storesService,
    autoFetch: true,
  });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  /** Soma do valor ainda na retirada (API total_sales; com parcial, não é mais o preço integral). */
  const [totalOverdueValue, setTotalOverdueValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState<string | null>('arrived_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [perPage, setPerPage] = useState<number>(15);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [filterOverdueStatus, setFilterOverdueStatus] = useState<'active' | 'inactive' | 'all'>('all');
  const [togglingInactiveId, setTogglingInactiveId] = useState<number | null>(null);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [orderForInactive, setOrderForInactive] = useState<ServiceOrder | null>(null);

  // Modal de confirmação de retirada
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [orderToAction, setOrderToAction] = useState<ServiceOrder | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Modal de recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ServiceOrder | null>(null);

  const [appliedFilters, setAppliedFilters] = useState<{
    searchTerm: string;
    filterStore: string;
    filterDateFrom: string;
    filterDateTo: string;
    overdueStatus: 'active' | 'inactive' | 'all';
  }>({ searchTerm: '', filterStore: '', filterDateFrom: '', filterDateTo: '', overdueStatus: 'all' });

  const activeFilters = useActiveFilters({
    searchTerm: appliedFilters.searchTerm,
    filterStore: appliedFilters.filterStore,
    filterDateFrom: appliedFilters.filterDateFrom,
    filterDateTo: appliedFilters.filterDateTo,
    overdueStatusNonDefault: appliedFilters.overdueStatus !== 'all',
  });

  // Garantir que storesPlucks seja sempre um array
  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];

  // Carregar OS inadimplentes
  const loadOrders = useCallback(async (page = 1, params: any = {}) => {
    setIsLoading(true);
    try {
      const finalParams: any = {
        ...params,
        order_by: params.order_by || sortBy || 'arrived_at',
        order_dir: params.order_dir || sortDirection || 'asc',
        per_page: params.per_page || perPage,
      };
      
      // Filtrar apenas pelas lojas que o usuário tem acesso
      if (availableStores.length > 0 && !params.store_id) {
        finalParams.store_id = availableStores.map(s => s.id);
      }
      if (finalParams.overdue_metrics_status == null) {
        finalParams.overdue_metrics_status = appliedFilters.overdueStatus;
      }

      const result = await fetchOverdueOrders({ page, ...finalParams });
      setServiceOrders(result.data);
      setPagination(result.meta);
      setTotalOverdueValue(result.totalSales ?? 0);
    } catch (err) {
      console.error('Erro ao carregar ordens de serviço:', err);
      setTotalOverdueValue(0);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOverdueOrders, availableStores, selectedStore?.id, sortBy, sortDirection, perPage, appliedFilters]);

  const buildFilterParams = (f: typeof appliedFilters) => {
    const params: any = {};
    if (f.searchTerm) params.search = f.searchTerm;
    if (f.filterStore) params.store_id = f.filterStore;
    if (f.filterDateFrom) params.date_from = f.filterDateFrom;
    if (f.filterDateTo) params.date_to = f.filterDateTo;
    params.overdue_metrics_status = f.overdueStatus ?? 'all';
    return params;
  };

  useEffect(() => {
    const params = buildFilterParams(appliedFilters);
    params.order_by = sortBy || 'arrived_at';
    params.order_dir = sortDirection || 'asc';
    params.per_page = perPage;
    loadOrders(1, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, sortBy, sortDirection, perPage, selectedStore?.id]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    const params = buildFilterParams(appliedFilters);
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    loadOrders(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    const next = { searchTerm, filterStore, filterDateFrom, filterDateTo, overdueStatus: filterOverdueStatus };
    setAppliedFilters(next);
    const params = buildFilterParams(next);
    params.order_by = sortBy || 'arrived_at';
    params.order_dir = sortDirection || 'asc';
    params.per_page = perPage;
    await loadOrders(1, params);
  };

  const handleClearFilters = async () => {
    setSearchTerm('');
    setFilterStore('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterOverdueStatus('all');
    setAppliedFilters({ searchTerm: '', filterStore: '', filterDateFrom: '', filterDateTo: '', overdueStatus: 'all' });
    await loadOrders(1, {
      order_by: sortBy || 'arrived_at',
      order_dir: sortDirection || 'asc',
      per_page: perPage,
      overdue_metrics_status: 'all',
    });
  };

  const handleExportPdf = async () => {
    if (!hasPermission('service-orders-overdue.export')) return;
    setExportingPdf(true);
    try {
      const params: Record<string, unknown> = {
        order_by: sortBy || 'arrived_at',
        order_dir: sortDirection || 'asc',
      };
      const f = appliedFilters;
      if (f.searchTerm) params.search = f.searchTerm;
      if (f.filterStore) params.store_id = f.filterStore;
      if (f.filterDateFrom) params.date_from = f.filterDateFrom;
      if (f.filterDateTo) params.date_to = f.filterDateTo;
      if (availableStores.length > 0 && !params.store_id) {
        params.store_id = availableStores.map((s) => s.id);
      }
      params.overdue_metrics_status = f.overdueStatus ?? 'all';

      const { orders, totalSales } = await serviceOrdersService.getOverdueReport(params as any);
      const storeFilterLabel = f.filterStore
        ? (safeStoresPlucks.find((s: { id: number | string }) => String(s.id) === f.filterStore)?.name as string | undefined) ?? null
        : null;

      const overdueStatusLabels: Record<string, string> = {
        all: 'Todas (ativas e inativas)',
        active: 'Só ativas (nos totais do sistema)',
        inactive: 'Só inativas (fora dos totais)',
      };

      await generateInadimplenciasReportPdf({
        orders,
        totalSales,
        dateFrom: f.filterDateFrom || undefined,
        dateTo: f.filterDateTo || undefined,
        storeFilterLabel,
        searchTerm: f.searchTerm || undefined,
        overdueStatusLabel: overdueStatusLabels[f.overdueStatus] ?? overdueStatusLabels.all,
        storeData: selectedStore
          ? {
              name: selectedStore.name,
              fancy_name: selectedStore.fancy_name,
              color: selectedStore.color,
              logo: selectedStore.logo,
            }
          : null,
        storeColor,
        storeLogo,
        logoUrlBuilder: buildLogoUrl,
      });
      showSuccess('PDF gerado com sucesso!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar PDF';
      showError(message);
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    const params = buildFilterParams(appliedFilters);
    params.per_page = newPerPage;
    params.order_by = sortBy || 'arrived_at';
    params.order_dir = sortDirection || 'asc';
    await loadOrders(1, params);
  };

  const handleActionClick = (order: ServiceOrder) => {
    if (hasPickupPaymentPending(nfeEligibilitySnapshotFromServiceOrder(order))) {
      navigate(`/service-orders/${order.id}/change-payment`);
      return;
    }
    setOrderToAction(order);
    setActionModalOpen(true);
  };

  const handleOpenInactiveModal = (order: ServiceOrder) => {
    setOrderForInactive(order);
    setInactiveModalOpen(true);
  };

  const handleConfirmInactiveToggle = async () => {
    if (!orderForInactive) return;
    const order = orderForInactive;
    const next = !order.overdue_inactive;
    setTogglingInactiveId(order.id);
    try {
      const result = await setOverdueInactive(String(order.id), next);
      if (result?.success) {
        showSuccess(result.message);
        setInactiveModalOpen(false);
        setOrderForInactive(null);
        const params = buildFilterParams(appliedFilters);
        params.order_by = sortBy || 'arrived_at';
        params.order_dir = sortDirection || 'asc';
        params.per_page = perPage;
        await loadOrders(pagination?.currentPage || 1, params);
      } else {
        showError(result?.message || 'Não foi possível atualizar');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar';
      showError(message);
    } finally {
      setTogglingInactiveId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!orderToAction) return;

    setProcessing(true);
    try {
      const result = await markCompleted(String(orderToAction.id));
      
      if (result?.success) {
        showSuccess(result.message);
        setActionModalOpen(false);
        
        // Abrir modal de recibo
        setCompletedOrder(orderToAction);
        setShowReceiptModal(true);
        
        setOrderToAction(null);
        // Recarregar lista
        await loadOrders(pagination?.currentPage || 1, {
          ...buildFilterParams(appliedFilters),
          per_page: perPage,
          order_by: sortBy || 'arrived_at',
          order_dir: sortDirection || 'asc',
        });
      } else {
        showError(result?.message || 'Erro ao processar ação');
      }
    } catch (err: any) {
      console.error('Erro ao processar ação:', err);
      showError(err.message || 'Erro ao processar ação');
    } finally {
      setProcessing(false);
    }
  };

  // Preparar dados do recibo
  const prepareReceiptData = (order: ServiceOrder): ReceiptData => {
    const storeData = safeStoresPlucks.find((s: any) => s.id === order.store_id) || order.store;
    const clientData = order.client;
    const totalPrice = order.price || 0;
    const payLines = receiptPaymentLinesFromOrder(order);

    const items = buildReceiptItemsFromOrder(order);
    
    const doctorName = String(order.doctor_name ?? '').trim();
    const doctorCrm = String(order.doctor_crm ?? '').trim();
    const prescriptionDate = order.prescription_date || null;

    return {
      osNumber: order.os_number,
      date: new Date().toLocaleString('pt-BR'),
      expectedPickupDate: order.expected_pickup_date || null,
      seller: user?.name || order.user?.name || 'Vendedor',
      ...(doctorName && doctorCrm ? { doctorName, doctorCrm, ...(prescriptionDate ? { prescriptionDate } : {}) } : {}),
      store: {
        name: storeData?.name || 'Loja',
        fancy_name: storeData?.fancy_name || storeData?.name || 'Loja',
        receipt_header: storeData?.receipt_header ?? (order.store as any)?.receipt_header ?? null,
        cnpj: storeData?.cnpj || '00.000.000/0000-00',
        ie: storeData?.ie || null,
        logradouro: storeData?.logradouro || '',
        numero: storeData?.numero || '',
        bairro: storeData?.bairro || '',
        municipio: storeData?.municipio || '',
        uf: storeData?.uf || '',
        telefone: storeData?.telefone || null,
        unity: (storeData as any)?.unity ?? (order.store as any)?.unity ?? null,
        logo: (storeData as any)?.logo ?? (order.store as any)?.logo ?? null,
      },
      client: {
        name: clientData?.name || 'Cliente',
        document: clientData?.document || null,
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

  const handleReceiptConfirm = () => {
    setShowReceiptModal(false);
    setCompletedOrder(null);
  };

  // Emitir NFC-e ou NF-e ao imprimir (envia à Brasil NFe)
  const handleGenerateInvoice = async (modelo: 55 | 65, options?: { includeDocument?: boolean }): Promise<{ pdfBase64?: string; invoice?: import('../../services/api/invoices').Invoice } | null> => {
    if (!completedOrder?.id) return null;
    const inv = await invoicesService.generateFromServiceOrder(
      String(completedOrder.id), true, modelo, undefined, options?.includeDocument ?? false
    );
    return { pdfBase64: inv.pdf_base64 ?? undefined, invoice: inv };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
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
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatOsNumber = (osNumber: number) => {
    return String(osNumber).padStart(4, '0');
  };

  // Calcular dias desde a chegada na ótica (todas as linhas já são status overdue)
  const getDaysOverdue = (arrivedAt: string | null) => {
    if (!arrivedAt) return 0;
    const arrived = new Date(arrivedAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    arrived.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - arrived.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const ordersList = Array.isArray(serviceOrders) ? serviceOrders : [];
  
  // Usar storesPlucks que já traz apenas as lojas que o usuário tem acesso
  const filteredStoresList = safeStoresPlucks;

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Inadimplências</h1>
          </div>
        </div>
        {hasPermission('service-orders-overdue.export') && (
          <Button variant="outline" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}{' '}
            Exportar PDF
          </Button>
        )}
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input 
          label="Nº OS / Cliente" 
          placeholder="Buscar..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SingleSelect
          label="Ótica"
          value={filterStore}
          onChange={(val) => setFilterStore(val)}
          options={filteredStoresList.map((store: any) => ({ value: String(store.id), label: store.name }))}
          placeholder="Todas"
        />
        <Input 
          label="Chegou a partir de" 
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
        />
        <Input 
          label="Chegou até" 
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
        />
        <SingleSelect
          label="Status (nos totais)"
          value={filterOverdueStatus}
          onChange={(val) => setFilterOverdueStatus((val as 'active' | 'inactive' | 'all') || 'all')}
          options={[
            { value: 'all', label: 'Todas (ativas e inativas)' },
            { value: 'active', label: 'Só ativas (nos totais do sistema)' },
            { value: 'inactive', label: 'Só inativas (fora dos totais)' },
          ]}
          placeholder="Todas"
        />
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
          {!isLoading && pagination != null && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
              style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color-dark)' }}
            >
              <span>Total em inadimplência: {formatCurrency(totalOverdueValue)}</span>
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
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <SortableHeader
                  label="Nº OS"
                  sortKey="os_number"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Ótica</th>
                <SortableHeader
                  label="Chegou em"
                  sortKey="arrived_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Dias em Atraso</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Nos totais</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin text-red-600" />
                      <span className="text-sm text-slate-500">Carregando inadimplências...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <p className="text-sm font-bold mb-1 text-red-700">Erro ao carregar inadimplências</p>
                      <p className="text-xs text-red-600">{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : ordersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={40} className="text-emerald-500" />
                      <span className="text-sm text-slate-500">Nenhuma inadimplência encontrada</span>
                      <span className="text-xs text-slate-400">Todas as ordens estão em dia!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                ordersList.map((order) => {
                  const daysOverdue = getDaysOverdue(order.arrived_at);
                  
                  return (
                    <tr
                      key={order.id}
                      className={`group transition-colors hover:bg-red-50/30 ${order.overdue_inactive ? 'bg-slate-50/90' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600">
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
                              className="text-sm font-bold text-slate-900 hover:text-red-600 transition-colors cursor-pointer"
                              onClick={() => order.client_id && navigate(`/clients/${order.client_id}`)}
                            >
                              {order.client?.name || '-'}
                            </p>
                            {order.client?.document && (
                              <p className="text-xs text-slate-400">{order.client.document}</p>
                            )}
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
                      <td className="px-6 py-4 text-center text-xs text-slate-500">
                        {formatDate(order.arrived_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="danger">
                          {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(
                            order.outstanding_pickup_amount ??
                              order.price ??
                              0
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Badge variant={order.overdue_inactive ? 'danger' : 'success'}>
                            {order.overdue_inactive ? 'Inativa' : 'Ativa'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {hasPermission('service-orders-overdue.list') && (
                            <button 
                              title="Visualizar OS"
                              onClick={() => navigate(`/service-orders/${order.id}`)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {hasPermission('service-orders-overdue.update') && (
                            <button
                              type="button"
                              title={
                                order.overdue_inactive
                                  ? 'Liberar cliente para pagamento na retirada (e reativar nos indicadores)'
                                  : 'Bloquear cliente para pagamento na retirada (e inativar nos indicadores)'
                              }
                              onClick={() => handleOpenInactiveModal(order)}
                              disabled={actionLoading}
                              className={`p-2 rounded-xl shadow-sm border transition-all disabled:opacity-50 ${
                                order.overdue_inactive
                                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                  : 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                              }`}
                            >
                              {order.overdue_inactive ? (
                                <Check size={16} strokeWidth={2.5} />
                              ) : (
                                <X size={16} strokeWidth={2.5} />
                              )}
                            </button>
                          )}
                          {order.client && (
                            <a
                              href={`https://wa.me/55${order.client.document?.replace(/\D/g, '') || ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Entrar em contato"
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Phone size={16} />
                            </a>
                          )}
                          {hasPermission('service-orders-overdue.update') && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleActionClick(order)}
                              disabled={actionLoading}
                            >
                              <CheckCircle size={14} />
                              Retirou
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              const params = buildFilterParams(appliedFilters);
              params.order_by = sortBy || 'arrived_at';
              params.order_dir = sortDirection || 'asc';
              params.per_page = perPage;
              loadOrders(page, params);
            }}
            itemName="inadimplências"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Retirada */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => {
          if (!processing) {
            setActionModalOpen(false);
            setOrderToAction(null);
          }
        }}
        title="Confirmar Retirada"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Confirma que o cliente retirou o produto da OS #{orderToAction?.os_number}?
          </p>
          
          {orderToAction && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Cliente:</span>
                  <p className="font-semibold text-slate-900">{orderToAction.client?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Valor:</span>
                  <p className="font-semibold text-red-600">{formatCurrency(orderToAction.price || 0)}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setActionModalOpen(false);
                setOrderToAction(null);
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmAction}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Confirmar Retirada
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmação inativar / reativar nos indicadores */}
      <Modal
        isOpen={inactiveModalOpen}
        onClose={() => {
          if (togglingInactiveId === null) {
            setInactiveModalOpen(false);
            setOrderForInactive(null);
          }
        }}
        title={
          orderForInactive?.overdue_inactive
            ? 'Liberar pagamento na retirada?'
            : 'Bloquear pagamento na retirada?'
        }
      >
        {orderForInactive && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              OS <span className="font-bold text-slate-900">#{formatOsNumber(orderForInactive.os_number)}</span>
              {orderForInactive.client?.name ? (
                <>
                  {' '}
                  — <span className="font-medium text-slate-800">{orderForInactive.client.name}</span>
                </>
              ) : null}
            </p>

            {orderForInactive.overdue_inactive ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-slate-700 space-y-2">
                <p className="font-semibold text-emerald-900">Ao confirmar:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>Esta OS <strong>volta a entrar</strong> nos totais de inadimplência do sistema.</li>
                  <li>Se não houver outra inadimplência inativa para o mesmo cliente, ele <strong>volta a poder</strong> usar <strong>pagamento na retirada</strong> em novas OS.</li>
                  <li>O status da OS continua <strong>Inadimplente</strong>; apenas o flag “fora dos totais” é desligado.</li>
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-slate-700 space-y-2">
                <p className="font-semibold text-red-900">Ao confirmar:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>O <strong>cliente</strong> fica <strong>bloqueado para pagamento na retirada</strong>: em novas OS só poderá pagar à vista (cartão, dinheiro, PIX, permuta).</li>
                  <li>Na forma de pagamento da OS aparecerá a mensagem <strong>“Usuário bloqueado para pagamento na retirada”</strong>.</li>
                  <li>A OS <strong>continua inadimplente</strong> no cadastro e <strong>sai dos totais</strong> (fluxo de caixa, dashboard, gráficos).</li>
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  if (togglingInactiveId === null) {
                    setInactiveModalOpen(false);
                    setOrderForInactive(null);
                  }
                }}
                disabled={togglingInactiveId !== null}
              >
                Cancelar
              </Button>
              {orderForInactive.overdue_inactive ? (
                <Button
                  variant="success"
                  onClick={handleConfirmInactiveToggle}
                  disabled={togglingInactiveId !== null}
                >
                  {togglingInactiveId !== null ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Sim, liberar
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="success"
                  className="!bg-red-600 hover:!bg-red-700 shadow-lg shadow-red-200/40"
                  onClick={handleConfirmInactiveToggle}
                  disabled={togglingInactiveId !== null}
                >
                  {togglingInactiveId !== null ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <X size={16} /> Sim, bloquear
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Recibo (após retirada) */}
      {showReceiptModal && completedOrder && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setCompletedOrder(null);
          }}
          onConfirm={() => handleReceiptConfirm()}
          onGenerateInvoice={handleGenerateInvoice}
          canGenerateInvoice={
            userHasAccessToStore(completedOrder.store_id ?? completedOrder.store?.id, user) &&
            canShowNfeOptionInReceiptModal(nfeEligibilitySnapshotFromServiceOrder(completedOrder))
          }
          receiptData={prepareReceiptData(completedOrder)}
          order={completedOrder}
          clientPhone={(completedOrder.client as any)?.phone}
        />
      )}
    </div>
  );
};
