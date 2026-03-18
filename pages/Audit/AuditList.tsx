
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Store, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Database,
  ArrowRight,
  X
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, FilterSection, MultiSelect, ActiveFiltersBadge, SortableHeader, SortDirection, Pagination } from '../../components/Common';
import { useAudits } from '../../services/hooks/useAudits';
import { Audit } from '../../services/api/audits';
import { usePlucks } from '../../services/hooks/usePlucks';
import { usersService } from '../../services/api/users';
import { storesService } from '../../services/api/stores';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useStore } from '../../contexts/StoreContext';

export const AuditList: React.FC = () => {
  const { selectedStore } = useStore();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [eventFilter, setEventFilter] = useState<string[]>([]);
  const [auditableTypeFilter, setAuditableTypeFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [storeFilter, setStoreFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{ eventFilter: string[]; auditableTypeFilter: string[]; userFilter: string[]; storeFilter: string[]; dateFrom: string; dateTo: string }>({ eventFilter: [], auditableTypeFilter: [], userFilter: [], storeFilter: [], dateFrom: '', dateTo: '' });
  const [perPage, setPerPage] = useState<number>(15);
  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const { audits, loading, error, pagination, fetchAudits } = useAudits({
    autoFetch: false,
  });

  const activeFilters = useActiveFilters({
    eventFilter: appliedFilters.eventFilter.filter(f => f !== 'all'),
    auditableTypeFilter: appliedFilters.auditableTypeFilter.filter(f => f !== 'all'),
    userFilter: appliedFilters.userFilter.filter(f => f !== 'all'),
    storeFilter: appliedFilters.storeFilter.filter(f => f !== 'all'),
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
  });

  const { plucks: usersPlucks, loading: usersPlucksLoading } = usePlucks({
    service: usersService,
    autoFetch: true,
  });

  const { plucks: storesPlucks, loading: storesPlucksLoading } = usePlucks({
    service: storesService,
    autoFetch: true,
  });

  // Log para debug
  useEffect(() => {
    console.log('[AuditList] usersPlucks:', usersPlucks);
    console.log('[AuditList] usersPlucksLoading:', usersPlucksLoading);
    console.log('[AuditList] usersPlucks é array?', Array.isArray(usersPlucks));
    console.log('[AuditList] usersPlucks count:', Array.isArray(usersPlucks) ? usersPlucks.length : 'N/A');
    
    console.log('[AuditList] storesPlucks:', storesPlucks);
    console.log('[AuditList] storesPlucksLoading:', storesPlucksLoading);
    console.log('[AuditList] storesPlucks é array?', Array.isArray(storesPlucks));
    console.log('[AuditList] storesPlucks count:', Array.isArray(storesPlucks) ? storesPlucks.length : 'N/A');
  }, [usersPlucks, usersPlucksLoading, storesPlucks, storesPlucksLoading]);

  // Garantir que sejam sempre arrays
  const safeUsersPlucks = Array.isArray(usersPlucks) ? usersPlucks : [];
  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];

  const buildParams = (f: typeof appliedFilters) => {
    const params: any = { order_by: sortBy || 'created_at', order_dir: sortDirection || 'desc', per_page: perPage };
    if (f.eventFilter.length > 0) params.event = f.eventFilter.join(',');
    if (f.auditableTypeFilter.length > 0) params.auditable_type = f.auditableTypeFilter.join(',');
    if (f.userFilter.length > 0) params.user_id = f.userFilter.join(',');
    if (f.storeFilter.length > 0 && !f.storeFilter.includes('all')) {
      params.store_id = f.storeFilter.filter(id => id !== 'all' && !isNaN(parseInt(id))).join(',');
    }
    if (f.dateFrom) params.date_from = f.dateFrom;
    if (f.dateTo) params.date_to = f.dateTo;
    return params;
  };

  useEffect(() => {
    const loadAudits = async () => {
      try {
        await fetchAudits(1, buildParams(appliedFilters));
      } catch (err) {
        console.error('Erro ao carregar auditorias:', err);
      }
    };
    loadAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, selectedStore?.id, appliedFilters, sortBy, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDirection(direction || 'asc');
    const params = buildParams(appliedFilters);
    params.order_by = key;
    params.order_dir = direction || 'asc';
    fetchAudits(pagination?.currentPage || 1, params);
  };

  const handleApplyFilters = async () => {
    const next = { eventFilter: [...eventFilter], auditableTypeFilter: [...auditableTypeFilter], userFilter: [...userFilter], storeFilter: [...storeFilter], dateFrom, dateTo };
    setAppliedFilters(next);
    try {
      const params = buildParams(next);
      await fetchAudits(1, params);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
    }
  };

  const handleClearFilters = async () => {
    setEventFilter([]);
    setAuditableTypeFilter([]);
    setUserFilter([]);
    setStoreFilter([]);
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({ eventFilter: [], auditableTypeFilter: [], userFilter: [], storeFilter: [], dateFrom: '', dateTo: '' });
    try {
      await fetchAudits(1, { order_by: sortBy || 'created_at', order_dir: sortDirection || 'desc', per_page: perPage });
    } catch (err) {
      console.error('Erro ao limpar filtros:', err);
    }
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    const params = buildParams(appliedFilters);
    params.per_page = newPerPage;
    await fetchAudits(1, params);
  };

  const formatDate = (dateString: string) => {
    return dateString;
  };

  const parseAuditDetails = (audit: Audit) => {
    try {
      const oldValues = JSON.parse(audit.old_values || '{}');
      const newValues = JSON.parse(audit.new_values || '{}');
      const details: Array<{ field: string; old: string | null; new: string | null }> = [];
      
      const allFields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
      allFields.forEach(field => {
        details.push({
          field,
          old: oldValues[field] !== undefined ? String(oldValues[field]) : null,
          new: newValues[field] !== undefined ? String(newValues[field]) : null,
        });
      });
      
      return details;
    } catch {
      return [];
    }
  };

  const getActionLabel = (event: string) => {
    switch (event) {
      case 'created': return 'CRIOU';
      case 'updated': return 'ATUALIZOU';
      case 'deleted': return 'EXCLUIU';
      default: return event.toUpperCase();
    }
  };

  const getActionType = (event: string): 'create' | 'update' | 'delete' => {
    switch (event) {
      case 'created': return 'create';
      case 'updated': return 'update';
      case 'deleted': return 'delete';
      default: return 'update';
    }
  };

  const translateModelName = (modelType: string): string => {
    const modelMap: Record<string, string> = {
      'App\\Models\\Lens': 'Lentes',
      'App\\Models\\User': 'Usuários',
      'App\\Models\\Client': 'Clientes',
      'App\\Models\\Role': 'Perfis',
      'Spatie\\Permission\\Models\\Role': 'Perfis',
      'Spatie\\Permission\\Models\\Permission': 'Permissões',
      'App\\Models\\Order': 'Ordens de Serviço',
      'App\\Models\\Stock': 'Estoque',
      'App\\Models\\Store': 'Lojas',
      'App\\Models\\Seller': 'Vendedores',
      'App\\Models\\Supplier': 'Fornecedores',
      'App\\Models\\Brand': 'Marcas',
      'App\\Models\\Invoice': 'Notas Fiscais',
      'App\\Models\\Frame': 'Armações',
      'App\\Models\\FrameType': 'Tipos de Armação',
      'App\\Models\\Laboratory': 'Laboratórios',
      'App\\Models\\LaboratoryLens': 'Lentes de Laboratório',
      'App\\Models\\ServiceOrder': 'Ordens de Serviço', // Adicionado para ServiceOrder
      'App\\Models\\StoreFrame': 'Transferências de Armação', // Adicionado para StoreFrame
    };
    
    const modelName = modelType.split('\\').pop() || modelType;
    
    return modelMap[modelType] || modelName;
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const getActionBadge = (type: string, action: string) => {
    switch (type) {
      case 'create': return <Badge variant="success">{action}</Badge>;
      case 'update': return <Badge variant="primary">{action}</Badge>;
      case 'delete': return <Badge variant="danger">{action}</Badge>;
      default: return <Badge variant="info">{action}</Badge>;
    }
  };

  // Garantir que audits seja sempre um array
  const auditsList = Array.isArray(audits) ? audits : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Auditoria do Sistema</h1>
            <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Histórico de Alterações • Logs de Dados</p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Logs em Tempo Real Ativos</span>
           </div>
        </div>
      </div>

      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <MultiSelect
          label="Tipo de Ação"
          value={eventFilter}
          onChange={setEventFilter}
          placeholder="Selecione os tipos de ação..."
          options={[
            {label: 'Criação', value: 'created'},
            {label: 'Edição', value: 'updated'},
            {label: 'Exclusão', value: 'deleted'},
          ]}
        />
        <MultiSelect
          label="Entidade (Model)"
          value={auditableTypeFilter}
          onChange={setAuditableTypeFilter}
          placeholder="Selecione as entidades..."
          options={[
            {label: 'Lentes', value: 'App\\Models\\Lens'},
            {label: 'Ordens de Serviço', value: 'App\\Models\\Order'},
            {label: 'Clientes', value: 'App\\Models\\Client'},
            {label: 'Estoque', value: 'App\\Models\\Stock'},
            {label: 'Usuários', value: 'App\\Models\\User'},
            {label: 'Perfis', value: 'Spatie\\Permission\\Models\\Role'},
            {label: 'Permissões', value: 'Spatie\\Permission\\Models\\Permission'},
            {label: 'Lojas', value: 'App\\Models\\Store'},
            {label: 'Vendedores', value: 'App\\Models\\Seller'},
            {label: 'Fornecedores', value: 'App\\Models\\Supplier'},
            {label: 'Marcas', value: 'App\\Models\\Brand'},
            {label: 'Notas Fiscais', value: 'App\\Models\\Invoice'},
          ]}
        />
        <MultiSelect
          label="Usuário"
          value={userFilter}
          onChange={setUserFilter}
          placeholder={usersPlucksLoading ? "Carregando usuários..." : "Selecione os usuários..."}
          options={safeUsersPlucks.length > 0 ? safeUsersPlucks.map((user: any) => ({
            label: user.name || `Usuário ${user.id}`,
            value: String(user.id),
          })) : []}
        />
        <MultiSelect
          label="Loja"
          value={storeFilter}
          onChange={setStoreFilter}
          placeholder={storesPlucksLoading ? "Carregando lojas..." : "Selecione as lojas..."}
          options={safeStoresPlucks.length > 0 ? safeStoresPlucks.map((store: any) => ({
            label: store.name || store.fancy_name || `Loja ${store.id}`,
            value: String(store.id),
          })) : []}
        />
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

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <SortableHeader
                  label="ID"
                  sortKey="id"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-8 py-5 text-[10px] border-b border-slate-100"
                />
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Usuário</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Ação</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Registro Afetado</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Loja</th>
                <SortableHeader
                  label="Data"
                  sortKey="created_at"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-8 py-5 text-[10px] border-b border-slate-100"
                />
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--store-color)' }}></div>
                      <span className="text-sm text-slate-500">Carregando logs...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600 text-sm font-bold mb-1">Erro ao carregar logs</p>
                      <p className="text-red-500 text-xs">{error.message || 'Erro desconhecido'}</p>
                    </div>
                  </td>
                </tr>
              ) : auditsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <span className="text-sm text-slate-500">Nenhum log encontrado</span>
                  </td>
                </tr>
              ) : (
                auditsList.map((audit) => {
                  const logId = String(audit.id);
                  const details = parseAuditDetails(audit);
                  const userName = audit.user?.name || 'Usuário Desconhecido';
                  
                  return (
                    <React.Fragment key={logId}>
                      <tr className={`group transition-all duration-300 ${expandedRows.includes(logId) ? '' : 'hover:bg-slate-50/50'}`} style={expandedRows.includes(logId) ? { backgroundColor: 'var(--store-color-opacity-5)' } : undefined}>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-slate-400">#{audit.id}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none">{userName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">ID Log: {audit.id}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {getActionBadge(getActionType(audit.event), getActionLabel(audit.event))}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <p className="text-xs font-black text-slate-700">{translateModelName(audit.auditable_type)}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Model: {audit.auditable_type}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <Store size={14} style={{ color: 'var(--store-color)' }} />
                            <span className="text-[10px] font-bold text-slate-700">
                              {(() => {
                                if (audit.auditable_type === 'App\\Models\\Store' && audit.auditable) {
                                  return audit.auditable.name || audit.auditable.fancy_name || '-';
                                }
                                // Se tem store_name no audit
                                if (audit.store_name) {
                                  return audit.store_name;
                                }
                                if (audit.auditable?.store) {
                                  return audit.auditable.store.name || audit.auditable.store.fancy_name || '-';
                                }
                                if (audit.auditable?.stores && audit.auditable.stores.length > 0) {
                                  const firstStore = Array.isArray(audit.auditable.stores) 
                                    ? audit.auditable.stores[0] 
                                    : audit.auditable.stores;
                                  return firstStore?.name || firstStore?.fancy_name || '-';
                                }
                                return '-';
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock size={12} /> {formatDate(audit.created_at)}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center">
                            <button 
                              onClick={() => toggleRow(logId)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                expandedRows.includes(logId) 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                                : 'bg-white text-slate-400 border border-slate-100 hover:border-red-200 hover:text-red-600'
                              }`}
                            >
                              {expandedRows.includes(logId) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {expandedRows.includes(logId) ? 'Ocultar' : 'Detalhes'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Linha Expandida - Detalhes do Log */}
                      {expandedRows.includes(logId) && (
                        <tr style={{ backgroundColor: 'var(--store-color-opacity-5)' }}>
                          <td colSpan={7} className="px-8 py-0">
                            <div className="py-6 border-t animate-in slide-in-from-top-2 duration-300" style={{ borderColor: 'var(--store-color-opacity-20)' }}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <Database size={16} className="text-red-600" />
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Alterações de Dados</h4>
                                  </div>
                                  
                                  <div className="bg-white rounded-2xl border shadow-sm overflow-auto max-h-72" style={{ borderColor: 'var(--store-color-opacity-20)' }}>
                                    <table className="w-full text-left min-w-[500px]">
                                      <thead>
                                        <tr className="bg-slate-50">
                                          <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Campo</th>
                                          <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Anterior</th>
                                          <th className="px-4 py-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <ArrowRight size={10} className="mx-auto" />
                                          </th>
                                          <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Novo Valor</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {details.length > 0 ? details.map((detail, idx) => (
                                          <tr key={idx}>
                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-tight">{detail.field}</td>
                                            <td className="px-4 py-3">
                                              <span className={`text-[11px] font-medium ${detail.old ? 'text-red-500 line-through' : 'text-slate-300 italic'}`}>
                                                {detail.old || 'Nulo'}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-300">
                                              <ArrowRight size={12} className="mx-auto" />
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-[11px] font-bold text-emerald-600">
                                                {detail.new || 'Nulo'}
                                              </span>
                                            </td>
                                          </tr>
                                        )) : (
                                          <tr>
                                            <td colSpan={4} className="px-4 py-3 text-center text-slate-400 text-xs">Nenhuma alteração registrada</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <Info size={16} style={{ color: 'var(--store-color)' }} />
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Informações Adicionais</h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 overflow-auto max-h-72">
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto min-w-0">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço IP</p>
                                      <p className="text-xs font-bold text-slate-900 tracking-tight break-all">{audit.ip_address || '-'}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto min-w-0">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Navegador</p>
                                      <p className="text-xs font-bold text-slate-900 tracking-tight break-all whitespace-pre-wrap">{audit.user_agent || '-'}</p>
                                    </div>
                                    <div className="col-span-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto min-w-0">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">URL de Origem</p>
                                      <p className="text-xs font-bold text-slate-900 tracking-tight break-all">{audit.url || '-'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {pagination && (
        <Pagination
          pagination={pagination}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          onPageChange={(page) => {
            const params = buildParams(appliedFilters);
            fetchAudits(page, params);
          }}
          itemName="logs"
        />
      )}
    </div>
  );
};
