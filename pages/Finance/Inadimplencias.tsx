import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, FileDown, Phone, User, Building2, Eye, CheckCircle } from 'lucide-react';
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
import { useAuth } from '../../services/hooks/useAuth';
import { userHasAccessToStore } from '../../utils/storeAccess';
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
    markCompleted 
  } = useServiceOrders({ autoFetch: false });
  
  // Usar usePlucks para trazer todas as lojas que o usuário tem acesso
  const { plucks: storesPlucks } = usePlucks({
    service: storesService,
    autoFetch: true,
  });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState<string | null>('arrived_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [perPage, setPerPage] = useState<number>(15);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  // Modal de confirmação de retirada
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [orderToAction, setOrderToAction] = useState<ServiceOrder | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Modal de recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ServiceOrder | null>(null);

  const [appliedFilters, setAppliedFilters] = useState({ searchTerm: '', filterStore: '', filterDateFrom: '', filterDateTo: '' });

  const activeFilters = useActiveFilters({
    searchTerm: appliedFilters.searchTerm,
    filterStore: appliedFilters.filterStore,
    filterDateFrom: appliedFilters.filterDateFrom,
    filterDateTo: appliedFilters.filterDateTo,
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
      
      const result = await fetchOverdueOrders({ page, ...finalParams });
      setServiceOrders(result.data);
      setPagination(result.meta);
    } catch (err) {
      console.error('Erro ao carregar ordens de serviço:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOverdueOrders, availableStores, selectedStore?.id, sortBy, sortDirection, perPage]);

  const buildFilterParams = (f: typeof appliedFilters) => {
    const params: any = {};
    if (f.searchTerm) params.search = f.searchTerm;
    if (f.filterStore) params.store_id = f.filterStore;
    if (f.filterDateFrom) params.date_from = f.filterDateFrom;
    if (f.filterDateTo) params.date_to = f.filterDateTo;
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
    const next = { searchTerm, filterStore, filterDateFrom, filterDateTo };
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
    setAppliedFilters({ searchTerm: '', filterStore: '', filterDateFrom: '', filterDateTo: '' });
    await loadOrders(1, { order_by: sortBy || 'arrived_at', order_dir: sortDirection || 'asc', per_page: perPage });
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

      const { orders, totalSales } = await serviceOrdersService.getOverdueReport(params as any);
      const storeFilterLabel = f.filterStore
        ? (safeStoresPlucks.find((s: { id: number | string }) => String(s.id) === f.filterStore)?.name as string | undefined) ?? null
        : null;

      await generateInadimplenciasReportPdf({
        orders,
        totalSales,
        dateFrom: f.filterDateFrom || undefined,
        dateTo: f.filterDateTo || undefined,
        storeFilterLabel,
        searchTerm: f.searchTerm || undefined,
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
    setOrderToAction(order);
    setActionModalOpen(true);
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
    
    const items: { description: string; quantity: number; price: number }[] = [];
    
    if (order.frames && Array.isArray(order.frames) && order.frames.length > 0) {
      const pricePerFrame = totalPrice / order.frames.length;
      order.frames.forEach((frame: any) => {
        items.push({
          description: frame.description || `Armação ${frame.code || ''}`,
          quantity: 1,
          price: pricePerFrame,
        });
      });
    } else {
      items.push({
        description: 'Serviço Óptico',
        quantity: 1,
        price: totalPrice,
      });
    }
    
    return {
      osNumber: order.os_number,
      date: new Date().toLocaleString('pt-BR'),
      expectedPickupDate: order.expected_pickup_date || null,
      seller: user?.name || order.user?.name || 'Vendedor',
      store: {
        name: storeData?.name || 'Loja',
        fancy_name: storeData?.fancy_name || storeData?.name || 'Loja',
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
      items,
      total: totalPrice,
      paymentMethod: order.payments && order.payments.length > 0 ? null : (order.payment_method || null),
      installments: order.payments && order.payments.length > 0 ? null : (order.installments || null),
      payments: order.payments && order.payments.length > 0
        ? order.payments.map(p => ({
            payment_method: p.payment_method,
            amount: p.amount,
            installments: p.installments || null,
          }))
        : undefined,
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

  // Calcular dias de atraso (na tela de inadimplências todas as OS já são overdue)
  // Para OS inadimplentes: dias desde arrived_at (quando deveria retirar), não usa grace period
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
            <p className="text-gray-500 font-medium mt-1">Ordens de serviço aguardando retirada há mais de 5 dias.</p>
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
      </FilterSection>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin text-red-600" />
                      <span className="text-sm text-slate-500">Carregando inadimplências...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <p className="text-sm font-bold mb-1 text-red-700">Erro ao carregar inadimplências</p>
                      <p className="text-xs text-red-600">{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : ordersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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
                    <tr key={order.id} className="group hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600">
                          {formatOsNumber(order.os_number)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <User size={18} className="text-red-600" />
                          </div>
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
                          {formatCurrency(order.price || 0)}
                        </span>
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
          canGenerateInvoice={userHasAccessToStore(completedOrder.store_id ?? completedOrder.store?.id, user)}
          receiptData={prepareReceiptData(completedOrder)}
          order={completedOrder}
          clientPhone={(completedOrder.client as any)?.phone}
        />
      )}
    </div>
  );
};
