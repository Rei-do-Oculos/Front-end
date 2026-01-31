import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, FileText, User, Building2, CheckCircle, XCircle, Eye, Printer } from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard, Badge } from '../../components/Common';
import { useServiceOrders } from '../../services/hooks/useServiceOrders';
import { useStores } from '../../services/hooks/useStores';
import { useUsers } from '../../services/hooks/useUsers';
import { useClients } from '../../services/hooks/useClients';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ReceiptData } from '../../components/ThermalReceipt';

export const ServiceOrderList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { availableStores, selectedStore } = useStore();
  const { serviceOrders, loading, error, pagination, fetchServiceOrders, deleteServiceOrder } = useServiceOrders({
    autoFetch: false,
  });
  const { stores, fetchStores } = useStores({ autoFetch: false });
  const { users, fetchUsers } = useUsers({ autoFetch: false });
  const { clients, fetchClients } = useClients({ autoFetch: false });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o modal de recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  const [filterStore, setFilterStore] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  const activeFilters = useActiveFilters({
    searchTerm,
    filterStore,
    filterUser,
    filterVerified,
    filterDateFrom,
    filterDateTo,
  });
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carregar dados auxiliares
  useEffect(() => {
    fetchStores(1, { per_page: 100 });
    fetchUsers(1, { per_page: 100 });
    fetchClients(1, { per_page: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar OS com filtro de loja do usuário
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const params: any = {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
          // Mostrar apenas OS finalizadas (pendentes ficam na lista de laboratório)
          status: 'completed',
        };
        
        // Filtrar apenas pelas lojas que o usuário tem acesso
        if (availableStores.length > 0) {
          params.store_id = availableStores.map(s => s.id);
        }
        
        await fetchServiceOrders(1, params);
      } catch (err) {
        console.error('Erro ao carregar ordens de serviço:', err);
      }
    };
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, availableStores]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {
      // Mostrar apenas OS finalizadas
      status: 'completed',
    };
    if (searchTerm) params.search = searchTerm;
    if (filterStore) params.store_id = filterStore;
    if (filterUser) params.user_id = filterUser;
    if (filterVerified) params.verified = filterVerified === 'true';
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchServiceOrders(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = {
        // Mostrar apenas OS finalizadas
        status: 'completed',
      };
      if (searchTerm) params.search = searchTerm;
      if (filterStore) params.store_id = filterStore;
      if (filterUser) params.user_id = filterUser;
      if (filterVerified) params.verified = filterVerified === 'true';
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
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
    setFilterVerified('');
    setFilterDateFrom('');
    setFilterDateTo('');
    
    try {
      const params: any = {
        order_by: sortBy || 'id',
        order_dir: sortDirection || 'desc',
        per_page: perPage,
        // Mostrar apenas OS finalizadas
        status: 'completed',
      };
      
      if (availableStores.length > 0) {
        params.store_id = availableStores.map(s => s.id);
      }
      
      await fetchServiceOrders(1, params);
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    try {
      const params: any = {
        per_page: newPerPage,
        // Mostrar apenas OS finalizadas
        status: 'completed',
      };
      if (searchTerm) params.search = searchTerm;
      if (filterStore) params.store_id = filterStore;
      if (filterUser) params.user_id = filterUser;
      if (filterVerified) params.verified = filterVerified === 'true';
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      await fetchServiceOrders(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleDeleteClick = (order: ServiceOrder) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setDeleting(true);
    try {
      await deleteServiceOrder(String(orderToDelete.id));
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      showSuccess('Ordem de serviço excluída com sucesso!');
      await fetchServiceOrders(pagination.currentPage, {});
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

  // Função para preparar dados do recibo
  const prepareReceiptData = (order: ServiceOrder): ReceiptData => {
    const storesList = Array.isArray(stores) ? stores : [];
    const clientsList = Array.isArray(clients) ? clients : [];
    
    // Buscar dados completos da loja
    const storeData = storesList.find(s => s.id === order.store_id);
    const clientData = clientsList.find(c => c.id === order.client_id);
    
    const totalPrice = typeof order.price === 'number' ? order.price : parseFloat(String(order.price)) || 0;
    
    // Montar itens do recibo (armações)
    const items: { description: string; quantity: number; price: number }[] = [];
    
    // Se a OS tem armações no relacionamento
    const orderFrames = Array.isArray(order.frames) ? order.frames : 
      (order.frames && typeof order.frames === 'object' ? Object.values(order.frames) : []);
    
    if (orderFrames.length > 0) {
      const pricePerFrame = totalPrice / orderFrames.length;
      orderFrames.forEach((frame: any) => {
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
      date: new Date(order.created_at).toLocaleString('pt-BR'),
      seller: order.user?.name || 'Vendedor',
      store: {
        name: storeData?.name || order.store?.name || 'Loja',
        fancy_name: storeData?.fancy_name || storeData?.name || order.store?.name || 'Loja',
        cnpj: storeData?.cnpj || '00.000.000/0000-00',
        ie: storeData?.ie || null,
        logradouro: storeData?.logradouro || '',
        numero: storeData?.numero || '',
        bairro: storeData?.bairro || '',
        municipio: storeData?.municipio || '',
        uf: storeData?.uf || '',
        telefone: storeData?.telefone || null,
      },
      client: {
        name: clientData?.name || order.client?.name || 'Cliente',
        document: clientData?.document || order.client?.document || null,
      },
      items,
      total: totalPrice,
      paymentMethod: order.payment_method || null,
      installments: order.installments || null,
    };
  };

  // Função para abrir modal de impressão
  const handlePrintClick = (order: ServiceOrder) => {
    setOrderToPrint(order);
    setShowReceiptModal(true);
  };

  // Callback quando confirma no modal de recibo
  const handleReceiptConfirm = () => {
    setShowReceiptModal(false);
    setOrderToPrint(null);
  };

  const ordersList = Array.isArray(serviceOrders) ? serviceOrders : [];
  const storesList = Array.isArray(stores) ? stores : [];
  const usersList = Array.isArray(users) ? users : [];

  // Filtrar stores apenas pelas que o usuário tem acesso
  const availableStoreIds = availableStores.map(s => s.id);
  const filteredStoresList = storesList.filter(s => availableStoreIds.includes(s.id));

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
          label="Ótica"
          value={filterStore}
          onChange={(val) => setFilterStore(val)}
          options={filteredStoresList.map((store) => ({ value: String(store.id), label: store.name }))}
          placeholder="Todas as óticas"
        />
        <SingleSelect
          label="Vendedor"
          value={filterUser}
          onChange={(val) => setFilterUser(val)}
          options={usersList.map((user) => ({ value: String(user.id), label: user.name }))}
          placeholder="Todos"
        />
        <SingleSelect
          label="Garantia"
          value={filterVerified}
          onChange={(val) => setFilterVerified(val)}
          options={[
            { value: 'true', label: 'Sim' },
            { value: 'false', label: 'Não' },
          ]}
          placeholder="Todos"
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
                <SortableHeader
                  label="Preço"
                  sortKey="price"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
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
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando ordens de serviço...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar ordens de serviço</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : ordersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
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
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                          <User size={18} style={{ color: 'var(--store-color)' }} />
                        </div>
                        <div>
                          <p 
                            className="text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                            onClick={() => navigate(`/service-orders/${order.id}/edit`)}
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
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={order.verified ? 'success' : 'danger'}>
                        {order.verified ? 'Sim' : 'Não'}
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
                            title="Imprimir Recibo"
                            onClick={() => handlePrintClick(order)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <Printer size={16} />
                          </button>
                        )}
                        {hasPermission('service-orders.update') && (
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
                        {hasPermission('service-orders.delete') && (
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
              const params: any = {
                // Mostrar apenas OS finalizadas
                status: 'completed',
              };
              if (searchTerm) params.search = searchTerm;
              if (filterStore) params.store_id = filterStore;
              if (filterUser) params.user_id = filterUser;
              if (filterVerified) params.verified = filterVerified === 'true';
              if (filterDateFrom) params.date_from = filterDateFrom;
              if (filterDateTo) params.date_to = filterDateTo;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
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
          receiptData={prepareReceiptData(orderToPrint)}
        />
      )}
    </div>
  );
};
