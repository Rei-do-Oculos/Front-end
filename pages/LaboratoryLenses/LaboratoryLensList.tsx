import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, Glasses, Building2 } from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard, Badge } from '../../components/Common';
import { useLaboratoryLenses } from '../../services/hooks/useLaboratoryLenses';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { LaboratoryLens } from '../../services/api/laboratoryLenses';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useNavigate } from 'react-router-dom';

export const LaboratoryLensList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { laboratoryLenses, loading, error, pagination, fetchLaboratoryLenses, deleteLaboratoryLens } = useLaboratoryLenses({
    autoFetch: false,
  });
  const { laboratories, fetchLaboratories } = useLaboratories({ autoFetch: false });

  const [searchName, setSearchName] = useState('');
  const [filterLaboratory, setFilterLaboratory] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  const activeFilters = useActiveFilters({
    searchName,
    filterLaboratory,
  });
  const [lensToDelete, setLensToDelete] = useState<LaboratoryLens | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLaboratories(1, { per_page: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadLenses = async () => {
      try {
        await fetchLaboratoryLenses(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        });
      } catch (err) {
        console.error('Erro ao carregar lentes:', err);
      }
    };
    loadLenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    if (searchName) params.search = searchName;
    if (filterLaboratory) params.laboratory_id = filterLaboratory;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchLaboratoryLenses(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    try {
      const params: any = {};
      if (searchName) params.search = searchName;
      if (filterLaboratory) params.laboratory_id = filterLaboratory;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      params.per_page = perPage;
      await fetchLaboratoryLenses(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchName('');
    setFilterLaboratory('');
    
    try {
      await fetchLaboratoryLenses(1, {
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
      if (filterLaboratory) params.laboratory_id = filterLaboratory;
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      await fetchLaboratoryLenses(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleDeleteClick = (lens: LaboratoryLens) => {
    setLensToDelete(lens);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lensToDelete) return;

    setDeleting(true);
    try {
      await deleteLaboratoryLens(String(lensToDelete.id));
      setDeleteModalOpen(false);
      setLensToDelete(null);
      showSuccess('Lente excluída com sucesso!');
      await fetchLaboratoryLenses(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao excluir lente:', err);
      showError(err.message || 'Erro ao excluir lente');
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
      });
    } catch (e) {
      return dateString;
    }
  };

  const lensesList = Array.isArray(laboratoryLenses) ? laboratoryLenses : [];
  const laboratoriesList = Array.isArray(laboratories) ? laboratories : [];

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Lentes de Laboratório</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie os produtos/lentes de cada laboratório.</p>
          </div>
        </div>
        {hasPermission('laboratory-lenses.create') && (
          <Button onClick={() => navigate('/laboratory-lenses/create')}>
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
        <SingleSelect
          label="Laboratório"
          value={filterLaboratory}
          onChange={(val) => setFilterLaboratory(val)}
          options={laboratoriesList.map((lab) => ({ value: String(lab.id), label: lab.name }))}
          placeholder="Todos os laboratórios"
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
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Laboratório</th>
                <SortableHeader
                  label="Preço Custo"
                  sortKey="cost_price"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Previsão"
                  sortKey="delivery_days"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
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
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando lentes...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar lentes</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : lensesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhuma lente encontrada</span>
                  </td>
                </tr>
              ) : (
                lensesList.map((lens) => (
                  <tr key={lens.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">#{lens.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                          <Glasses size={18} style={{ color: 'var(--store-color)' }} />
                        </div>
                        <div>
                          <p 
                            className="text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                            onClick={() => navigate(`/laboratory-lenses/${lens.id}/edit`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            {lens.name}
                          </p>
                          {lens.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{lens.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lens.laboratory ? (
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{lens.laboratory.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {formatCurrency(lens.cost_price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {lens.delivery_days != null ? `${lens.delivery_days} dias` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={lens.active ? 'success' : 'danger'}>
                        {lens.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                      {formatDate(lens.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('laboratory-lenses.update') && (
                          <button 
                            title="Editar lente"
                            onClick={() => navigate(`/laboratory-lenses/${lens.id}/edit`)}
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
                        {hasPermission('laboratory-lenses.delete') && (
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
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            onPageChange={(page) => {
              const params: any = {};
              if (searchName) params.search = searchName;
              if (filterLaboratory) params.laboratory_id = filterLaboratory;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              params.per_page = perPage;
              fetchLaboratoryLenses(page, params);
            }}
            itemName="lentes"
          />
        )}
      </Card>

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
