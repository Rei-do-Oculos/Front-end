import React, { useState, useEffect } from 'react';
import { Search, Edit, Plus, FileText, Eye, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, MultiSelect, ActiveFiltersBadge, Badge, SortableHeader, SortDirection, Pagination, AccessDeniedCard } from '../../components/Common';
import { useClients } from '../../services/hooks/useClients';
import { useStores } from '../../services/hooks/useStores';
import { Client } from '../../services/api/clients';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { usePermission } from '../../services/hooks/usePermission';
import { useNotification } from '../../hooks/useNotification';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { maskCpfInput, maskPhoneInput } from '../../utils/formatters';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const { availableStores, selectedStore } = useStore();
  const { hasPermission } = usePermission();
  const { showSuccess, showError } = useNotification();
  const { clients, loading, error, pagination, fetchClients, deleteClient, migrateToStore } = useClients({
    autoFetch: false,
  });
  const { stores: storesForFilter, fetchStores: fetchStoresForFilter } = useStores({ autoFetch: false });

  const [searchName, setSearchName] = useState('');
  const [searchDocument, setSearchDocument] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<{ searchName: string; searchDocument: string; searchPhone: string; dateFrom: string; dateTo: string; selectedStores: string[] }>({ searchName: '', searchDocument: '', searchPhone: '', dateFrom: '', dateTo: '', selectedStores: [] });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [migrating, setMigrating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  // Calcular quantidade de filtros ativos usando hook padronizado
  const activeFilters = useActiveFilters({
    searchName: appliedFilters.searchName,
    searchDocument: appliedFilters.searchDocument,
    searchPhone: appliedFilters.searchPhone,
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
    selectedStores: appliedFilters.selectedStores.filter(s => s !== 'all'),
  });

  // Carregar lojas para o filtro (lista completa da API)
  useEffect(() => {
    fetchStoresForFilter(1, { per_page: 500 }).catch(() => {});
  }, [fetchStoresForFilter]);

  const buildParams = (f: typeof appliedFilters) => {
    const params: any = { order_by: sortBy || 'id', order_dir: sortDirection || 'desc', per_page: perPage };
    if (f.searchName) params.search = f.searchName;
    if (f.searchDocument) params.document = f.searchDocument.replace(/\D/g, '');
    if (f.searchPhone) params.phone = f.searchPhone.replace(/\D/g, '');
    if (f.dateFrom) params.date_from = f.dateFrom;
    if (f.dateTo) params.date_to = f.dateTo;
    if (f.selectedStores.length > 0 && !f.selectedStores.includes('all')) {
      const storeIds = f.selectedStores.filter(id => id !== 'all' && !isNaN(parseInt(id))).map(id => parseInt(id));
      if (storeIds.length > 0) params.stores = storeIds.join(',');
    }
    return params;
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        await fetchClients(1, buildParams(appliedFilters));
      } catch (err) {
        console.error('[ClientList] Erro ao carregar clientes:', err);
      }
    };
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, selectedStore?.id, appliedFilters, sortBy, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    const params = buildParams(appliedFilters);
    params.order_by = key;
    params.order_dir = newDirection;
    fetchClients(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    const next = { searchName, searchDocument, searchPhone, dateFrom, dateTo, selectedStores: [...selectedStores] };
    setAppliedFilters(next);
    try {
      const params = buildParams(next);
      params.order_by = sortBy || 'id';
      params.order_dir = sortDirection || 'desc';
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
    setAppliedFilters({ searchName: '', searchDocument: '', searchPhone: '', dateFrom: '', dateTo: '', selectedStores: [] });
    try {
      await fetchClients(1, { order_by: sortBy || 'id', order_dir: sortDirection || 'desc', per_page: perPage });
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    try {
      const params = buildParams(appliedFilters);
      params.per_page = newPerPage;
      await fetchClients(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
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
      showSuccess('Cliente excluído!', `O cliente "${clientToDelete.name}" foi excluído com sucesso.`);
      setDeleteModalOpen(false);
      setClientToDelete(null);
      await fetchClients(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir cliente';
      showError('Erro ao excluir cliente', errorMessage);
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

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Clientes</h1>
          <p className="text-gray-500 text-sm sm:text-base font-medium mt-1">Gerencie sua base de clientes e histórico de compras.</p>
        </div>
        {hasPermission('clients.create') && (
          <Button onClick={() => navigate('/clients/create')}>
            <Plus size={18} /> Novo Cliente
          </Button>
        )}
      </div>

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
          onChange={(e) => setSearchDocument(maskCpfInput(e.target.value))}
        />
        <Input 
          label="Telefone" 
          placeholder="(00) 00000-0000" 
          value={searchPhone}
          onChange={(e) => setSearchPhone(maskPhoneInput(e.target.value))}
        />
        <MultiSelect
          label="Lojas"
          placeholder="Selecione Lojas"
          options={[
            { label: 'Todas as Lojas', value: 'all' },
            ...(storesForFilter.length > 0 ? storesForFilter : availableStores).map(store => ({
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
        <Input 
          label="Data de Cadastro (De)" 
          type="date" 
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input 
          label="Data de Cadastro (Até)" 
          type="date" 
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </FilterSection>

      {/* Contagem de resultados, badge de filtros ativos e seletor de itens por página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
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
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[640px]">
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
                        {phoneFormatted && client.phone ? (
                          <a
                            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-emerald-600 font-bold text-xs hover:text-emerald-700 transition-colors"
                            title={`Abrir WhatsApp de ${client.name}`}
                          >
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="currentColor"
                              className="shrink-0"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            {phoneFormatted}
                          </a>
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
                                  <div key={store?.id || index} className="flex flex-col">
                                    <span 
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        store?.deleted 
                                          ? 'bg-red-50 text-red-600 border border-red-200' 
                                          : ''
                                      }`}
                                      style={!store?.deleted ? {
                                        backgroundColor: 'var(--store-color-light)',
                                        color: 'var(--store-color-dark)',
                                      } : undefined}
                                    >
                                      {store?.name || 'Loja sem nome'}
                                    </span>
                                    {store?.deleted && (
                                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-0.5">
                                        Excluída
                                      </span>
                                    )}
                                  </div>
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
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            onPageChange={(page) => {
              const params = buildParams(appliedFilters);
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
