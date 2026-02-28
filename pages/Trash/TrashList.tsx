import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Loader2, Trash2, Eye } from 'lucide-react';
import { Card, Button, Input, Select, FilterSection, Modal, Badge, SortableHeader, SortDirection, Pagination, ActiveFiltersBadge } from '../../components/Common';
import { useTrash } from '../../services/hooks/useTrash';
import { useNotification } from '../../hooks/useNotification';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useAuth } from '../../services/hooks/useAuth';
import { getEffectiveUserPermissions } from '../../utils/menuPermissions';
import type { TrashItem } from '../../services/api/trash';

const MODELS = [
  { value: '', label: 'Todos os Módulos' },
  { value: 'clients', label: 'Clientes' },
  { value: 'stores', label: 'Lojas' },
  { value: 'users', label: 'Usuários' },
  { value: 'roles', label: 'Perfis' },
  { value: 'permissions', label: 'Permissões' },
  { value: 'lenses', label: 'Lentes' },
];

export const TrashList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const { items: itemsFromHook, loading, error, pagination, fetchItems, restoreItem } = useTrash({
    autoFetch: false,
  });
  
  // Garantir que items seja sempre um array
  const items = Array.isArray(itemsFromHook) ? itemsFromHook : [];

  const [search, setSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', selectedModel: '' });
  const [sortBy, setSortBy] = useState<string | null>('deleted_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  const [restoreConfirmItem, setRestoreConfirmItem] = useState<TrashItem | null>(null);
  const [restoring, setRestoring] = useState(false);

  const canRestore = useMemo(() => {
    if (!user) return false;
    const permissions = getEffectiveUserPermissions(user);
    return permissions.some(p => p.name === 'trash.restore');
  }, [user]);

  const activeFilters = useActiveFilters({
    search: appliedFilters.search,
    selectedModel: appliedFilters.selectedModel,
  });

  useEffect(() => {
    const params: any = { order_by: sortBy || 'deleted_at', order_dir: sortDirection || 'desc', per_page: perPage };
    if (appliedFilters.search) params.search = appliedFilters.search;
    if (appliedFilters.selectedModel) params.model = appliedFilters.selectedModel;
    fetchItems(1, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, appliedFilters, sortBy, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDirection(direction || 'asc');
    const params: any = { order_by: key, order_dir: direction || 'asc', per_page: perPage };
    if (appliedFilters.search) params.search = appliedFilters.search;
    if (appliedFilters.selectedModel) params.model = appliedFilters.selectedModel;
    fetchItems(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    setAppliedFilters({ search, selectedModel });
    try {
      const params: any = { order_by: sortBy || 'deleted_at', order_dir: sortDirection || 'desc', per_page: perPage };
      if (search) params.search = search;
      if (selectedModel) params.model = selectedModel;
      await fetchItems(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setSearch('');
    setSelectedModel('');
    setAppliedFilters({ search: '', selectedModel: '' });
    try {
      await fetchItems(1, { order_by: sortBy || 'deleted_at', order_dir: sortDirection || 'desc', per_page: perPage });
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    const params: any = { order_by: sortBy || 'deleted_at', order_dir: sortDirection || 'desc', per_page: newPerPage };
    if (appliedFilters.search) params.search = appliedFilters.search;
    if (appliedFilters.selectedModel) params.model = appliedFilters.selectedModel;
    await fetchItems(1, params);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreConfirmItem) return;
    setRestoring(true);
    try {
      await restoreItem(restoreConfirmItem.model, restoreConfirmItem.id);
      showSuccess('Item restaurado!', `"${restoreConfirmItem.name}" foi restaurado com sucesso.`);
      setRestoreConfirmItem(null);
    } catch (err: any) {
      showError('Erro ao restaurar item', err.message || 'Não foi possível restaurar o item');
    } finally {
      setRestoring(false);
    }
  };

  const getModelBadgeColor = (model: string) => {
    const colors: Record<string, string> = {
      clients: 'bg-blue-100 text-blue-700',
      stores: 'bg-purple-100 text-purple-700',
      users: 'bg-green-100 text-green-700',
      roles: 'bg-yellow-100 text-yellow-700',
      permissions: 'bg-pink-100 text-pink-700',
      lenses: 'bg-indigo-100 text-indigo-700',
    };
    return colors[model] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Lixeira</h1>
          <p className="text-gray-500 font-medium mt-1">Itens excluídos do sistema</p>
        </div>
      </div>

      {error && (
        <div className="border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <p className="font-medium" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar lixeira: {error.message}</p>
        </div>
      )}

      <FilterSection onApply={handleApplyFilters} onClear={handleClearFilters}>
        <Input
          label="Buscar"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Módulo"
          options={MODELS}
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        />
      </FilterSection>

      {/* Contagem de resultados, badge de filtros ativos e seletor de itens por página */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {pagination && (
            <p className="text-sm font-medium text-slate-600">
              {pagination.totalItems === 0 ? 'Nenhum item encontrado' : 
               pagination.totalItems === 1 ? '1 item encontrado' : 
               `${pagination.totalItems} itens encontrados`}
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
                  label="Módulo"
                  sortKey="model"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <SortableHeader
                  label="Nome"
                  sortKey="name"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
                />
                <SortableHeader
                  label="Excluído em"
                  sortKey="deleted_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4 text-[10px]"
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
                      <span className="text-sm text-slate-500">Carregando lixeira...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar lixeira</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(items) || items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Trash2 size={48} className="text-slate-300" />
                      <span className="text-sm text-slate-500">Nenhum item encontrado na lixeira</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={`${item.model}-${item.id}`} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Badge className={getModelBadgeColor(item.model)}>
                        {item.model_label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {item.deleted_at || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Ver detalhes"
                          onClick={() => navigate(`/trash/item/${item.model}/${item.id}`, { state: { item } })}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl shadow-sm border border-transparent hover:border-slate-200 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        {canRestore && (
                          <button
                            title="Restaurar"
                            onClick={() => setRestoreConfirmItem(item)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl shadow-sm border border-transparent hover:border-slate-200 transition-all"
                          >
                            <RotateCcw size={16} />
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
              const params: any = { per_page: perPage, order_by: sortBy || 'deleted_at', order_dir: sortDirection || 'desc' };
              if (appliedFilters.search) params.search = appliedFilters.search;
              if (appliedFilters.selectedModel) params.model = appliedFilters.selectedModel;
              fetchItems(page, params);
            }}
            itemName="itens"
          />
        )}
      </Card>

      {/* Modal de confirmação para restaurar na lista */}
      <Modal
        isOpen={!!restoreConfirmItem}
        onClose={() => {
          if (!restoring) setRestoreConfirmItem(null);
        }}
        title="Restaurar item"
      >
        {restoreConfirmItem && (
          <div className="space-y-4">
            <p className="text-slate-600">
              Deseja restaurar <strong>"{restoreConfirmItem.name}"</strong> ({restoreConfirmItem.model_label})?
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setRestoreConfirmItem(null)} disabled={restoring}>
                Cancelar
              </Button>
              <Button onClick={handleRestoreConfirm} disabled={restoring}>
                {restoring ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Restaurando...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} /> Restaurar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
