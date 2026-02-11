import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, Button, Input, FilterSection, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, SingleSelect, AccessDeniedCard } from '../../components/Common';
import { useStoreFrames } from '../../services/hooks/useStoreFrames';
import { useStore } from '../../contexts/StoreContext';
import { StoreFrame } from '../../services/api/storeFrames';
import { useStores } from '../../services/hooks/useStores';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';

export const StoreFrameList: React.FC = () => {
  const { selectedStore } = useStore();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { storeFrames, loading, error, pagination, fetchStoreFrames } = useStoreFrames({
    autoFetch: false,
  });
  const { stores: storesForFilter, fetchStores: fetchStoresForFilter } = useStores({ autoFetch: false });

  // Estados dos filtros em edição (não aplicados ainda)
  const [filterCode, setFilterCode] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterFromStoreId, setFilterFromStoreId] = useState('');
  const [filterToStoreId, setFilterToStoreId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Estados dos filtros aplicados (usados na busca)
  const [appliedFilterCode, setAppliedFilterCode] = useState('');
  const [appliedFilterDescription, setAppliedFilterDescription] = useState('');
  const [appliedFilterFromStoreId, setAppliedFilterFromStoreId] = useState('');
  const [appliedFilterToStoreId, setAppliedFilterToStoreId] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  // Calcular quantidade de filtros ativos usando os filtros aplicados
  const activeFilters = useActiveFilters({
    filterCode: appliedFilterCode,
    filterDescription: appliedFilterDescription,
    filterFromStoreId: appliedFilterFromStoreId,
    filterToStoreId: appliedFilterToStoreId,
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
  });

  // Carregar lojas para o filtro
  useEffect(() => {
    const loadStores = async () => {
      try {
        await fetchStoresForFilter(1, { per_page: 500 });
      } catch (err) {
        console.error('Erro ao carregar lojas:', err);
      }
    };
    loadStores();
  }, [fetchStoresForFilter]);


  // Carregar dados iniciais; refetch ao trocar de loja
  useEffect(() => {
    const loadStoreFrames = async () => {
      try {
        await fetchStoreFrames(1, {
          order_by: sortBy || 'created_at',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        });
      } catch (err) {
        console.error('Erro ao carregar transferências:', err);
      }
    };
    loadStoreFrames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, selectedStore?.id]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    // Combinar código e descrição em uma única busca
    if (appliedFilterCode || appliedFilterDescription) {
      params.search = [appliedFilterCode, appliedFilterDescription].filter(Boolean).join(' ');
    }
    if (appliedFilterFromStoreId) params.from_store_id = appliedFilterFromStoreId;
    if (appliedFilterToStoreId) params.to_store_id = appliedFilterToStoreId;
    if (appliedDateFrom) params.date_from = appliedDateFrom;
    if (appliedDateTo) params.date_to = appliedDateTo;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchStoreFrames(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    // Aplicar filtros
    setAppliedFilterCode(filterCode);
    setAppliedFilterDescription(filterDescription);
    setAppliedFilterFromStoreId(filterFromStoreId);
    setAppliedFilterToStoreId(filterToStoreId);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);

    try {
      const params: any = {};
      // Combinar código e descrição em uma única busca
      if (filterCode || filterDescription) {
        params.search = [filterCode, filterDescription].filter(Boolean).join(' ');
      }
      if (filterFromStoreId) params.from_store_id = filterFromStoreId;
      if (filterToStoreId) params.to_store_id = filterToStoreId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      params.per_page = perPage;
      await fetchStoreFrames(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setFilterCode('');
    setFilterDescription('');
    setFilterFromStoreId('');
    setFilterToStoreId('');
    setDateFrom('');
    setDateTo('');
    
    setAppliedFilterCode('');
    setAppliedFilterDescription('');
    setAppliedFilterFromStoreId('');
    setAppliedFilterToStoreId('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    
    try {
      await fetchStoreFrames(1, {
        order_by: sortBy || 'created_at',
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
      const params: any = {};
      // Combinar código e descrição em uma única busca
      if (appliedFilterCode || appliedFilterDescription) {
        params.search = [appliedFilterCode, appliedFilterDescription].filter(Boolean).join(' ');
      }
      if (appliedFilterFromStoreId) params.from_store_id = appliedFilterFromStoreId;
      if (appliedFilterToStoreId) params.to_store_id = appliedFilterToStoreId;
      if (appliedDateFrom) params.date_from = appliedDateFrom;
      if (appliedDateTo) params.date_to = appliedDateTo;
      if (sortBy && sortDirection) {
        params.order_by = sortBy;
        params.order_dir = sortDirection;
      }
      params.per_page = newPerPage;
      await fetchStoreFrames(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Erro ao formatar data:', e, dateString);
      return dateString;
    }
  };

  // Garantir que storeFrames seja sempre um array
  const storeFramesList = Array.isArray(storeFrames) ? storeFrames : [];
  const storesList = Array.isArray(storesForFilter) ? storesForFilter : [];

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Transferências do estoque</h1>
          <p className="text-gray-500 font-medium mt-1">Transferências de armações da ótica para outras filiais</p>
        </div>
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        {/* Linha de cima: Código, Descrição */}
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
        {/* Linha de baixo: Loja origem, Loja destino, Data de, Data até */}
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SingleSelect
            label="Ótica origem"
            value={filterFromStoreId}
            onChange={setFilterFromStoreId}
            placeholder="Selecione a loja de origem..."
            options={[
              { label: 'Todas', value: '' },
              ...storesList.map(store => ({
                label: store.name,
                value: String(store.id)
              }))
            ]}
          />
          <SingleSelect
            label="Ótica destino"
            value={filterToStoreId}
            onChange={setFilterToStoreId}
            placeholder="Selecione a loja de destino..."
            options={[
              { label: 'Todas', value: '' },
              ...storesList.map(store => ({
                label: store.name,
                value: String(store.id)
              }))
            ]}
          />
          <Input 
            label="A partir:" 
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input 
            label="Até:" 
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </FilterSection>

      {/* Contagem de resultados, badge de filtros e seletor por página */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
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
                  label="N°"
                  sortKey="id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Descrição"
                  sortKey="frame_id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Gênero</th>
                <SortableHeader
                  label="Cadastrada em"
                  sortKey="created_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Ótica origem"
                  sortKey="from_store_id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Ótica destino"
                  sortKey="to_store_id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Data Transferência"
                  sortKey="created_at"
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
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                      <span className="text-sm text-slate-500">Carregando transferências...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-sm text-red-600">
                      Erro ao carregar transferências. Tente novamente.
                    </div>
                  </td>
                </tr>
              ) : storeFramesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-sm text-slate-500">
                      Nenhuma transferência encontrada.
                    </div>
                  </td>
                </tr>
              ) : (
                storeFramesList.map((storeFrame) => {
                  // Log para debug - verificar o que temos disponível
                  if (storeFramesList.indexOf(storeFrame) === 0) {
                    console.log('[StoreFrameList] Primeiro item processado:', {
                      id: storeFrame.id,
                      frame_id: storeFrame.frame_id,
                      from_store_id: storeFrame.from_store_id,
                      to_store_id: storeFrame.to_store_id,
                      hasFromStore: !!storeFrame.fromStore,
                      hasToStore: !!storeFrame.toStore,
                      hasRelationships: !!storeFrame.relationships,
                      fromStore: storeFrame.fromStore,
                      toStore: storeFrame.toStore,
                      relationships: storeFrame.relationships,
                    });
                  }
                  
                  const frame = storeFrame.frame || storeFrame.relationships?.frame;
                  const fromStore = storeFrame.fromStore || storeFrame.relationships?.from_store;
                  const toStore = storeFrame.toStore || storeFrame.relationships?.to_store;
                  
                  // Obter tipo e gênero do frame
                  const frameType = (frame as any)?.frameType || (frame as any)?.frame_type;
                  const gender = (frame as any)?.gender;
                  const frameCreatedAt = (frame as any)?.created_at;
                  
                  const formatGender = (g: string) => {
                    const genderMap: Record<string, string> = {
                      'masculino': 'Masculino',
                      'feminino': 'Feminino',
                      'unissex': 'Unissex',
                    };
                    return genderMap[g] || g;
                  };
                  
                  return (
                    <tr key={storeFrame.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {frame?.code || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {frame?.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {frameType?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {gender ? formatGender(gender) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {frameCreatedAt ? formatDate(frameCreatedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {fromStore?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {toStore?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(storeFrame.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          itemName="transferências"
          onPageChange={(page) => {
            const params: any = {};
            // Combinar código e descrição em uma única busca
            if (appliedFilterCode || appliedFilterDescription) {
              params.search = [appliedFilterCode, appliedFilterDescription].filter(Boolean).join(' ');
            }
            if (appliedFilterFromStoreId) params.from_store_id = appliedFilterFromStoreId;
            if (appliedFilterToStoreId) params.to_store_id = appliedFilterToStoreId;
            if (appliedDateFrom) params.date_from = appliedDateFrom;
            if (appliedDateTo) params.date_to = appliedDateTo;
            if (sortBy && sortDirection) {
              params.order_by = sortBy;
              params.order_dir = sortDirection;
            }
            params.per_page = perPage;
            fetchStoreFrames(page, params);
          }}
        />
      )}

    </div>
  );
};
