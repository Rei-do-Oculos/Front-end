import React, { useState, useEffect } from 'react';
import { Search, Edit, Plus, FileText, Eye, Trash2, Smartphone, Loader2, ArrowRight } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, MultiSelect, ActiveFiltersBadge, Badge, SortableHeader, SortDirection, Pagination } from '../../components/Common';
import { useClients } from '../../services/hooks/useClients';
import { Client } from '../../services/api/clients';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { usePermission } from '../../services/hooks/usePermission';
import { useNotification } from '../../hooks/useNotification';
import { useActiveFilters } from '../../hooks/useActiveFilters';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const { availableStores, selectedStore } = useStore();
  const { hasPermission } = usePermission();
  const { showSuccess, showError } = useNotification();
  const { clients, loading, error, pagination, fetchClients, deleteClient, migrateToStore } = useClients({
    autoFetch: false,
  });

  const [searchName, setSearchName] = useState('');
  const [searchDocument, setSearchDocument] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [migrating, setMigrating] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Calcular quantidade de filtros ativos usando hook padronizado
  const activeFilters = useActiveFilters({
    searchName,
    searchDocument,
    searchPhone,
    dateFrom,
    dateTo,
    selectedStores: selectedStores.filter(s => s !== 'all'),
  });

  // Carregar dados iniciais - SEM filtro de lojas (mostrar todos)
  useEffect(() => {
    const loadClients = async () => {
      try {
        console.log('[ClientList] Carregando clientes iniciais...');
        await fetchClients(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
        });
      } catch (err) {
        console.error('[ClientList] Erro ao carregar clientes:', err);
      }
    };
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (key: string, direction: SortDirection) => {
    // Sempre manter uma ordenação ativa (asc ou desc)
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    if (searchName) params.search = searchName;
    if (searchDocument) params.document = searchDocument;
    if (searchPhone) params.phone = searchPhone;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (selectedStores.length > 0 && !selectedStores.includes('all')) {
      const storeIds = selectedStores
        .filter(id => id !== 'all' && !isNaN(parseInt(id)))
        .map(id => parseInt(id));
      if (storeIds.length > 0) {
        params.stores = storeIds;
      }
    }
    
    params.order_by = key;
    params.order_dir = newDirection;
    
    fetchClients(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = {};
      if (searchName) params.search = searchName;
      if (searchDocument) params.document = searchDocument;
      if (searchPhone) params.phone = searchPhone;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedStores.length > 0 && !selectedStores.includes('all')) {
        const storeIds = selectedStores
          .filter(id => id !== 'all' && !isNaN(parseInt(id)))
          .map(id => parseInt(id));
        
        if (storeIds.length > 0) {
          params.stores = storeIds;
        }
      }
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      await fetchClients(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchName('');
    setSearchDocument('');
    setSearchPhone('');
    setDateFrom('');
    setDateTo('');
    setSelectedStores([]);
    
    try {
      await fetchClients(1, {
        order_by: sortBy || 'id',
        order_dir: sortDirection || 'desc',
      });
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleMigrate = async (client: Client) => {
    if (!selectedStore) {
      showError('Erro', 'Nenhuma loja selecionada');
      return;
    }

    const belongsToCurrentStore = Array.isArray(client.stores) && client.stores.some(
      store => store.id === selectedStore.id
    );

    if (belongsToCurrentStore) {
      showError('Atenção', 'Este cliente já pertence à loja atual');
      return;
    }

    setMigrating(client.id);
    try {
      await migrateToStore(String(client.id), selectedStore.id);
      showSuccess(
        'Cliente migrado!',
        `O cliente "${client.name}" foi adicionado à loja "${selectedStore.name}". O histórico original foi mantido.`
      );
      await fetchClients(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao migrar cliente:', err);
      showError('Erro ao migrar cliente', err.message || 'Não foi possível migrar o cliente');
    } finally {
      setMigrating(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    setDeleting(true);
    try {
      await deleteClient(String(clientToDelete.id));
      setSuccessMessage(`Cliente "${clientToDelete.name}" excluído com sucesso!`);
      setDeleteModalOpen(false);
      setClientToDelete(null);
      await fetchClients(pagination.currentPage, {});
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      alert(err.message || 'Erro ao excluir cliente');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // O backend retorna no formato "d/m/Y H:i:s" (ex: "23/01/2026 14:30:00")
      // Precisamos converter para um formato que o JavaScript entenda
      let date: Date;
      
      if (dateString.includes('/')) {
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        
        date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
      } else {
        date = new Date(dateString);
      }
      
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
      console.error('Erro ao formatar data:', e, dateString);
      return dateString;
    }
  };

  const formatDocument = (document: string) => {
    if (!document) return '---';
    // Formatar CPF: 000.000.000-00
    const cleaned = document.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return document;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return null;
    // Formatar telefone: (00) 00000-0000
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  // Garantir que clients seja sempre um array
  const clientsList = Array.isArray(clients) ? clients : [];
  
  // Debug: log dos clientes recebidos
  useEffect(() => {
    console.log('[ClientList] Estado atual:', {
      clients,
      clientsList,
      clientsLength: clientsList.length,
      loading,
      error,
      pagination,
    });
  }, [clients, clientsList.length, loading, error, pagination]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Clientes</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie sua base de clientes e histórico de compras.</p>
          </div>
          <ActiveFiltersBadge count={activeFilters} />
        </div>
        {hasPermission('clients.create') && (
          <Button onClick={() => navigate('/clients/create')}>
            <Plus size={18} /> Novo Cliente
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in slide-in-from-top-2">
          <p className="text-emerald-700 text-sm font-bold">{successMessage}</p>
        </div>
      )}

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input 
          label="Nome do Cliente" 
          placeholder="Buscar por nome..." 
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input 
          label="CPF" 
          placeholder="000.000.000-00" 
          value={searchDocument}
          onChange={(e) => setSearchDocument(e.target.value)}
        />
        <Input 
          label="Telefone" 
          placeholder="(00) 00000-0000" 
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
        />
        <Input 
          label="Data de Cadastro" 
          type="date" 
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <MultiSelect
          label="Lojas"
          placeholder="Selecione as lojas ou deixe vazio para todas"
          options={[
            { label: 'Todas as Lojas', value: 'all' },
            ...availableStores.map(store => ({
              label: store.name,
              value: String(store.id)
            }))
          ]}
          value={selectedStores}
          onChange={(values) => {
            if (values.includes('all')) {
              setSelectedStores(['all']);
            } else {
              setSelectedStores(values.filter(v => v !== 'all'));
            }
          }}
        />
      </FilterSection>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <SortableHeader
                  label="ID"
                  sortKey="id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <SortableHeader
                  label="Nome do Cliente"
                  sortKey="name"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <SortableHeader
                  label="CPF"
                  sortKey="document"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <SortableHeader
                  label="Contato"
                  sortKey="phone"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Loja/Unidade</th>
                <SortableHeader
                  label="Cadastro"
                  sortKey="created_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar clientes</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : clientsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhum cliente encontrado</span>
                  </td>
                </tr>
              ) : (
                clientsList.map((client) => {
                  const phoneFormatted = formatPhone(client.phone);
                  
                  return (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">#{client.id}</td>
                      <td className="px-6 py-4">
                        <p 
                          className="text-sm font-bold text-slate-900 transition-colors"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--store-color-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '';
                          }}
                        >
                          {client.name}
                        </p>
                        {client.email && (
                          <p className="text-xs text-slate-400 mt-0.5">{client.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {formatDocument(client.document)}
                      </td>
                      <td className="px-6 py-4">
                        {phoneFormatted ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                            <Smartphone size={14} /> {phoneFormatted}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-xs">Não informado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('[ClientList] Client:', client.id, 'Stores:', client.stores, 'Type:', typeof client.stores, 'IsArray:', Array.isArray(client.stores));
                          }
                          
                          const stores = client.stores;
                          if (stores && (Array.isArray(stores) ? stores.length > 0 : Object.keys(stores).length > 0)) {
                            const storesArray = Array.isArray(stores) ? stores : Object.values(stores);
                            
                            return (
                              <div className="flex flex-col gap-1">
                                {storesArray.map((store: any, index: number) => (
                                  <span 
                                    key={store?.id || index}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: 'var(--store-color-light)',
                                      color: 'var(--store-color-dark)',
                                    }}
                                  >
                                    {store?.name || 'Loja sem nome'}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          
                          return (
                            <span 
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100"
                            >
                              Sem loja
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {hasPermission('clients.read') && (
                            <button 
                              title="Ver histórico"
                              onClick={() => navigate(`/clients/${client.id}`)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {hasPermission('clients.update') && (
                            <button 
                              title="Editar cliente"
                              onClick={() => navigate(`/clients/${client.id}/edit`)}
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
                          {selectedStore && 
                           Array.isArray(client.stores) && 
                           !client.stores.some(store => store.id === selectedStore.id) && 
                           hasPermission('clients.update') && (
                            <button 
                              title="Migrar para esta loja"
                              onClick={() => handleMigrate(client)}
                              disabled={migrating === client.id}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {migrating === client.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <ArrowRight size={16} />
                              )}
                            </button>
                          )}
                          {hasPermission('clients.delete') && (
                            <button 
                              title="Excluir cliente"
                              onClick={() => handleDeleteClick(client)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={(page) => {
              const params: any = {};
              if (searchName) params.search = searchName;
              if (searchDocument) params.document = searchDocument;
              if (searchPhone) params.phone = searchPhone;
              if (dateFrom) params.date_from = dateFrom;
              if (dateTo) params.date_to = dateTo;
              if (selectedStores.length > 0 && !selectedStores.includes('all')) {
                const storeIds = selectedStores
                  .filter(id => id !== 'all' && !isNaN(parseInt(id)))
                  .map(id => parseInt(id));
                if (storeIds.length > 0) {
                  params.stores = storeIds;
                }
              }
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              fetchClients(page, params);
            }}
            itemName="clientes"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setClientToDelete(null);
          }
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setClientToDelete(null);
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
    </div>
  );
};
