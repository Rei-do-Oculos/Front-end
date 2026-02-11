import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination } from '../../components/Common';
import { useFrameTypes } from '../../services/hooks/useFrameTypes';
import { FrameType, CreateFrameTypeDto, UpdateFrameTypeDto } from '../../services/api/frameTypes';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';

export const FrameTypeList: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { selectedStore } = useStore();
  const { frameTypes, loading, error, pagination, fetchFrameTypes, deleteFrameType, createFrameType, updateFrameType, getFrameType } = useFrameTypes({
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
  const [frameTypeToDelete, setFrameTypeToDelete] = useState<FrameType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingFrameType, setEditingFrameType] = useState<FrameType | null>(null);
  const [formData, setFormData] = useState<CreateFrameTypeDto>({ name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingFrameType, setLoadingFrameType] = useState(false);

  // Carregar dados iniciais; refetch ao trocar de loja (API pode usar X-Store-ID)
  useEffect(() => {
    const loadFrameTypes = async () => {
      try {
        await fetchFrameTypes(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        });
      } catch (err) {
        console.error('Erro ao carregar tipos de armação:', err);
      }
    };
    loadFrameTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, selectedStore?.id]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    if (searchName) params.search = searchName;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchFrameTypes(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = {};
      if (searchName) params.search = searchName;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      params.per_page = perPage;
      await fetchFrameTypes(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchName('');
    
    try {
      await fetchFrameTypes(1, {
        order_by: sortBy || 'id',
        order_dir: sortDirection || 'desc',
        per_page: perPage,
      });
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    try {
      const params: any = {
        per_page: newPerPage,
      };
      if (searchName) params.search = searchName;
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      await fetchFrameTypes(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleCreate = () => {
    if (!selectedStore?.id) {
      showError('Selecione uma loja no cabeçalho para cadastrar o tipo de armação.');
      return;
    }
    setEditingFrameType(null);
    setFormData({ name: '' });
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleEdit = async (frameType: FrameType) => {
    setEditingFrameType(frameType);
    setFormData({ name: frameType.name || '' });
    setFormError(null);
    setLoadingFrameType(true);
    setFormModalOpen(true);
    
    try {
      const frameTypeData = await getFrameType(String(frameType.id));
      if (frameTypeData) {
        setFormData({ name: frameTypeData.name || '' });
      }
    } catch (err: any) {
      console.error('Erro ao carregar tipo de armação:', err);
      showError(err.message || 'Erro ao carregar dados do tipo de armação');
    } finally {
      setLoadingFrameType(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('O nome é obrigatório');
      return;
    }
    if (!editingFrameType && !selectedStore?.id) {
      setFormError('Selecione uma loja no cabeçalho para cadastrar o tipo de armação.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, store_id: selectedStore?.id };
      if (editingFrameType) {
        await updateFrameType(String(editingFrameType.id), payload);
        showSuccess('Tipo de armação atualizado com sucesso!');
      } else {
        await createFrameType(payload);
        showSuccess('Tipo de armação criado com sucesso!');
      }

      setFormModalOpen(false);
      setFormData({ name: '' });
      setEditingFrameType(null);
      await fetchFrameTypes(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao salvar tipo de armação:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar tipo de armação';
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (frameType: FrameType) => {
    setFrameTypeToDelete(frameType);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!frameTypeToDelete) return;

    setDeleting(true);
    try {
      await deleteFrameType(String(frameTypeToDelete.id));
      setDeleteModalOpen(false);
      setFrameTypeToDelete(null);
      await fetchFrameTypes(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao excluir tipo de armação:', err);
      showError(err.message || 'Erro ao excluir tipo de armação');
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

  // Garantir que frameTypes seja sempre um array
  const frameTypesList = Array.isArray(frameTypes) ? frameTypes : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Tipos de Armação</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie o catálogo de tipos de armação disponíveis.</p>
          </div>
        </div>
        {hasPermission('frame-types.create') && (
          <Button onClick={handleCreate}>
            <Plus size={18} /> Novo Tipo de Armação
          </Button>
        )}
      </div>


      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input 
          label="Nome do Tipo de Armação" 
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
                      <span className="text-sm text-slate-500">Carregando tipos de armação...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar tipos de armação</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : frameTypesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhum tipo de armação encontrado</span>
                  </td>
                </tr>
              ) : (
                frameTypesList.map((frameType) => (
                  <tr key={frameType.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">#{frameType.id}</td>
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
                        {frameType.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                      {formatDate(frameType.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('frame-types.update') && (
                          <button 
                            title="Editar tipo de armação"
                            onClick={() => handleEdit(frameType)}
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
                        {hasPermission('frame-types.delete') && (
                          <button 
                            title="Excluir tipo de armação"
                            onClick={() => handleDeleteClick(frameType)}
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
              const params: any = {};
              if (searchName) params.search = searchName;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              params.per_page = perPage;
              fetchFrameTypes(page, params);
            }}
            itemName="tipos de armação"
          />
        )}
      </Card>

      {/* Modal de Formulário (Criar/Editar) */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => {
          if (!saving && !loadingFrameType) {
            setFormModalOpen(false);
            setFormData({ name: '' });
            setEditingFrameType(null);
            setFormError(null);
          }
        }}
        title={editingFrameType ? 'Editar Tipo de Armação' : 'Novo Tipo de Armação'}
      >
        {loadingFrameType ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--store-color)' }} />
            <span className="ml-3 text-slate-600">Carregando dados do tipo de armação...</span>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="mb-4 border rounded-xl p-3" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>{formError}</p>
              </div>
            )}

            <Input
              label="Nome do Tipo de Armação *"
              placeholder="Ex: Acetato"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />


            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormModalOpen(false);
                  setFormData({ name: '' });
                  setEditingFrameType(null);
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
                    <Save size={18} /> {editingFrameType ? 'Atualizar' : 'Criar'} Tipo de Armação
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
            setFrameTypeToDelete(null);
          }
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir o tipo de armação <strong>{frameTypeToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setFrameTypeToDelete(null);
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
