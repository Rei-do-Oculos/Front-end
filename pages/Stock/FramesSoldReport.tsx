import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Loader2 } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  FilterSection,
  ActiveFiltersBadge,
  SortableHeader,
  SortDirection,
  Pagination,
  MultiSelect,
  AccessDeniedCard,
} from '../../components/Common';
import { stockReportsService, FrameSoldItem } from '../../services/api/stockReports';
import { useFrameTypes } from '../../services/hooks/useFrameTypes';
import { useStores } from '../../services/hooks/useStores';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';
import { generateFramesSoldReportPdf } from '../../utils/framesSoldReportPdf';
import { formatDate } from '../../utils/formatters';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : (import.meta.env.VITE_API_URL || '').replace(/\/api(\/.*)?$/, '') || window.location.origin;
const buildLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/')) return `${API_BASE}${logoPath}`;
  const path = logoPath.startsWith('storage/') ? logoPath : `storage/${logoPath}`;
  return import.meta.env.DEV ? `/${path}` : `${API_BASE}/${path}`;
};

const genderLabels: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  unissex: 'Unissex',
};

export const FramesSoldReport: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { selectedStore, storeColor, storeLogo } = useStore();

  const [items, setItems] = useState<FrameSoldItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    totalQty: number;
    perPage: number;
  } | null>(null);

  // Filtros (edição)
  const [filterCode, setFilterCode] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterFrameTypeId, setFilterFrameTypeId] = useState<string[]>([]);
  const [filterStoreId, setFilterStoreId] = useState<string[]>([]);
  const [filterGender, setFilterGender] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filtros aplicados
  const [appliedFilterCode, setAppliedFilterCode] = useState('');
  const [appliedFilterDescription, setAppliedFilterDescription] = useState('');
  const [appliedFilterFrameTypeId, setAppliedFilterFrameTypeId] = useState<string[]>([]);
  const [appliedFilterStoreId, setAppliedFilterStoreId] = useState<string[]>([]);
  const [appliedFilterGender, setAppliedFilterGender] = useState<string[]>([]);
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const [sortBy, setSortBy] = useState<string | null>('completed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { frameTypes, fetchFrameTypes } = useFrameTypes({ autoFetch: false });
  const { stores: storesForFilter, fetchStores: fetchStoresForFilter } = useStores({ autoFetch: false });

  const activeFilters = useActiveFilters({
    filterCode: appliedFilterCode,
    filterDescription: appliedFilterDescription,
    filterFrameTypeId: appliedFilterFrameTypeId.filter((f) => f !== 'all'),
    filterStoreId: appliedFilterStoreId.filter((f) => f !== 'all'),
    filterGender: appliedFilterGender.filter((f) => f !== 'all'),
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
  });

  const frameTypesList = Array.isArray(frameTypes) ? frameTypes : [];
  const storesList = Array.isArray(storesForFilter) ? storesForFilter : [];

  const loadData = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        per_page: perPage,
        order_by: sortBy || 'completed_at',
        order_dir: sortDirection || 'desc',
      };
      if (appliedFilterCode) params.code = appliedFilterCode;
      if (appliedFilterDescription) params.description = appliedFilterDescription;
      if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId;
      if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId;
      if (appliedFilterGender.length > 0) params.gender = appliedFilterGender;
      if (appliedDateFrom) params.date_from = appliedDateFrom;
      if (appliedDateTo) params.date_to = appliedDateTo;

      const result = await stockReportsService.listFramesSold(params);
      setItems(result.data);
      setPagination({
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        totalQty: result.pagination.totalQty,
        perPage: result.pagination.perPage,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório');
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [perPage, sortBy, sortDirection, appliedFilterCode, appliedFilterDescription, appliedFilterFrameTypeId, appliedFilterStoreId, appliedFilterGender, appliedDateFrom, appliedDateTo]);

  const handleApplyFilters = () => {
    setAppliedFilterCode(filterCode);
    setAppliedFilterDescription(filterDescription);
    setAppliedFilterFrameTypeId([...filterFrameTypeId]);
    setAppliedFilterStoreId([...filterStoreId]);
    setAppliedFilterGender([...filterGender]);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const handleClearFilters = () => {
    setFilterCode('');
    setFilterDescription('');
    setFilterFrameTypeId([]);
    setFilterStoreId([]);
    setFilterGender([]);
    setDateFrom('');
    setDateTo('');
    setAppliedFilterCode('');
    setAppliedFilterDescription('');
    setAppliedFilterFrameTypeId([]);
    setAppliedFilterStoreId([]);
    setAppliedFilterGender([]);
    setAppliedDateFrom('');
    setAppliedDateTo('');
  };

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDirection(direction || 'desc');
  };

  const handlePageChange = (page: number) => {
    loadData(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
  };

  const handleExportPdf = async () => {
    if (!hasPermission('stock-reports.export')) return;
    setExportingPdf(true);
    try {
      const params: any = {
        order_by: sortBy || 'completed_at',
        order_dir: sortDirection || 'desc',
      };
      if (appliedFilterCode) params.code = appliedFilterCode;
      if (appliedFilterDescription) params.description = appliedFilterDescription;
      if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId;
      if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId;
      if (appliedFilterGender.length > 0) params.gender = appliedFilterGender;
      if (appliedDateFrom) params.date_from = appliedDateFrom;
      if (appliedDateTo) params.date_to = appliedDateTo;

      const { items: exportItems, total_qty: exportTotalQty } = await stockReportsService.exportFramesSold(params);

      const storeData = selectedStore
        ? {
            name: selectedStore.name,
            fancy_name: selectedStore.fancy_name,
            color: selectedStore.color,
            logo: selectedStore.logo,
          }
        : null;

      await generateFramesSoldReportPdf({
        items: exportItems,
        totalQty: exportTotalQty ?? exportItems.length,
        dateFrom: appliedDateFrom || undefined,
        dateTo: appliedDateTo || undefined,
        storeData,
        storeColor,
        storeLogo,
        logoUrlBuilder: buildLogoUrl,
      });

      showSuccess('PDF gerado com sucesso!');
    } catch (err: any) {
      showError(err.message || 'Erro ao gerar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    fetchFrameTypes(1, { per_page: 100 });
    fetchStoresForFilter(1, { per_page: 500 });
  }, [fetchFrameTypes, fetchStoresForFilter]);

  if (!hasPermission('stock-reports.list')) {
    return <AccessDeniedCard />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            Armações Vendidas nas OS
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Relatório de armações vendidas nas ordens de serviço finalizadas.
          </p>
        </div>
        {hasPermission('stock-reports.export') && (
          <Button onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileDown size={18} />
            )}{' '}
            Exportar PDF
          </Button>
        )}
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label="Código"
            placeholder="Buscar por código..."
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
          />
          <Input
            label="Descrição"
            placeholder="Buscar por descrição..."
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
          />
          <MultiSelect
            label="Tipo de Armação"
            value={filterFrameTypeId}
            onChange={setFilterFrameTypeId}
            placeholder="Selecione os tipos..."
            options={frameTypesList.map((ft) => ({ label: ft.name, value: String(ft.id) }))}
          />
          <MultiSelect
            label="Lojas"
            value={filterStoreId}
            onChange={setFilterStoreId}
            placeholder="Selecione as lojas..."
            options={storesList.map((store) => ({
              label: store.name,
              value: String(store.id),
            }))}
          />
          <MultiSelect
            label="Gênero"
            value={filterGender}
            onChange={setFilterGender}
            placeholder="Selecione os gêneros..."
            options={[
              { label: 'Masculino', value: 'masculino' },
              { label: 'Feminino', value: 'feminino' },
              { label: 'Unissex', value: 'unissex' },
            ]}
          />
        </div>
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data início (finalização)"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Data fim (finalização)"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </FilterSection>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {pagination && (
            <p className="text-sm font-medium text-slate-600">
              {pagination.totalItems === 0
                ? 'Nenhum resultado encontrado'
                : pagination.totalItems === 1
                ? '1 venda encontrada'
                : `${pagination.totalItems} vendas encontradas`}
            </p>
          )}
          {pagination && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: 'var(--store-color-light)',
                color: 'var(--store-color-dark)',
                border: '1px solid var(--store-color-opacity-20)',
              }}
            >
              <span className="tabular-nums">{pagination.totalQty.toLocaleString('pt-BR')}</span>
              <span>
                {pagination.totalQty === 1 ? 'armação vendida' : 'armações vendidas'}
              </span>
            </span>
          )}
          {activeFilters > 0 && <ActiveFiltersBadge count={activeFilters} />}
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
              <option value="15">15</option>
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
                  label="Código"
                  sortKey="frame_code"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Descrição"
                  sortKey="frame_description"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Tipo"
                  sortKey="frame_type_name"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Gênero"
                  sortKey="frame_gender"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="OS"
                  sortKey="os_number"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Loja
                </th>
                <SortableHeader
                  label="Data"
                  sortKey="completed_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: 'var(--store-color)' }}
                      />
                      <span className="text-sm text-slate-500">Carregando relatório...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div
                      className="border rounded-lg p-4"
                      style={{
                        backgroundColor: 'var(--store-color-light)',
                        borderColor: 'var(--store-color-opacity-20)',
                      }}
                    >
                      <p
                        className="text-sm font-bold mb-1"
                        style={{ color: 'var(--store-color-dark)' }}
                      >
                        Erro ao carregar relatório
                      </p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>
                        {error}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">
                      Nenhuma armação vendida encontrada no período
                    </span>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.pivot_id != null ? row.pivot_id : `frame-code-${row.service_order_id}`}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {row.frame_code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {row.frame_description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {row.frame_type_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {genderLabels[row.frame_gender] || row.frame_gender || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/service-orders/${row.service_order_id}`)}
                        className="text-sm font-bold hover:underline"
                        style={{ color: 'var(--store-color)' }}
                      >
                        #{row.os_number}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {row.store_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {row.completed_at ? formatDate(row.completed_at) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
