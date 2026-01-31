import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { Card, Button, Input, FilterSection, Modal, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination, MultiSelect, SingleSelect, AccessDeniedCard } from '../../components/Common';
import { useFrames } from '../../services/hooks/useFrames';
import { Frame } from '../../services/api/frames';
import { useFrameTypes } from '../../services/hooks/useFrameTypes';
import { useStores } from '../../services/hooks/useStores';
import { useStoreFrames } from '../../services/hooks/useStoreFrames';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';

export const FrameList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { frames, loading, error, pagination, fetchFrames, deleteFrame, getFrame } = useFrames({
    autoFetch: false,
  });
  const { frameTypes, fetchFrameTypes } = useFrameTypes({ autoFetch: false });
  const { stores: storesForFilter, fetchStores: fetchStoresForFilter } = useStores({ autoFetch: false });
  const { createStoreFrame } = useStoreFrames({ autoFetch: false });
  const { selectedStore } = useStore();

  // Estados dos filtros em edição (não aplicados ainda)
  const [filterCode, setFilterCode] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterFrameTypeId, setFilterFrameTypeId] = useState<string[]>([]);
  const [filterStoreId, setFilterStoreId] = useState<string[]>([]);
  const [filterGender, setFilterGender] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Estados dos filtros aplicados (usados na busca)
  const [appliedFilterCode, setAppliedFilterCode] = useState('');
  const [appliedFilterDescription, setAppliedFilterDescription] = useState('');
  const [appliedFilterFrameTypeId, setAppliedFilterFrameTypeId] = useState<string[]>([]);
  const [appliedFilterStoreId, setAppliedFilterStoreId] = useState<string[]>([]);
  const [appliedFilterGender, setAppliedFilterGender] = useState<string[]>([]);
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [frameToTransfer, setFrameToTransfer] = useState<Frame | null>(null);
  const [transferToStoreId, setTransferToStoreId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  // Calcular quantidade de filtros ativos usando os filtros aplicados
  const activeFilters = useActiveFilters({
    filterCode: appliedFilterCode,
    filterDescription: appliedFilterDescription,
    filterFrameTypeId: appliedFilterFrameTypeId.filter(f => f !== 'all'),
    filterStoreId: appliedFilterStoreId.filter(f => f !== 'all'),
    filterGender: appliedFilterGender.filter(f => f !== 'all'),
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
  });
  const [frameToDelete, setFrameToDelete] = useState<Frame | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carregar tipos de armação para o select
  useEffect(() => {
    const loadFrameTypes = async () => {
      try {
        await fetchFrameTypes(1, { per_page: 100 });
      } catch (err) {
        console.error('Erro ao carregar tipos de armação:', err);
      }
    };
    loadFrameTypes();
  }, [fetchFrameTypes]);

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

  // Carregar dados iniciais
  useEffect(() => {
    const loadFrames = async () => {
      try {
        await fetchFrames(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        });
      } catch (err) {
        console.error('Erro ao carregar armações:', err);
      }
    };
    loadFrames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    // Usar apenas os filtros aplicados (enviar como string separada por vírgula, igual clientes)
    if (appliedFilterCode) params.code = appliedFilterCode;
    if (appliedFilterDescription) params.description = appliedFilterDescription;
    if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId.join(',');
    if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId.join(',');
    if (appliedFilterGender.length > 0) params.gender = appliedFilterGender.join(',');
    if (appliedDateFrom) params.date_from = appliedDateFrom;
    if (appliedDateTo) params.date_to = appliedDateTo;
    
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchFrames(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    // Aplicar os filtros: copiar os valores de edição para os aplicados
    setAppliedFilterCode(filterCode);
    setAppliedFilterDescription(filterDescription);
    setAppliedFilterFrameTypeId([...filterFrameTypeId]);
    setAppliedFilterStoreId([...filterStoreId]);
    setAppliedFilterGender([...filterGender]);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);

    try {
      const params: any = {};
      if (filterCode) params.code = filterCode;
      if (filterDescription) params.description = filterDescription;
      // Enviar como string separada por vírgula, igual clientes (stores)
      if (filterFrameTypeId.length > 0) params.frame_type_id = filterFrameTypeId.join(',');
      if (filterStoreId.length > 0) params.store_id = filterStoreId.join(',');
      if (filterGender.length > 0) params.gender = filterGender.join(',');
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      
      params.per_page = perPage;
      await fetchFrames(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    // Limpar filtros em edição
    setFilterCode('');
    setFilterDescription('');
    setFilterFrameTypeId([]);
    setFilterStoreId([]);
    setFilterGender([]);
    setDateFrom('');
    setDateTo('');

    // Limpar filtros aplicados
    setAppliedFilterCode('');
    setAppliedFilterDescription('');
    setAppliedFilterFrameTypeId([]);
    setAppliedFilterStoreId([]);
    setAppliedFilterGender([]);
    setAppliedDateFrom('');
    setAppliedDateTo('');
    
    try {
      await fetchFrames(1, {
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
      // Usar apenas os filtros aplicados (string separada por vírgula, igual clientes)
      if (appliedFilterCode) params.code = appliedFilterCode;
      if (appliedFilterDescription) params.description = appliedFilterDescription;
      if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId.join(',');
      if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId.join(',');
      if (appliedFilterGender.length > 0) params.gender = appliedFilterGender.join(',');
      if (appliedDateFrom) params.date_from = appliedDateFrom;
      if (appliedDateTo) params.date_to = appliedDateTo;
      if (sortBy) {
        params.order_by = sortBy;
        params.order_dir = sortDirection || 'desc';
      }
      await fetchFrames(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleCreate = () => {
    navigate('/frames/create');
  };

  const handleEdit = (frame: Frame) => {
    navigate(`/frames/${frame.id}/edit`);
  };

  const handleDeleteClick = (frame: Frame) => {
    setFrameToDelete(frame);
    setDeleteModalOpen(true);
  };

  const handleTransferClick = async (frame: Frame) => {
    // Buscar detalhes completos do frame para garantir que temos latestStoreFrame carregado
    try {
      const frameDetails = await getFrame(String(frame.id));
      setFrameToTransfer(frameDetails || frame);
    } catch (err) {
      console.warn('Erro ao buscar detalhes do frame:', err);
      setFrameToTransfer(frame);
    }
    setTransferToStoreId('');
    setTransferNotes('');
    setTransferModalOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!frameToTransfer || !transferToStoreId) {
      showError('Selecione a loja de destino');
      return;
    }

    setTransferring(true);
    try {
      // Obter loja de origem (loja atual da armação)
      // Primeiro tenta pegar do latestStoreFrame (loja onde a armação está atualmente)
      let fromStoreId = frameToTransfer.latestStoreFrame?.toStore?.id || 
                        frameToTransfer.latest_store_frame?.to_store?.id || 
                        null;

      // Se não conseguir obter do latestStoreFrame, busca o frame completo para garantir que temos a informação
      if (!fromStoreId) {
        try {
          const frameDetails = await getFrame(frameToTransfer.id);
          fromStoreId = frameDetails?.latestStoreFrame?.toStore?.id || 
                       frameDetails?.latest_store_frame?.to_store?.id || 
                       null;
        } catch (err) {
          console.warn('Não foi possível buscar detalhes do frame:', err);
        }
      }

      // Se ainda não tiver, usa o selectedStore como último recurso
      if (!fromStoreId && selectedStore?.id) {
        fromStoreId = selectedStore.id;
      }

      // Validar que temos o from_store_id antes de criar a transferência
      if (!fromStoreId) {
        showError('Não foi possível determinar a loja de origem da armação. Por favor, tente novamente.');
        setTransferring(false);
        return;
      }

      await createStoreFrame({
        frame_id: frameToTransfer.id,
        from_store_id: fromStoreId, // ID da loja atual da armação (obrigatório para transferência)
        to_store_id: Number(transferToStoreId), // ID da loja de destino selecionada
        notes: transferNotes || null,
      });

      showSuccess('Transferência realizada com sucesso!');
      setTransferModalOpen(false);
      setFrameToTransfer(null);
      setTransferToStoreId('');
      setTransferNotes('');

      // Recarregar armações
      const params: any = {};
      if (appliedFilterCode) params.code = appliedFilterCode;
      if (appliedFilterDescription) params.description = appliedFilterDescription;
      if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId.join(',');
      if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId.join(',');
      if (appliedFilterGender.length > 0) params.gender = appliedFilterGender.join(',');
      if (appliedDateFrom) params.date_from = appliedDateFrom;
      if (appliedDateTo) params.date_to = appliedDateTo;
      if (sortBy && sortDirection) {
        params.order_by = sortBy;
        params.order_dir = sortDirection;
      }
      params.per_page = perPage;
      
      await fetchFrames(pagination.currentPage, params);
    } catch (err: any) {
      console.error('Erro ao transferir armação:', err);
      showError(err.message || 'Erro ao transferir armação');
    } finally {
      setTransferring(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!frameToDelete) return;

    setDeleting(true);
    try {
      await deleteFrame(String(frameToDelete.id));
      setDeleteModalOpen(false);
      setFrameToDelete(null);
      
      // Recarregar com os filtros aplicados
      const params: any = {};
      if (appliedFilterCode) params.code = appliedFilterCode;
      if (appliedFilterDescription) params.description = appliedFilterDescription;
      if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId.join(',');
      if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId.join(',');
      if (appliedFilterGender.length > 0) params.gender = appliedFilterGender.join(',');
      if (appliedDateFrom) params.date_from = appliedDateFrom;
      if (appliedDateTo) params.date_to = appliedDateTo;
      if (sortBy && sortDirection) {
        params.order_by = sortBy;
        params.order_dir = sortDirection;
      }
      params.per_page = perPage;
      
      await fetchFrames(pagination.currentPage, params);
    } catch (err: any) {
      console.error('Erro ao excluir armação:', err);
      showError(err.message || 'Erro ao excluir armação');
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

  const formatGender = (gender: string) => {
    const genderMap: Record<string, string> = {
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'unissex': 'Unissex',
    };
    return genderMap[gender] || gender;
  };

  // Garantir que frames seja sempre um array
  const framesList = Array.isArray(frames) ? frames : [];
  const frameTypesList = Array.isArray(frameTypes) ? frameTypes : [];
  const storesList = Array.isArray(storesForFilter) ? storesForFilter : [];

  const totalEstoque = pagination?.totalItems ?? 0;

  if (error && (error as any).status === 403) return <AccessDeniedCard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Armações</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie o catálogo de armações disponíveis.</p>
        </div>
        {hasPermission('frames.create') && (
          <Button onClick={handleCreate}>
            <Plus size={18} /> Nova Armação
          </Button>
        )}
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        {/* Linha de cima: Código, Descrição, Tipo, Lojas, Gênero */}
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
            options={frameTypesList.map(ft => ({ label: ft.name, value: String(ft.id) }))}
          />
          <MultiSelect
            label="Lojas"
            value={filterStoreId}
            onChange={setFilterStoreId}
            placeholder="Selecione as lojas..."
            options={storesList.map(store => ({ 
              label: store.name, 
              value: String(store.id) 
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
        {/* Linha de baixo: Criado em, Criado até */}
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Criado em" 
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input 
            label="Criado até" 
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </FilterSection>

      {/* Contagem de resultados, quantidade em estoque, badge de filtros e seletor por página */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {pagination && (
            <p className="text-sm font-medium text-slate-600">
              {pagination.totalItems === 0 ? 'Nenhum resultado encontrado' : 
               pagination.totalItems === 1 ? '1 resultado encontrado' : 
               `${pagination.totalItems} resultados encontrados`}
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
              <span className="tabular-nums">{totalEstoque.toLocaleString('pt-BR')}</span>
              <span>{totalEstoque === 1 ? 'armação em estoque' : 'armações em estoque'}</span>
            </span>
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
                  label="Código"
                  sortKey="code"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Descrição"
                  sortKey="description"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Tipo"
                  sortKey="frame_type_id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Gênero"
                  sortKey="gender"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Localização</th>
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
                      <span className="text-sm text-slate-500">Carregando armações...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar armações</p>
                      <p className="text-xs" style={{ color: 'var(--store-color)' }}>{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : framesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhuma armação encontrada</span>
                  </td>
                </tr>
              ) : (
                framesList.map((frame) => (
                  <tr key={frame.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">#{frame.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{frame.code}</p>
                    </td>
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
                        {frame.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const frameType = frame.frameType || frame.frame_type || frame.relationships?.frame_type;
                        if (!frameType) return <span className="text-xs text-slate-400">-</span>;
                        
                        const isDeleted = frameType.deleted || frameType.deleted_at;
                        return (
                          <div className="flex flex-col">
                            <span 
                              className={`text-xs font-medium ${isDeleted ? 'text-red-600' : 'text-slate-600'}`}
                            >
                              {frameType.name}
                            </span>
                            {isDeleted && (
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                                Excluído
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {formatGender(frame.gender)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {frame.latestStoreFrame?.toStore?.name ?? frame.latest_store_frame?.to_store?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                      {formatDate(frame.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('store-frames.create') && (
                          <button 
                            title="Transferir armação"
                            onClick={() => handleTransferClick(frame)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <ArrowRight size={16} />
                          </button>
                        )}
                        {hasPermission('frames.update') && (
                          <button 
                            title="Editar armação"
                            onClick={() => handleEdit(frame)}
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
                        {hasPermission('frames.delete') && (
                          <button 
                            title="Excluir armação"
                            onClick={() => handleDeleteClick(frame)}
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
              // Usar apenas os filtros aplicados
              if (appliedFilterCode) params.code = appliedFilterCode;
              if (appliedFilterDescription) params.description = appliedFilterDescription;
              if (appliedFilterFrameTypeId.length > 0) params.frame_type_id = appliedFilterFrameTypeId.join(',');
              if (appliedFilterStoreId.length > 0) params.store_id = appliedFilterStoreId.join(',');
              if (appliedFilterGender.length > 0) params.gender = appliedFilterGender.join(',');
              if (appliedDateFrom) params.date_from = appliedDateFrom;
              if (appliedDateTo) params.date_to = appliedDateTo;
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              params.per_page = perPage;
              fetchFrames(page, params);
            }}
            itemName="armações"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setFrameToDelete(null);
          }
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir a armação <strong>{frameToDelete?.description}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setFrameToDelete(null);
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

      {/* Modal de Transferência */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => {
          if (!transferring) {
            setTransferModalOpen(false);
            setFrameToTransfer(null);
            setTransferToStoreId('');
            setTransferNotes('');
          }
        }}
        title="Transferir Armação"
      >
        <div className="space-y-4">
          {frameToTransfer && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-slate-900">
                Armação: <strong>{frameToTransfer.code}</strong> - {frameToTransfer.description}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Loja atual: {frameToTransfer.latestStoreFrame?.toStore?.name ?? frameToTransfer.latest_store_frame?.to_store?.name ?? '-'}
              </p>
            </div>
          )}
          
          <SingleSelect
            label="Loja de destino"
            value={transferToStoreId}
            onChange={setTransferToStoreId}
            placeholder="Selecione a loja de destino..."
            options={storesList
              .filter(store => {
                const currentStoreId = frameToTransfer?.latestStoreFrame?.toStore?.id || 
                                     frameToTransfer?.latest_store_frame?.to_store?.id || 
                                     selectedStore?.id;
                return store.id !== currentStoreId;
              })
              .map(store => ({
                label: store.name,
                value: String(store.id)
              }))}
          />

          <div className="space-y-1.5">
            <label className="text-[10px] lg:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">
              Observações (opcional)
            </label>
            <textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Adicione observações sobre a transferência..."
              className="w-full px-4 py-3 border border-gray-100 rounded-lg text-sm font-medium transition-all outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)] resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                if (!transferring) {
                  setTransferModalOpen(false);
                  setFrameToTransfer(null);
                  setTransferToStoreId('');
                  setTransferNotes('');
                }
              }}
              disabled={transferring}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={transferring || !transferToStoreId}
            >
              {transferring ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Transferindo...
                </>
              ) : (
                <>
                  <ArrowRight size={16} /> Transferir
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
