import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, FlaskConical, User, Building2, Send, Package, CheckCircle, AlertTriangle, Eye, Plus, Trash2, RotateCcw } from 'lucide-react';
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
  const { availableStores, selectedStore } = useStore();
  const { user } = useAuth();
  const { 
    loading, 
    actionLoading, 
    error, 
    fetchLabOrders, 
    sendToLab, 
    markArrived, 
    markCompleted,
    revertSendToLab,
    revertArrived,
    updateServiceOrder
  } = useServiceOrders({ autoFetch: false });
  const { stores, fetchStores } = useStores({ autoFetch: false });
  const { laboratories, fetchLaboratories } = useLaboratories({ autoFetch: false });
  const { clients, fetchClients } = useClients({ autoFetch: false });
  const { frames, fetchFrames } = useFrames({ autoFetch: false });

  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [labListError, setLabListError] = useState<Error & { response?: { status?: number } } | null>(null);

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
  
  // Estado para modal de alteração de pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('');
  const [newInstallments, setNewInstallments] = useState<string>('1');
  const [usePartialPayments, setUsePartialPayments] = useState(false);
  const [partialPayments, setPartialPayments] = useState<Array<{
    payment_method: string;
    amount: string;
    installments: string;
  }>>([]);

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
    setLabListError(null);
    try {
      const finalParams: any = {
        ...params,
        order_by: params.order_by || sortBy || 'id',
        order_dir: params.order_dir || sortDirection || 'desc',
        per_page: params.per_page || perPage,
      };
      
      // OS de lab: filtrar pela loja selecionada (apenas OS da loja em foco)
      if (!params.store_id) {
        if (selectedStore?.id) {
          finalParams.store_id = selectedStore.id;
        } else if (availableStores.length > 0) {
          finalParams.store_id = availableStores.map(s => s.id);
        }
      }
      
      const result = await fetchLabOrders({ page, ...finalParams });
      setServiceOrders(result.data);
      setPagination(result.meta);
    } catch (err: any) {
      console.error('Erro ao carregar ordens de serviço:', err);
      setLabListError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLabOrders, availableStores, selectedStore, sortBy, sortDirection, perPage]);

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
    // Se for finalizar e tiver pagamento na retirada, navegar para página de alteração de pagamento
    if (action === 'completed' && order.payment_method === 'on_pickup') {
      navigate(`/service-orders/${order.id}/change-payment`);
      return;
    }
    
    setOrderToAction(order);
    setActionType(action);
    setActionModalOpen(true);
  };

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const formatFromNumber = (value: number): string => {
    if (!value && value !== 0) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleConfirmPaymentChange = async () => {
    if (!orderToAction) {
      showError('Erro: OS não encontrada');
      return;
    }

    if (usePartialPayments) {
      if (partialPayments.length === 0) {
        showError('Adicione pelo menos uma forma de pagamento');
        return;
      }
      const totalPaid = partialPayments.reduce((sum, p) => sum + parseCurrency(p.amount), 0);
      const totalPrice = orderToAction.price || 0;
      if (Math.abs(totalPaid - totalPrice) > 0.01) {
        showError(`A soma dos pagamentos (${formatFromNumber(totalPaid)}) deve ser igual ao valor total (${formatFromNumber(totalPrice)})`);
        return;
      }
    } else {
      if (!newPaymentMethod) {
        showError('Selecione uma forma de pagamento');
        return;
      }
    }

    setProcessing(true);
    try {
      const updatePayload: any = usePartialPayments
        ? {
            payment_method: null,
            installments: null,
            payments: partialPayments.map(p => ({
              payment_method: p.payment_method as any,
              amount: parseCurrency(p.amount),
              installments: p.payment_method === 'credit_card' && p.installments ? parseInt(p.installments) : null,
            })),
          }
        : {
            payment_method: newPaymentMethod as any,
            installments: newPaymentMethod === 'credit_card' ? parseInt(newInstallments) : null,
            payments: [],
          };

      // Atualizar forma de pagamento da OS
      const updatedOrder = await updateServiceOrder(String(orderToAction.id), updatePayload);
      
      showSuccess('Forma de pagamento atualizada com sucesso!');
      setShowPaymentModal(false);
      
      // Atualizar orderToAction com os dados retornados
      const orderWithUpdatedPayment = updatedOrder || {
        ...orderToAction,
        ...updatePayload,
      };
      setOrderToAction(orderWithUpdatedPayment);
      
      // Agora finalizar a OS
      await handleFinalizeOrder();
    } catch (err: any) {
      console.error('Erro ao alterar pagamento:', err);
      showError(err.message || 'Erro ao alterar forma de pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalizeOrder = async () => {
    if (!orderToAction) return;

    try {
      const result = await markCompleted(String(orderToAction.id));
      
      if (result?.success) {
        showSuccess(result.message);
        setActionModalOpen(false);
        
        // Usar orderToAction que já foi atualizado com o novo pagamento
        setCompletedOrder(orderToAction);
        setShowReceiptModal(true);
        
        setOrderToAction(null);
        setActionType(null);
        // Recarregar lista
        await loadOrders(pagination?.currentPage || 1, {
          per_page: perPage,
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
        });
      } else {
        showError(result?.message || 'Erro ao finalizar OS');
      }
    } catch (err: any) {
      console.error('Erro ao finalizar OS:', err);
      showError(err.message || 'Erro ao finalizar OS');
      throw err; // Re-throw para que handleConfirmPaymentChange possa tratar
    }
  };

  const handleConfirmAction = async () => {
    if (!orderToAction || !actionType) return;

    // Verificar se é uma reversão (baseado no status atual da OS)
    const isRevert = orderToAction && (
      (actionType === 'send' && orderToAction.status === 'sent_to_lab') ||
      (actionType === 'arrived' && (orderToAction.status === 'ready_for_pickup' || orderToAction.status === 'overdue'))
    );

    if (isRevert) {
      await handleConfirmRevert();
      return;
    }

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
          // Se chegou aqui sem passar pelo modal de pagamento, finalizar normalmente
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


  const handleRevertClick = async (order: ServiceOrder) => {
    // Determinar para qual estado vai voltar baseado no estado atual
    let revertType: 'send' | 'arrived' | null = null;
    
    if (order.status === 'sent_to_lab') {
      revertType = 'send';
    } else if (order.status === 'ready_for_pickup' || order.status === 'overdue') {
      revertType = 'arrived';
    } else {
      // OS finalizadas não podem ser revertidas
      return;
    }
    
    if (!revertType) return;
    
    setOrderToAction(order);
    setActionType(revertType);
    setActionModalOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!orderToAction || !actionType) return;

    setProcessing(true);
    try {
      let result;
      switch (actionType) {
        case 'send':
          result = await revertSendToLab(String(orderToAction.id));
          break;
        case 'arrived':
          result = await revertArrived(String(orderToAction.id));
          break;
        default:
          showError('Tipo de reversão inválido');
          return;
      }
      
      if (result?.success) {
        showSuccess(result.message);
        setActionModalOpen(false);
        setOrderToAction(null);
        setActionType(null);
        // Recarregar lista
        await loadOrders(pagination?.currentPage || 1, {
          per_page: perPage,
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
        });
      } else {
        showError(result?.message || 'Erro ao reverter ação');
      }
    } catch (err: any) {
      console.error('Erro ao reverter ação:', err);
      showError(err.message || 'Erro ao reverter ação');
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

  const canRevert = (status: ServiceOrderStatus): boolean => {
    // Apenas estados intermediários podem ser revertidos (não finalizadas)
    return status === 'sent_to_lab' || status === 'ready_for_pickup' || status === 'overdue';
  };

  const getRevertTargetStatus = (status: ServiceOrderStatus): string => {
    switch (status) {
      case 'sent_to_lab':
        return 'Pendente';
      case 'ready_for_pickup':
      case 'overdue':
        return 'Enviado ao Lab';
      default:
        return '';
    }
  };

  const getActionModalConfig = () => {
    // Verificar se é uma reversão baseado no status atual da OS
    const isRevert = orderToAction && (
      (actionType === 'send' && orderToAction.status === 'sent_to_lab') ||
      (actionType === 'arrived' && (orderToAction.status === 'ready_for_pickup' || orderToAction.status === 'overdue'))
    );

    if (isRevert && orderToAction) {
      const targetStatus = getRevertTargetStatus(orderToAction.status);
      const currentStatusLabel = STATUS_CONFIG[orderToAction.status]?.label || orderToAction.status;
      
      return {
        title: 'Reverter Estado da OS',
        message: `⚠️ Atenção! Você está prestes a reverter o estado da OS #${orderToAction.os_number}.\n\n📋 Estado atual: ${currentStatusLabel}\n⬅️ Voltará para: ${targetStatus}\n\nConfirma que deseja reverter? Use esta opção apenas se clicou errado ou quando realmente necessário.`,
        buttonLabel: 'Sim, Reverter',
        buttonIcon: RotateCcw,
      };
    }

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
      expectedPickupDate: order.expected_pickup_date || null,
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
        unity: storeData?.unity ?? (order.store as any)?.unity ?? null,
        logo: storeData?.logo ?? (order.store as any)?.logo ?? null,
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

  const is403 = (err: any) => err?.response?.status === 403 || err?.status === 403;
  if (error && is403(error)) return <AccessDeniedCard />;
  if (labListError && is403(labListError)) return <AccessDeniedCard />;

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
              ) : (error || labListError) ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar ordens de serviço</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{(error || labListError)?.message || 'Erro desconhecido'}</p>
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
                          {canRevert(order.status) && hasPermission('service-orders-lab.send') && (
                            <button
                              title="Reverter estado"
                              onClick={() => handleRevertClick(order)}
                              disabled={actionLoading}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl shadow-sm border border-orange-200 hover:border-orange-300 transition-all"
                            >
                              <RotateCcw size={16} />
                            </button>
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

      {/* Modal de Alteração de Pagamento (quando pagamento na retirada) */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          if (!processing) {
            setShowPaymentModal(false);
            setOrderToAction(null);
            setActionType(null);
            setNewPaymentMethod('');
            setNewInstallments('1');
          }
        }}
        title="Alterar Forma de Pagamento"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Esta OS está configurada como "Pagamento na Retirada". 
              Como o cliente está retirando agora, é necessário alterar a forma de pagamento para faturar corretamente.
            </p>
          </div>
          
          {orderToAction && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">OS:</span>
                  <p className="font-semibold text-slate-900">#{String(orderToAction.os_number).padStart(4, '0')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cliente:</span>
                  <p className="font-semibold text-slate-900">{orderToAction.client?.name}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Valor Total:</span>
                  <p className="font-semibold text-slate-900 text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderToAction.price || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={usePartialPayments}
                  onChange={(e) => {
                    setUsePartialPayments(e.target.checked);
                    if (e.target.checked) {
                      const totalPrice = orderToAction?.price || 0;
                      setPartialPayments([{
                        payment_method: '',
                        amount: formatFromNumber(totalPrice),
                        installments: '1',
                      }]);
                      setNewPaymentMethod('');
                    } else {
                      setPartialPayments([]);
                    }
                  }}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                />
              </div>
              <span className="text-sm font-medium text-slate-600">Pagamento parcial/misto</span>
            </label>

            {!usePartialPayments ? (
              // Pagamento único
              <>
                <div>
                  <SingleSelect
                    label="Nova Forma de Pagamento *"
                    value={newPaymentMethod}
                    onChange={(val) => {
                      setNewPaymentMethod(val);
                      if (val !== 'credit_card') {
                        setNewInstallments('1');
                      }
                    }}
                    options={[
                      { value: 'credit_card', label: 'Cartão de Crédito' },
                      { value: 'debit_card', label: 'Cartão de Débito' },
                      { value: 'cash', label: 'Dinheiro' },
                      { value: 'pix', label: 'PIX' },
                    ]}
                    placeholder="Selecione a forma de pagamento..."
                  />
                </div>
                
                {newPaymentMethod === 'credit_card' && (
                  <div>
                    <SingleSelect
                      label="Parcelas"
                      value={newInstallments}
                      onChange={(val) => setNewInstallments(val)}
                      options={[
                        { value: '1', label: '1x' },
                        { value: '2', label: '2x' },
                        { value: '3', label: '3x' },
                        { value: '4', label: '4x' },
                        { value: '5', label: '5x' },
                        { value: '6', label: '6x' },
                        { value: '7', label: '7x' },
                        { value: '8', label: '8x' },
                        { value: '9', label: '9x' },
                        { value: '10', label: '10x' },
                        { value: '11', label: '11x' },
                        { value: '12', label: '12x' },
                      ]}
                      placeholder="1x"
                    />
                  </div>
                )}
              </>
            ) : (
              // Pagamentos parciais
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-800">
                    💡 Adicione múltiplas formas de pagamento. A soma deve ser igual ao valor total.
                  </p>
                </div>
                {partialPayments.map((payment, index) => {
                  const totalPaid = partialPayments.reduce((sum, p) => sum + parseCurrency(p.amount), 0);
                  const totalPrice = orderToAction?.price || 0;
                  const remaining = totalPrice - totalPaid + parseCurrency(payment.amount);
                  
                  return (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <SingleSelect
                            label={`Pagamento ${index + 1}`}
                            value={payment.payment_method}
                            onChange={(val) => {
                              const newPayments = [...partialPayments];
                              newPayments[index] = {
                                ...newPayments[index],
                                payment_method: val,
                                installments: val === 'credit_card' ? newPayments[index].installments : '1',
                              };
                              setPartialPayments(newPayments);
                            }}
                            options={[
                              { value: 'credit_card', label: 'Cartão de Crédito' },
                              { value: 'debit_card', label: 'Cartão de Débito' },
                              { value: 'cash', label: 'Dinheiro' },
                              { value: 'pix', label: 'PIX' },
                            ]}
                            placeholder="Selecione..."
                          />
                        </div>
                        <div className="w-40">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                            Valor *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              R$
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0,00"
                              value={payment.amount}
                              onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                const newPayments = [...partialPayments];
                                newPayments[index] = { ...newPayments[index], amount: formatted };
                                setPartialPayments(newPayments);
                              }}
                              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]"
                            />
                          </div>
                          {remaining >= 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Restante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}
                            </p>
                          )}
                        </div>
                        {payment.payment_method === 'credit_card' && (
                          <div className="w-28">
                            <SingleSelect
                              label="Parcelas"
                              value={payment.installments}
                              onChange={(val) => {
                                const newPayments = [...partialPayments];
                                newPayments[index] = { ...newPayments[index], installments: val };
                                setPartialPayments(newPayments);
                              }}
                              options={[
                                { value: '1', label: '1x' },
                                { value: '2', label: '2x' },
                                { value: '3', label: '3x' },
                                { value: '4', label: '4x' },
                                { value: '5', label: '5x' },
                                { value: '6', label: '6x' },
                                { value: '7', label: '7x' },
                                { value: '8', label: '8x' },
                                { value: '9', label: '9x' },
                                { value: '10', label: '10x' },
                                { value: '11', label: '11x' },
                                { value: '12', label: '12x' },
                              ]}
                              placeholder="1x"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newPayments = partialPayments.filter((_, i) => i !== index);
                            setPartialPayments(newPayments);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {(() => {
                  const totalPaid = partialPayments.reduce((sum, p) => sum + parseCurrency(p.amount), 0);
                  const totalPrice = orderToAction?.price || 0;
                  const remaining = totalPrice - totalPaid;
                  const isValid = Math.abs(remaining) < 0.01;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">Total pago:</span>
                        <span className={`text-sm font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}
                        </span>
                      </div>
                      {!isValid && (
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ A soma dos pagamentos ({formatFromNumber(totalPaid)}) deve ser igual ao valor total ({formatFromNumber(totalPrice)})
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (remaining > 0) {
                            const formattedRemaining = remaining.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).replace('.', ',');
                            setPartialPayments([
                              ...partialPayments,
                              {
                                payment_method: '',
                                amount: formattedRemaining,
                                installments: '1',
                              },
                            ]);
                          }
                        }}
                        disabled={remaining <= 0 || isValid}
                        className="w-full"
                      >
                        <Plus size={16} /> Adicionar Pagamento
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                if (!processing) {
                  setShowPaymentModal(false);
                  setOrderToAction(null);
                  setActionType(null);
                  setNewPaymentMethod('');
                  setNewInstallments('1');
                  setUsePartialPayments(false);
                  setPartialPayments([]);
                }
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPaymentChange}
              disabled={processing || (usePartialPayments ? partialPayments.length === 0 : !newPaymentMethod)}
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Confirmar e Finalizar
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

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
        title={(() => {
          const isRevert = orderToAction && (
            (actionType === 'send' && orderToAction.status === 'sent_to_lab') ||
            (actionType === 'arrived' && (orderToAction.status === 'ready_for_pickup' || orderToAction.status === 'overdue'))
          );
          return isRevert ? 'Reverter Estado da OS' : modalConfig.title;
        })()}
      >
        <div className="space-y-4">
          {(() => {
            const isRevert = orderToAction && (
              (actionType === 'send' && orderToAction.status === 'sent_to_lab') ||
              (actionType === 'arrived' && (orderToAction.status === 'ready_for_pickup' || orderToAction.status === 'overdue'))
            );
            
            if (isRevert && orderToAction) {
              const targetStatus = getRevertTargetStatus(orderToAction.status);
              const currentStatusLabel = STATUS_CONFIG[orderToAction.status]?.label || orderToAction.status;
              
              return (
                <>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-sm text-orange-800 font-medium mb-3">
                      ⚠️ Atenção! Você está prestes a reverter o estado desta OS.
                    </p>
                    <div className="space-y-2 text-sm text-orange-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Estado atual:</span>
                        <span className="font-bold">{currentStatusLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Voltará para:</span>
                        <span className="font-bold">{targetStatus}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    Use esta opção apenas se clicou errado ou quando realmente necessário reverter o estado.
                  </p>
                </>
              );
            }
            
            return <p className="text-sm text-slate-700">{modalConfig.message}</p>;
          })()}
          
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
                  {(() => {
                    const isRevert = orderToAction && (
                      (actionType === 'send' && orderToAction.status === 'sent_to_lab') ||
                      (actionType === 'arrived' && (orderToAction.status === 'ready_for_pickup' || orderToAction.status === 'overdue'))
                    );
                    const Icon = isRevert ? RotateCcw : modalConfig.buttonIcon;
                    return <Icon size={16} />;
                  })()}
                  {modalConfig.buttonLabel}
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
          order={completedOrder}
          clientPhone={(Array.isArray(clients) ? clients : []).find(c => c.id === completedOrder.client_id)?.phone || (completedOrder.client as any)?.phone}
        />
      )}
    </div>
  );
};
