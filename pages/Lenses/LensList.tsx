import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard } from '../../components/Common';
import { useLenses } from '../../services/hooks/useLenses';
import { Lens, CreateLensDto, UpdateLensDto } from '../../services/api/lenses';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';

export const LensList: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { selectedStore } = useStore();
  const { lenses, loading, error, pagination, fetchLenses, deleteLens, createLens, updateLens, getLens } = useLenses({
    autoFetch: false,
  });

  const [searchName, setSearchName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  // Calcular quantidade de filtros ativos usando hook padronizado
  const activeFilters = useActiveFilters({
    searchName,
  });
  const [lensToDelete, setLensToDelete] = useState<Lens | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingLens, setEditingLens] = useState<Lens | null>(null);
  const [formData, setFormData] = useState<CreateLensDto>({ name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingLens, setLoadingLens] = useState(false);
  const [isOtherStoreLens, setIsOtherStoreLens] = useState(false);

  // Carregar dados iniciais e ao trocar de loja (lentes = só da própria loja)
  useEffect(() => {
    const loadLenses = async () => {
      try {
        const params: Record<string, unknown> = {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        };
        if (selectedStore?.id) params.store_id = selectedStore.id;
        await fetchLenses(1, params);
      } catch (err) {
        console.error('Erro ao carregar lentes:', err);
      }
    };
    loadLenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, selectedStore?.id]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = { order_by: key, order_dir: newDirection, per_page: perPage };
    if (searchName) params.search = searchName;
    if (selectedStore?.id) params.store_id = selectedStore.id;
    
    fetchLenses(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = { per_page: perPage };
      if (searchName) params.search = searchName;
      if (sortBy) params.order_by = sortBy;
      if (sortBy) params.order_dir = sortDirection || 'desc';
      if (selectedStore?.id) params.store_id = selectedStore.id;
      await fetchLenses(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchName('');
    try {
      const params: any = { order_by: sortBy || 'id', order_dir: sortDirection || 'desc', per_page: perPage };
      if (selectedStore?.id) params.store_id = selectedStore.id;
      await fetchLenses(1, params);
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    try {
      const params: any = { per_page: newPerPage };
      if (searchName) params.search = searchName;
      if (sortBy) params.order_by = sortBy;
      if (sortBy) params.order_dir = sortDirection || 'desc';
      if (selectedStore?.id) params.store_id = selectedStore.id;
      await fetchLenses(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleCreate = () => {
    if (!selectedStore?.id) {
      showError('Selecione uma loja no cabeçalho para cadastrar a lente.');
      return;
    }
    setEditingLens(null);
    setIsOtherStoreLens(false);
    setFormData({ name: '' });
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleEdit = async (lens: Lens) => {
    setEditingLens(lens);
    setFormError(null);
    setFormData({ name: lens.name || '' });
    setIsOtherStoreLens(false); // Lista já filtrada por loja = lente pertence à loja atual
    setFormModalOpen(true);
    setLoadingLens(true);
    
    try {
      const lensData = await getLens(String(lens.id));
      if (lensData?.name) setFormData({ name: lensData.name });
    } catch (err: any) {
      console.error('Erro ao carregar lente:', err);
      showError(err.message || 'Erro ao carregar dados da lente');
    } finally {
      setLoadingLens(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('O nome é obrigatório');
      return;
    }

    if (!editingLens && !selectedStore?.id) {
      setFormError('Selecione uma loja no cabeçalho para cadastrar a lente.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateLensDto | UpdateLensDto = {
        ...formData,
        store_id: selectedStore?.id,
      };
      
      if (editingLens) {
        await updateLens(String(editingLens.id), payload);
        showSuccess('Lente atualizada com sucesso!');
      } else {
        await createLens(payload);
        showSuccess('Lente criada com sucesso!');
      }

      setFormModalOpen(false);
      setFormData({ name: '' });
      setEditingLens(null);
      setIsOtherStoreLens(false);
      const params: any = {};
      if (selectedStore?.id) params.store_id = selectedStore.id;
      await fetchLenses(pagination.currentPage, params);
    } catch (err: any) {
      console.error('Erro ao salvar lente:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar lente';
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (lens: Lens) => {
    setLensToDelete(lens);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lensToDelete) return;

    setDeleting(true);
    try {
      await deleteLens(String(lensToDelete.id));
      setDeleteModalOpen(false);
      setLensToDelete(null);
      const params: any = {};
      if (selectedStore?.id) params.store_id = selectedStore.id;
      await fetchLenses(pagination.currentPage, params);
    } catch (err: any) {
      console.error('Erro ao excluir lente:', err);
      showError(err.message || 'Erro ao excluir lente');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      if (dateString.includes('/')) {
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        
        const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
        
        if (isNaN(date.getTime())) {
          return dateString;
        }
        
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } else {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    } catch (e) {
      console.error('Erro ao formatar data:', e, dateString);
      return dateString;
    }
  };

  // Garantir que lenses seja sempre um array
  const lensesList = Array.isArray(lenses) ? lenses : [];

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Lentes</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie o catálogo de lentes disponíveis.</p>
          </div>
        </div>
        {hasPermission('lenses.create') && (
          <Button onClick={handleCreate}>
            <Plus size={18} /> Nova Lente
          </Button>
        )}
      </div>


      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input 
          label="Nome da Lente" 
          placeholder="Buscar por nome..." 
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </FilterSection>

      {/* Contagem de resultados, badge de filtros ativos e seletor de itens por página */}
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
                  label="ID"
                  sortKey="id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Nome"
                  sortKey="name"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Cadastro"
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
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando lentes...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar lentes</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : lensesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhuma lente encontrada</span>
                  </td>
                </tr>
              ) : (
                lensesList.map((lens) => {
                  // Lista já é filtrada por loja: se está na lista, pertence à loja atual
                  const isCurrentStore = true;
                  
                  return (
                    <tr key={lens.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">#{lens.id}</td>
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
                          {lens.name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                        {formatDate(lens.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {hasPermission('lenses.update') && isCurrentStore && (
                            <button 
                              title="Editar lente"
                              onClick={() => handleEdit(lens)}
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
                          {hasPermission('lenses.update') && !isCurrentStore && (
                            <button 
                              title="Não é possível editar lente de outra loja"
                              disabled
                              className="p-2 text-slate-200 cursor-not-allowed rounded-xl"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {hasPermission('lenses.delete') && isCurrentStore && (
                            <button 
                              title="Excluir lente"
                              onClick={() => handleDeleteClick(lens)}
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
                          {hasPermission('lenses.delete') && !isCurrentStore && (
                            <button 
                              title="Não é possível excluir lente de outra loja"
                              disabled
                              className="p-2 text-slate-200 cursor-not-allowed rounded-xl"
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
              const params: any = { per_page: perPage };
              if (searchName) params.search = searchName;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              if (selectedStore?.id) params.store_id = selectedStore.id;
              fetchLenses(page, params);
            }}
            itemName="lentes"
          />
        )}
      </Card>

      {/* Modal de Formulário (Criar/Editar) */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => {
          if (!saving && !loadingLens) {
            setFormModalOpen(false);
            setFormData({ name: '' });
            setEditingLens(null);
            setIsOtherStoreLens(false);
            setFormError(null);
          }
        }}
        title={editingLens ? 'Editar Lente' : 'Nova Lente'}
      >
        {loadingLens ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--store-color)' }} />
            <span className="ml-3 text-slate-600">Carregando dados da lente...</span>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="mb-4 border rounded-xl p-3" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>{formError}</p>
              </div>
            )}

            {isOtherStoreLens && (
              <div className="p-4 rounded-xl border-2 border-red-400 bg-red-50">
                <p className="text-sm text-red-800">Esta lente pertence a outra loja. Você pode visualizar, mas não pode editar.</p>
              </div>
            )}

            {!editingLens && selectedStore && (
              <div className="space-y-1.5 lg:space-y-2 w-full">
                <span className="text-[10px] lg:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">Loja</span>
                <p className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700">
                  {selectedStore.fancy_name || selectedStore.name}
                </p>
              </div>
            )}

            <Input
              label="Nome da Lente *"
              placeholder="Ex: Varilux Physio 3.0"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isOtherStoreLens}
            />

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormModalOpen(false);
                  setFormData({ name: '' });
                  setEditingLens(null);
                  setIsOtherStoreLens(false);
                  setFormError(null);
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} /> {editingLens ? 'Atualizar' : 'Criar'} Lente
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setLensToDelete(null);
          }
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir a lente <strong>{lensToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setLensToDelete(null);
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
