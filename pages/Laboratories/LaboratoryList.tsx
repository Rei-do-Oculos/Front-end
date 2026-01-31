import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, Building2, Phone, Mail, Clock, Eye } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard, Badge } from '../../components/Common';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { Laboratory } from '../../services/api/laboratories';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useNavigate } from 'react-router-dom';

export const LaboratoryList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { laboratories, loading, error, pagination, fetchLaboratories, deleteLaboratory } = useLaboratories({
    autoFetch: false,
  });

  const [searchName, setSearchName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  const activeFilters = useActiveFilters({
    searchName,
  });
  const [laboratoryToDelete, setLaboratoryToDelete] = useState<Laboratory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lensesCount, setLensesCount] = useState<number>(0);
  const [confirmWithLenses, setConfirmWithLenses] = useState(false);

  useEffect(() => {
    const loadLaboratories = async () => {
      try {
        await fetchLaboratories(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        });
      } catch (err) {
        console.error('Erro ao carregar laboratórios:', err);
      }
    };
    loadLaboratories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    if (searchName) params.search = searchName;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchLaboratories(pagination?.currentPage || 1, params);
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
      await fetchLaboratories(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearchName('');
    
    try {
      await fetchLaboratories(1, {
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
      await fetchLaboratories(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleDeleteClick = (laboratory: Laboratory) => {
    setLaboratoryToDelete(laboratory);
    setLensesCount(0);
    setConfirmWithLenses(false);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!laboratoryToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteLaboratory(String(laboratoryToDelete.id), confirmWithLenses);
      
      // Se precisa de confirmação (tem lentes vinculadas)
      if (result.requires_confirmation) {
        setLensesCount(result.lenses_count || 0);
        setDeleting(false);
        return;
      }

      // Exclusão realizada com sucesso
      setDeleteModalOpen(false);
      setLaboratoryToDelete(null);
      setLensesCount(0);
      setConfirmWithLenses(false);
      
      const lensesDeleted = result.lenses_deleted || 0;
      if (lensesDeleted > 0) {
        showSuccess(`Laboratório e ${lensesDeleted} lente(s) excluídos com sucesso!`);
      } else {
        showSuccess('Laboratório excluído com sucesso!');
      }
      
      await fetchLaboratories(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao excluir laboratório:', err);
      showError(err.message || 'Erro ao excluir laboratório');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteWithLenses = async () => {
    setConfirmWithLenses(true);
    // Chamar novamente com confirmação
    if (!laboratoryToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteLaboratory(String(laboratoryToDelete.id), true);
      
      setDeleteModalOpen(false);
      setLaboratoryToDelete(null);
      setLensesCount(0);
      setConfirmWithLenses(false);
      
      const lensesDeleted = result.lenses_deleted || 0;
      showSuccess(`Laboratório e ${lensesDeleted} lente(s) excluídos com sucesso!`);
      
      await fetchLaboratories(pagination.currentPage, {});
    } catch (err: any) {
      console.error('Erro ao excluir laboratório:', err);
      showError(err.message || 'Erro ao excluir laboratório');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setLaboratoryToDelete(null);
    setLensesCount(0);
    setConfirmWithLenses(false);
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

  const laboratoriesList = Array.isArray(laboratories) ? laboratories : [];

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Laboratórios</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie os laboratórios parceiros.</p>
          </div>
        </div>
        {hasPermission('laboratories.create') && (
          <Button onClick={() => navigate('/laboratories/create')}>
            <Plus size={18} /> Novo Laboratório
          </Button>
        )}
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input 
          label="Nome do Laboratório" 
          placeholder="Buscar por nome..." 
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
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
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Contato</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Prazo</th>
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando laboratórios...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar laboratórios</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : laboratoriesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhum laboratório encontrado</span>
                  </td>
                </tr>
              ) : (
                laboratoriesList.map((laboratory) => (
                  <tr key={laboratory.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">#{laboratory.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                          <Building2 size={18} style={{ color: 'var(--store-color)' }} />
                        </div>
                        <div>
                          <p 
                            className="text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                            onClick={() => navigate(`/laboratories/${laboratory.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            {laboratory.name}
                          </p>
                          {laboratory.cnpj && (
                            <p className="text-xs text-slate-400">{laboratory.cnpj}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {laboratory.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone size={12} />
                            <span>{laboratory.phone}</span>
                          </div>
                        )}
                        {laboratory.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail size={12} />
                            <span>{laboratory.email}</span>
                          </div>
                        )}
                        {!laboratory.phone && !laboratory.email && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {laboratory.delivery_days ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-slate-600">
                          <Clock size={12} />
                          <span>{laboratory.delivery_days} dias</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={laboratory.active ? 'success' : 'danger'}>
                        {laboratory.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                      {formatDate(laboratory.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('laboratories.read') && (
                          <button 
                            title="Ver detalhes"
                            onClick={() => navigate(`/laboratories/${laboratory.id}`)}
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
                        {hasPermission('laboratories.update') && (
                          <button 
                            title="Editar laboratório"
                            onClick={() => navigate(`/laboratories/${laboratory.id}/edit`)}
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
                        {hasPermission('laboratories.delete') && (
                          <button 
                            title="Excluir laboratório"
                            onClick={() => handleDeleteClick(laboratory)}
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
              fetchLaboratories(page, params);
            }}
            itemName="laboratórios"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            handleCancelDelete();
          }
        }}
        title={lensesCount > 0 ? "Atenção: Laboratório com Lentes Vinculadas" : "Confirmar Exclusão"}
      >
        <div className="space-y-4">
          {lensesCount > 0 ? (
            <>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-bold text-amber-800 mb-2">
                  ⚠️ Este laboratório possui {lensesCount} lente(s) cadastrada(s)
                </p>
                <p className="text-xs text-amber-700">
                  Ao excluir o laboratório <strong>{laboratoryToDelete?.name}</strong>, todas as {lensesCount} lentes vinculadas também serão movidas para a lixeira.
                </p>
              </div>
              <p className="text-sm text-slate-700">
                Deseja continuar com a exclusão do laboratório e de todas as suas lentes?
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-700">
                Tem certeza que deseja excluir o laboratório <strong>{laboratoryToDelete?.name}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                O laboratório será movido para a lixeira e poderá ser restaurado posteriormente.
              </p>
            </>
          )}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleting}
            >
              Cancelar
            </Button>
            {lensesCount > 0 ? (
              <Button
                variant="danger"
                onClick={handleConfirmDeleteWithLenses}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Excluir Laboratório e Lentes
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Excluir
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
