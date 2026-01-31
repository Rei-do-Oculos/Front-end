import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, FlaskConical, User, Building2, Send, Package, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard, Badge } from '../../components/Common';
import { useServiceOrders } from '../../services/hooks/useServiceOrders';
import { useStores } from '../../services/hooks/useStores';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { useClients } from '../../services/hooks/useClients';
import { useFrames } from '../../services/hooks/useFrames';
import { ServiceOrder, ServiceOrderStatus } from '../../services/api/serviceOrders';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../services/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ReceiptData } from '../../components/ThermalReceipt';

// Status labels e cores
const STATUS_CONFIG: Record<ServiceOrderStatus, { label: string; color: 'warning' | 'info' | 'primary' | 'success' | 'danger' }> = {
  pending: { label: 'Pendente', color: 'warning' },
  sent_to_lab: { label: 'Enviado ao Lab', color: 'info' },
  ready_for_pickup: { label: 'Aguardando Retirada', color: 'primary' },
  completed: { label: 'Finalizada', color: 'success' },
  overdue: { label: 'Inadimplente', color: 'danger' },
};

export const ServiceOrderLabList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { availableStores } = useStore();
  const { user } = useAuth();
  const { 
    loading, 
    actionLoading, 
    error, 
    fetchLabOrders, 
    sendToLab, 
    markArrived, 
    markCompleted 
  } = useServiceOrders({ autoFetch: false });
  const { stores, fetchStores } = useStores({ autoFetch: false });
  const { laboratories, fetchLaboratories } = useLaboratories({ autoFetch: false });
  const { clients, fetchClients } = useClients({ autoFetch: false });
  const { frames, fetchFrames } = useFrames({ autoFetch: false });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterLab, setFilterLab] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  const activeFilters = useActiveFilters({
    searchTerm,
    filterStore,
    filterLab,
    filterStatus,
    filterDateFrom,
    filterDateTo,
  });
  
  const [orderToAction, setOrderToAction] = useState<ServiceOrder | null>(null);
  const [actionType, setActionType] = useState<'send' | 'arrived' | 'completed' | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Estado para modal de recibo (após retirada)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ServiceOrder | null>(null);

  // Carregar dados auxiliares
  useEffect(() => {
    fetchStores(1, { per_page: 100 });
    fetchLaboratories(1, { per_page: 100 });
    fetchClients(1, { per_page: 100 });
    fetchFrames(1, { per_page: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar OS do laboratório
  const loadOrders = useCallback(async (page = 1, params: any = {}) => {
    setIsLoading(true);
    try {
      const finalParams: any = {
        ...params,
        order_by: params.order_by || sortBy || 'id',
        order_dir: params.order_dir || sortDirection || 'desc',
        per_page: params.per_page || perPage,
      };
      
      // Filtrar apenas pelas lojas que o usuário tem acesso
      if (availableStores.length > 0 && !params.store_id) {
        finalParams.store_id = availableStores.map(s => s.id);
      }
      
      const result = await fetchLabOrders({ page, ...finalParams });
      setServiceOrders(result.data);
      setPagination(result.meta);
    } catch (err) {
      console.error('Erro ao carregar ordens de serviço:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLabOrders, availableStores, sortBy, sortDirection, perPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (filterStore) params.store_id = filterStore;
    if (filterLab) params.laboratory_id = filterLab;
    if (filterStatus) params.status = filterStatus;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    loadOrders(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStore) params.store_id = filterStore;
      if (filterLab) params.laboratory_id = filterLab;
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      params.per_page = perPage;
      await loadOrders(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchTerm('');
    setFilterStore('');
    setFilterLab('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    
    await loadOrders(1, {
      order_by: sortBy || 'id',
      order_dir: sortDirection || 'desc',
      per_page: perPage,
    });
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    const params: any = { per_page: newPerPage };
    if (searchTerm) params.search = searchTerm;
    if (filterStore) params.store_id = filterStore;
    if (filterLab) params.laboratory_id = filterLab;
    if (filterStatus) params.status = filterStatus;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    if (sortBy) {
      params.order_by = sortBy;
      params.order_dir = sortDirection || 'desc';
    }
    await loadOrders(1, params);
  };

  const handleActionClick = (order: ServiceOrder, action: 'send' | 'arrived' | 'completed') => {
    setOrderToAction(order);
    setActionType(action);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!orderToAction || !actionType) return;

    setProcessing(true);
    try {
      let result;
      switch (actionType) {
        case 'send':
          result = await sendToLab(String(orderToAction.id));
          break;
        case 'arrived':
          result = await markArrived(String(orderToAction.id));
          break;
        case 'completed':
          result = await markCompleted(String(orderToAction.id));
          break;
      }
      
      if (result?.success) {
        showSuccess(result.message);
        setActionModalOpen(false);
        
        // Se foi uma retirada (completed), abrir modal de recibo
        if (actionType === 'completed') {
          setCompletedOrder(orderToAction);
          setShowReceiptModal(true);
        }
        
        setOrderToAction(null);
        setActionType(null);
        // Recarregar lista
        await loadOrders(pagination?.currentPage || 1, {
          per_page: perPage,
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
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

  const getActionButtonConfig = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'pending':
        return { action: 'send' as const, label: 'Enviar', icon: Send, color: 'info', permission: 'service-orders-lab.send' };
      case 'sent_to_lab':
        return { action: 'arrived' as const, label: 'Chegou', icon: Package, color: 'primary', permission: 'service-orders-lab.arrived' };
      case 'ready_for_pickup':
      case 'overdue':
        return { action: 'completed' as const, label: 'Retirou', icon: CheckCircle, color: 'success', permission: 'service-orders-lab.completed' };
      default:
        return null;
    }
  };

  const getActionModalConfig = () => {
    switch (actionType) {
      case 'send':
        return {
          title: 'Confirmar Envio',
          message: `Confirma que a OS #${orderToAction?.os_number} foi enviada para o laboratório?`,
          buttonLabel: 'Confirmar Envio',
          buttonIcon: Send,
        };
      case 'arrived':
        return {
          title: 'Confirmar Chegada',
          message: `Confirma que o produto da OS #${orderToAction?.os_number} chegou na ótica?`,
          buttonLabel: 'Confirmar Chegada',
          buttonIcon: Package,
        };
      case 'completed':
        return {
          title: 'Confirmar Retirada',
          message: `Confirma que o cliente retirou o produto da OS #${orderToAction?.os_number}?`,
          buttonLabel: 'Confirmar Retirada',
          buttonIcon: CheckCircle,
        };
      default:
        return {
          title: '',
          message: '',
          buttonLabel: '',
          buttonIcon: CheckCircle,
        };
    }
  };

  // Preparar dados do recibo para a OS finalizada
  const prepareReceiptData = (order: ServiceOrder): ReceiptData => {
    const storesList = Array.isArray(stores) ? stores : [];
    const clientsList = Array.isArray(clients) ? clients : [];
    const framesList = Array.isArray(frames) ? frames : [];
    
    const storeData = storesList.find(s => s.id === order.store_id);
    const clientData = clientsList.find(c => c.id === order.client_id) || order.client;
    
    const totalPrice = order.price || 0;
    
    // Montar itens do recibo (armações da OS)
    const items: { description: string; quantity: number; price: number }[] = [];
    
    // Se a OS tem frames vinculadas
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
      seller: user?.name || order.user?.name || 'Vendedor',
      store: {
        name: storeData?.name || order.store?.name || 'Loja',
        fancy_name: storeData?.fancy_name || order.store?.fancy_name || order.store?.name || 'Loja',
        cnpj: storeData?.cnpj || order.store?.cnpj || '00.000.000/0000-00',
        ie: storeData?.ie || order.store?.ie || null,
        logradouro: storeData?.logradouro || order.store?.logradouro || '',
        numero: storeData?.numero || order.store?.numero || '',
        bairro: storeData?.bairro || order.store?.bairro || '',
        municipio: storeData?.municipio || order.store?.municipio || '',
        uf: storeData?.uf || order.store?.uf || '',
        telefone: storeData?.telefone || order.store?.telefone || null,
      },
      client: {
        name: clientData?.name || 'Cliente',
        document: clientData?.document || null,
      },
      items,
      total: totalPrice,
      paymentMethod: order.payment_method || null,
      installments: order.installments || null,
    };
  };

  // Callback quando fecha o modal de recibo
  const handleReceiptConfirm = (type: 'receipt' | 'nfe' | 'none') => {
    setShowReceiptModal(false);
    setCompletedOrder(null);
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

  const ordersList = Array.isArray(serviceOrders) ? serviceOrders : [];
  const storesList = Array.isArray(stores) ? stores : [];
  const laboratoriesList = Array.isArray(laboratories) ? laboratories : [];

  // Filtrar stores apenas pelas que o usuário tem acesso
  const availableStoreIds = availableStores.map(s => s.id);
  const filteredStoresList = storesList.filter(s => availableStoreIds.includes(s.id));

  const modalConfig = getActionModalConfig();

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
            <FlaskConical size={28} style={{ color: 'var(--store-color)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">OS Laboratório</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie as ordens de serviço do laboratório.</p>
          </div>
        </div>
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input 
          label="Nº OS / Cliente" 
          placeholder="Buscar..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SingleSelect
          label="Status"
          value={filterStatus}
          onChange={(val) => setFilterStatus(val)}
          options={[
            { value: 'pending', label: 'Pendente' },
            { value: 'sent_to_lab', label: 'Enviado ao Lab' },
            { value: 'ready_for_pickup', label: 'Aguardando Retirada' },
            { value: 'overdue', label: 'Inadimplente' },
          ]}
          placeholder="Todos"
        />
        <SingleSelect
          label="Laboratório"
          value={filterLab}
          onChange={(val) => setFilterLab(val)}
          options={laboratoriesList.map((lab) => ({ value: String(lab.id), label: lab.name }))}
          placeholder="Todos"
        />
        <SingleSelect
          label="Ótica"
          value={filterStore}
          onChange={(val) => setFilterStore(val)}
          options={filteredStoresList.map((store) => ({ value: String(store.id), label: store.name }))}
          placeholder="Todas"
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
        <div className="overflow-x-auto">
          <table className="w-full">
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
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Laboratório</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <SortableHeader
                  label="Enviado em"
                  sortKey="sent_to_lab_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Chegou em"
                  sortKey="arrived_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando ordens de serviço...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar ordens de serviço</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : ordersList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhuma ordem de serviço do laboratório encontrada</span>
                  </td>
                </tr>
              ) : (
                ordersList.map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const actionButton = getActionButtonConfig(order.status);
                  
                  return (
                    <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                          {formatOsNumber(order.os_number)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                            <User size={18} style={{ color: 'var(--store-color)' }} />
                          </div>
                          <div>
                            <p 
                              className="text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                              onClick={() => navigate(`/service-orders/${order.id}`)}
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
                      <td className="px-6 py-4">
                        {order.laboratory ? (
                          <div className="flex items-center gap-2">
                            <FlaskConical size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600">{order.laboratory.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500">
                        {formatDate(order.sent_to_lab_at)}
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500">
                        {formatDate(order.arrived_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {hasPermission('service-orders-lab.list') && (
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
                          {actionButton && hasPermission(actionButton.permission) && (
                            <Button
                              size="sm"
                              variant={actionButton.color as any}
                              onClick={() => handleActionClick(order, actionButton.action)}
                              disabled={actionLoading}
                            >
                              <actionButton.icon size={14} />
                              {actionButton.label}
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
              const params: any = {};
              if (searchTerm) params.search = searchTerm;
              if (filterStore) params.store_id = filterStore;
              if (filterLab) params.laboratory_id = filterLab;
              if (filterStatus) params.status = filterStatus;
              if (filterDateFrom) params.date_from = filterDateFrom;
              if (filterDateTo) params.date_to = filterDateTo;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              params.per_page = perPage;
              loadOrders(page, params);
            }}
            itemName="ordens de serviço"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Ação */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => {
          if (!processing) {
            setActionModalOpen(false);
            setOrderToAction(null);
            setActionType(null);
          }
        }}
        title={modalConfig.title}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">{modalConfig.message}</p>
          
          {orderToAction && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Cliente:</span>
                  <p className="font-semibold text-slate-900">{orderToAction.client?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Laboratório:</span>
                  <p className="font-semibold text-slate-900">{orderToAction.laboratory?.name}</p>
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
                setActionType(null);
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <modalConfig.buttonIcon size={16} /> {modalConfig.buttonLabel}
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
          onConfirm={handleReceiptConfirm}
          receiptData={prepareReceiptData(completedOrder)}
        />
      )}
    </div>
  );
};
