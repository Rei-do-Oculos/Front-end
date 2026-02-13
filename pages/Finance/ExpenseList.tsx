import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Loader2, Receipt } from 'lucide-react';
import { Card, Button, Input, MultiSelect, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, AccessDeniedCard } from '../../components/Common';
import { useExpenses } from '../../services/hooks/useExpenses';
import { useStores } from '../../services/hooks/useStores';
import { useStore } from '../../contexts/StoreContext';
import { Expense, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../../services/api/expenses';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useNavigate } from 'react-router-dom';

export const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { selectedStore } = useStore();
  const { expenses, loading, error, pagination, fetchExpenses, deleteExpense } = useExpenses({ autoFetch: false });
  const { stores, fetchStores } = useStores({ autoFetch: false });

  const [searchName, setSearchName] = useState('');
  const [filterStores, setFilterStores] = useState<string[]>([]);
  const [filterPaymentMethods, setFilterPaymentMethods] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState(15);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const storesList = Array.isArray(stores) ? stores : [];
  const showStoreFilter = storesList.length > 1;
  const paymentMethodOptions = (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([value, label]) => ({ value, label }));
  const activeFilters = useActiveFilters({
    searchName,
    filterStores: showStoreFilter ? filterStores : undefined,
    filterPaymentMethods: filterPaymentMethods,
    filterDateFrom: filterDateFrom || undefined,
    filterDateTo: filterDateTo || undefined,
  });

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Refetch ao trocar de loja ou per page; preserva filtros aplicados
  useEffect(() => {
    const load = async () => {
      try {
        await fetchExpenses(1, buildParams(1));
      } catch (err) {
        console.error('Erro ao carregar despesas:', err);
      }
    };
    load();
  }, [perPage, selectedStore?.id]);

  const buildParams = (page: number) => {
    const params: any = { per_page: perPage, page, order_by: sortBy || 'created_at', order_dir: sortDirection || 'desc' };
    if (searchName) params.search = searchName;
    if (showStoreFilter && filterStores.length > 0) params.store_id = filterStores.map((id) => parseInt(id, 10));
    if (filterPaymentMethods.length > 0) params.payment_method = filterPaymentMethods;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    return params;
  };

  const handleSort = (key: string, direction: SortDirection) => {
    const dir = direction || 'asc';
    setSortBy(key);
    setSortDirection(dir);
    const params: any = { per_page: perPage, page: pagination?.currentPage || 1, order_by: key, order_dir: dir };
    if (searchName) params.search = searchName;
    if (showStoreFilter && filterStores.length > 0) params.store_id = filterStores.map((id) => parseInt(id, 10));
    if (filterPaymentMethods.length > 0) params.payment_method = filterPaymentMethods;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    fetchExpenses(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    await fetchExpenses(1, buildParams(1));
  };

  const handleClearFilters = () => {
    setSearchName('');
    setFilterStores([]);
    setFilterPaymentMethods([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    fetchExpenses(1, { order_by: sortBy || 'created_at', order_dir: sortDirection || 'desc', per_page: perPage });
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    fetchExpenses(1, { ...buildParams(1), per_page: newPerPage });
  };

  const handleDeleteClick = (exp: Expense) => {
    setExpenseToDelete(exp);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      await deleteExpense(String(expenseToDelete.id));
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      showSuccess('Despesa excluída com sucesso!');
      await fetchExpenses(pagination?.currentPage || 1, buildParams(pagination?.currentPage || 1));
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir despesa');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const list = Array.isArray(expenses) ? expenses : [];

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  const canList = hasPermission('expenses.list') || hasPermission('expenses.read');
  if (!canList) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Despesas</h1>
            <p className="text-gray-500 font-medium mt-1">Despesas por loja para controle financeiro e lucro.</p>
          </div>
        </div>
        {hasPermission('expenses.create') && (
          <Button onClick={() => navigate('/finance/expenses/create')}>
            <Plus size={18} /> Nova Despesa
          </Button>
        )}
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <Input
          label="Nome da despesa"
          placeholder="Buscar por nome..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          type="date"
          label="Data inicial"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
        />
        <Input
          type="date"
          label="Data final"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full col-start-1 lg:col-span-4">
          <MultiSelect
            label="Forma de pagamento"
            value={filterPaymentMethods}
            onChange={setFilterPaymentMethods}
            options={paymentMethodOptions}
            placeholder="Todas"
          />
          {showStoreFilter && (
            <MultiSelect
              label="Loja"
              value={filterStores}
              onChange={setFilterStores}
              options={storesList.map((s) => ({ value: String(s.id), label: s.name || s.unity || `Loja ${s.id}` }))}
              placeholder="Todas as lojas"
            />
          )}
        </div>
      </FilterSection>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {pagination && (
            <p className="text-sm font-medium text-slate-600">
              {pagination.totalItems === 0 ? 'Nenhum resultado' : `${pagination.totalItems} resultado(s)`}
            </p>
          )}
          {activeFilters > 0 && <ActiveFiltersBadge count={activeFilters} />}
        </div>
        {pagination && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Mostrar:</label>
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
                <SortableHeader label="Nome" sortKey="name" currentSort={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Loja</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de pagamento</th>
                <SortableHeader label="Valor" sortKey="value" currentSort={sortBy} currentDirection={sortDirection} onSort={handleSort} className="px-6 py-4" />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando despesas...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar despesas</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{(error as Error).message}</p>
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">Nenhuma despesa encontrada</td>
                </tr>
              ) : (
                list.map((exp) => (
                  <tr key={exp.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                          <Receipt size={18} style={{ color: 'var(--store-color)' }} />
                        </div>
                        <p
                          className="text-sm font-bold text-slate-900 cursor-pointer hover:opacity-80"
                          onClick={() => hasPermission('expenses.read') && navigate(`/finance/expenses/${exp.id}/edit`)}
                        >
                          {exp.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {exp.store ? (exp.store.unity ? `${exp.store.name} (${exp.store.unity})` : exp.store.name) : exp.store_id ? `Loja ${exp.store_id}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {PAYMENT_METHOD_LABELS[exp.payment_method as keyof typeof PAYMENT_METHOD_LABELS] || exp.payment_method}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {formatCurrency(exp.value)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('expenses.update') && (
                          <button
                            title="Editar"
                            onClick={() => navigate(`/finance/expenses/${exp.id}/edit`)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all hover:text-[var(--store-color)]"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {hasPermission('expenses.delete') && (
                          <button
                            title="Excluir"
                            onClick={() => handleDeleteClick(exp)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all hover:text-red-600"
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
            onPageChange={(page) => fetchExpenses(page, buildParams(page))}
            itemName="despesas"
          />
        )}
      </Card>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && (setDeleteModalOpen(false), setExpenseToDelete(null))}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir a despesa <strong>{expenseToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => (setDeleteModalOpen(false), setExpenseToDelete(null))} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <><Loader2 size={16} className="animate-spin" /> Excluindo...</> : <><Trash2 size={16} /> Excluir</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
