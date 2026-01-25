import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination } from '../../components/Common';
import { useLenses } from '../../services/hooks/useLenses';
import { Lens, CreateLensDto, UpdateLensDto } from '../../services/api/lenses';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';

export const LensList: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { lenses, loading, error, pagination, fetchLenses, deleteLens, createLens, updateLens, getLens } = useLenses({
    autoFetch: false,
  });

  const [searchName, setSearchName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
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

  // Carregar dados iniciais
  useEffect(() => {
    const loadLenses = async () => {
      try {
        await fetchLenses(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
        });
      } catch (err) {
        console.error('Erro ao carregar lentes:', err);
      }
    };
    loadLenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    if (searchName) params.search = searchName;
    
    params.order_by = key;
    params.order_dir = newDirection;
    
    fetchLenses(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = {};
      if (searchName) params.search = searchName;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      await fetchLenses(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchName('');
    
    try {
      await fetchLenses(1, {
        order_by: sortBy || 'id',
        order_dir: sortDirection || 'desc',
      });
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handleCreate = () => {
    setEditingLens(null);
    setFormData({ name: '' });
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleEdit = async (lens: Lens) => {
    setEditingLens(lens);
    setFormData({ name: lens.name || '' });
    setFormError(null);
    setLoadingLens(true);
    setFormModalOpen(true);
    
    try {
      const lensData = await getLens(String(lens.id));
      if (lensData) {
        setFormData({ name: lensData.name || '' });
      }
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

    setSaving(true);
    try {
      if (editingLens) {
        await updateLens(String(editingLens.id), formData);
        showSuccess('Lente atualizada com sucesso!');
      } else {
        await createLens(formData);
        showSuccess('Lente criada com sucesso!');
      }

      setFormModalOpen(false);
      setFormData({ name: '' });
      setEditingLens(null);
      await fetchLenses(pagination.currentPage, {});
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
      await fetchLenses(pagination.currentPage, {});
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Lentes</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie o catálogo de lentes disponíveis.</p>
          </div>
          <ActiveFiltersBadge count={activeFilters} />
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
                  <td colSpan={5} className="px-6 py-12 text-center">
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
                lensesList.map((lens) => (
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
                        {hasPermission('lenses.update') && (
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
                        {hasPermission('lenses.delete') && (
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
            onPageChange={(page) => {
              const params: any = {};
              if (searchName) params.search = searchName;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
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

            <Input
              label="Nome da Lente *"
              placeholder="Ex: Varilux Physio 3.0"
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
                  setEditingLens(null);
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
