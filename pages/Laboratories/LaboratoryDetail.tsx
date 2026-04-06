import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FlaskConical, 
  Package,
  History,
  Edit,
  Plus,
  Trash2,
  Loader2,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Building2,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar,
  FileDown
} from 'lucide-react';
import { Card, Button, Badge, Modal, Pagination, SortableHeader, SortDirection, MultiSelect } from '../../components/Common';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { laboratoriesService } from '../../services/api/laboratories';
import { storesService } from '../../services/api/stores';
import { useStore } from '../../contexts/StoreContext';
import { useLaboratoryLenses } from '../../services/hooks/useLaboratoryLenses';
import { Laboratory } from '../../services/api/laboratories';
import { LaboratoryLens } from '../../services/api/laboratoryLenses';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { generateLaboratoryReportPdf } from '../../utils/laboratoryReportPdf';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : (import.meta.env.VITE_API_URL || '').replace(/\/api(\/.*)?$/, '') || window.location.origin;
const buildLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/')) return `${API_BASE}${logoPath}`;
  const path = logoPath.startsWith('storage/') ? logoPath : `storage/${logoPath}`;
  return import.meta.env.DEV ? `/${path}` : `${API_BASE}/${path}`;
};

/** Soma das quantidades no pivot (mesma regra do backend: mín. 1 por linha). */
function laboratoryProductsQuantityForOrder(order: ServiceOrder): number {
  const raw = order.laboratory_lenses;
  const lines: Array<{ quantity?: number }> = Array.isArray(raw)
    ? raw
    : Object.values((raw as Record<string, { quantity?: number }>) || {});
  if (lines.length > 0) {
    return lines.reduce((sum, row) => {
      const q = Number(row?.quantity);
      return sum + (Number.isFinite(q) && q > 0 ? q : 1);
    }, 0);
  }
  const apiQty = Number(order.laboratory_products_quantity);
  if (Number.isFinite(apiQty) && apiQty > 0) {
    return apiQty;
  }
  const cost = Number(order.laboratory_products_cost);
  if (Number.isFinite(cost) && cost > 0) {
    return 1;
  }
  return Number.isFinite(apiQty) ? apiQty : 0;
}

export const LaboratoryDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { selectedStore, storeColor, storeLogo } = useStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'lenses' | 'history'>('overview');
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Para a aba de lentes
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lensToDelete, setLensToDelete] = useState<LaboratoryLens | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Para a aba de histórico
  const [historyOrders, setHistoryOrders] = useState<ServiceOrder[]>([]);
  const [historyPagination, setHistoryPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyProductFilter, setHistoryProductFilter] = useState<string[]>([]);
  const [historySortBy, setHistorySortBy] = useState<string | null>('id');
  const [historySortDirection, setHistorySortDirection] = useState<SortDirection>('desc');
  const [historyPerPage, setHistoryPerPage] = useState<number>(10);
  const [historyReportData, setHistoryReportData] = useState<{
    total_os: number;
    total_cost: number;
    top_lenses: Array<{
      id: number;
      name: string;
      count: number;
      quantity_sold?: number;
      os_count?: number;
      total_cost: number;
    }>;
    laboratory: { id: number; name: string };
  } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const { getLaboratory, getHistory } = useLaboratories({ autoFetch: false });
  const { 
    laboratoryLenses, 
    loading: loadingLenses, 
    pagination,
    fetchLaboratoryLenses, 
    deleteLaboratoryLens 
  } = useLaboratoryLenses({ autoFetch: false });

  useEffect(() => {
    if (id) {
      loadLaboratory();
      // Carrega histórico para mostrar total no card da visão geral
      loadHistoryStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadHistoryStats = async () => {
    try {
      const result = await getHistory(Number(id), {
        page: 1,
        per_page: 1, // Só precisamos do meta.totalItems
      });
      setHistoryPagination(result.meta);
    } catch (err) {
      console.error('Erro ao carregar estatísticas do histórico:', err);
    }
  };

  useEffect(() => {
    if (id && (activeTab === 'overview' || activeTab === 'lenses')) {
      loadLenses(1);
    }
    if (id && activeTab === 'history') {
      loadHistory(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTab]);

  const loadLaboratory = async () => {
    try {
      setLoading(true);
      const data = await getLaboratory(id!);
      setLaboratory(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar laboratório');
    } finally {
      setLoading(false);
    }
  };

  const loadLenses = async (page: number) => {
    try {
      await fetchLaboratoryLenses(page, {
        laboratory_id: Number(id),
        order_by: sortBy || 'id',
        order_dir: sortDirection || 'desc',
        per_page: perPage,
      });
    } catch (err) {
      console.error('Erro ao carregar lentes:', err);
    }
  };

  const loadHistory = useCallback(async (page = 1, params: any = {}) => {
    setLoadingHistory(true);
    try {
      const finalParams: any = {
        page,
        order_by: params.order_by || historySortBy || 'id',
        order_dir: params.order_dir || historySortDirection || 'desc',
        per_page: params.per_page || historyPerPage,
      };
      
      if (historyDateFrom || params.date_from) finalParams.date_from = params.date_from ?? historyDateFrom;
      if (historyDateTo || params.date_to) finalParams.date_to = params.date_to ?? historyDateTo;
      
      const reportParams: { date_from?: string; date_to?: string; laboratory_lens_ids?: number[] } = {
        date_from: finalParams.date_from,
        date_to: finalParams.date_to,
      };
      if (historyProductFilter.length > 0) {
        reportParams.laboratory_lens_ids = historyProductFilter.map(Number).filter((n) => !Number.isNaN(n));
      }
      const [result] = await Promise.all([
        getHistory(Number(id), finalParams),
        laboratoriesService.getHistoryReport(Number(id), reportParams).then(setHistoryReportData).catch(() => setHistoryReportData(null)),
      ]);
      setHistoryOrders(result.data);
      setHistoryPagination(result.meta);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [id, getHistory, historySortBy, historySortDirection, historyPerPage, historyDateFrom, historyDateTo]);

  const handleHistoryApplyFilters = async () => {
    await loadHistory(1);
  };

  const handleHistoryClearFilters = async () => {
    setHistoryDateFrom('');
    setHistoryDateTo('');
    setHistoryProductFilter([]);
    setHistoryReportData(null);
    await loadHistory(1, {
      date_from: undefined,
      date_to: undefined,
    });
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const params: { date_from?: string; date_to?: string; laboratory_lens_ids?: number[] } = {};
      if (historyDateFrom) params.date_from = historyDateFrom;
      if (historyDateTo) params.date_to = historyDateTo;
      if (historyProductFilter.length > 0) {
        params.laboratory_lens_ids = historyProductFilter.map(Number).filter((n) => !Number.isNaN(n));
      }
      
      const [report, storeData] = await Promise.all([
        laboratoriesService.getHistoryReport(Number(id), params),
        selectedStore ? storesService.getById(String(selectedStore.id)).catch(() => null) : Promise.resolve(null),
      ]);

      // Debug: verificar dados recebidos
      console.log('🔍 [LaboratoryDetail] PDF Report Data:', {
        total_os: report.total_os,
        total_cost: report.total_cost,
        top_lenses_count: report.top_lenses?.length || 0,
        top_lenses: report.top_lenses,
        top_lenses_is_array: Array.isArray(report.top_lenses),
        report_full: report,
      });

      await generateLaboratoryReportPdf({
        report,
        storeData: storeData ?? null,
        storeColor,
        storeLogo,
        logoUrlBuilder: buildLogoUrl,
      });

      showSuccess('PDF gerado com sucesso!');
    } catch (err: any) {
      showError(err.message || 'Erro ao gerar PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleHistorySort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'desc';
    setHistorySortBy(key);
    setHistorySortDirection(newDirection);
    loadHistory(historyPagination?.currentPage || 1, {
      order_by: key,
      order_dir: newDirection,
    });
  };

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    fetchLaboratoryLenses(pagination?.currentPage || 1, {
      laboratory_id: Number(id),
      order_by: key,
      order_dir: newDirection,
      per_page: perPage,
    });
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
      await loadLenses(pagination?.currentPage || 1);
    } catch (err: any) {
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
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const lensesList = Array.isArray(laboratoryLenses) ? laboratoryLenses : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  if (error || !laboratory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error || 'Laboratório não encontrado'}</p>
        <Button variant="outline" onClick={() => navigate('/laboratories')}>
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/laboratories')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 transition-all shadow-sm"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--store-color-dark)';
              e.currentTarget.style.borderColor = 'var(--store-color-opacity-20)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-950 tracking-tight">{laboratory.name}</h1>
              <Badge variant={laboratory.active ? 'success' : 'danger'}>
                {laboratory.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {laboratory.cnpj && (
              <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">
                CNPJ: {laboratory.cnpj}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {hasPermission('laboratories.update') && (
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={() => navigate(`/laboratories/${id}/edit`)}>
              <Edit size={18} /> Editar Laboratório
            </Button>
          )}
          {hasPermission('laboratory-lenses.create') && (
            <Button className="px-8 rounded-2xl" onClick={() => navigate(`/laboratory-lenses/create?laboratory_id=${id}`)}>
              <Plus size={18} /> Nova Lente
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <div 
              className="w-24 h-24 mx-auto rounded-3xl mb-6 flex items-center justify-center text-white shadow-xl" 
              style={{ 
                backgroundColor: 'var(--store-color)',
                boxShadow: '0 20px 25px -5px var(--store-color-opacity-20)',
              }}
            >
              <FlaskConical size={48} />
            </div>
            <div className="text-center mb-8">
              <h3 className="font-black text-slate-900 tracking-tight">{laboratory.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                Cadastrado em {formatDate(laboratory.created_at)}
              </p>
            </div>
            
            <div className="space-y-4 border-t border-slate-50 pt-6">
              {laboratory.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} style={{ color: 'var(--store-color)' }} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{laboratory.address}</p>
                </div>
              )}
              {laboratory.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600">{laboratory.phone}</p>
                </div>
              )}
              {laboratory.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600 truncate">{laboratory.email}</p>
                </div>
              )}
              {laboratory.contact_name && (
                <div className="flex items-center gap-3">
                  <User size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600">{laboratory.contact_name}</p>
                </div>
              )}
            </div>
          </Card>

          {laboratory.notes && (
            <Card className="border-none shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--store-color-light)' }}>
                  <FileText size={16} style={{ color: 'var(--store-color)' }} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Observações</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{laboratory.notes}</p>
            </Card>
          )}
        </div>

        {/* Conteúdo Principal com Abas */}
        <div className="lg:col-span-3 space-y-8">
          {/* Navegação de Abas */}
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Building2, permission: null },
              { id: 'lenses', label: 'Lentes', icon: Package, permission: 'laboratory-lenses.list' },
              { id: 'history', label: 'Histórico', icon: History, permission: 'laboratories.history' },
            ].filter(tab => !tab.permission || hasPermission(tab.permission)).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: 'var(--store-color)',
                  boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
                } : undefined}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo das Abas */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--store-color-light)' }}>
                      <Package size={24} style={{ color: 'var(--store-color)' }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{pagination?.totalItems ?? lensesList.length ?? 0}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lentes Cadastradas</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setActiveTab('lenses')}
                  >
                    Ver Todas as Lentes
                  </Button>
                </Card>

                <Card className="border-none shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--store-color-light)' }}>
                      <History size={24} style={{ color: 'var(--store-color)' }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{historyPagination?.totalItems || 0}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OS Finalizadas</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setActiveTab('history')}
                  >
                    Ver Histórico
                  </Button>
                </Card>

                <Card className="md:col-span-2 border-none shadow-lg">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Informações Completas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome</p>
                      <p className="text-sm font-bold text-slate-900">{laboratory.name}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CNPJ</p>
                      <p className="text-sm font-bold text-slate-900">{laboratory.cnpj || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telefone</p>
                      <p className="text-sm font-bold text-slate-900">{laboratory.phone || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{laboratory.email || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contato</p>
                      <p className="text-sm font-bold text-slate-900">{laboratory.contact_name || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl md:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Endereço</p>
                      <p className="text-sm font-bold text-slate-900">{laboratory.address || '-'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'lenses' && (
              <Card className="p-0 overflow-hidden border-none shadow-lg">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Lentes do Laboratório</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {pagination?.totalItems || 0} {(pagination?.totalItems || 0) === 1 ? 'lente cadastrada' : 'lentes cadastradas'}
                    </p>
                  </div>
                  {hasPermission('laboratory-lenses.create') && (
                    <Button onClick={() => navigate(`/laboratory-lenses/create?laboratory_id=${id}`)}>
                      <Plus size={14} /> Nova Lente
                    </Button>
                  )}
                </div>

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
                          label="Preço Custo"
                          sortKey="cost_price"
                          currentSort={sortBy}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                          className="px-6 py-4"
                        />
                        <SortableHeader
                          label="Preço Venda"
                          sortKey="sale_price"
                          currentSort={sortBy}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                          className="px-6 py-4"
                        />
                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loadingLenses ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                              <span className="text-sm text-slate-500">Carregando lentes...</span>
                            </div>
                          </td>
                        </tr>
                      ) : lensesList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <Package size={48} className="text-slate-200" />
                              <p className="text-sm text-slate-500">Nenhuma lente cadastrada para este laboratório</p>
                              {hasPermission('laboratory-lenses.create') && (
                                <Button onClick={() => navigate(`/laboratory-lenses/create?laboratory_id=${id}`)}>
                                  <Plus size={16} /> Cadastrar Primeira Lente
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        lensesList.map((lens) => (
                          <tr key={lens.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">#{lens.id}</td>
                            <td className="px-6 py-4">
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
                                  <p className="text-xs text-slate-400 truncate max-w-[250px]">{lens.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              <div className="flex items-center gap-2">
                                <span>
                                  {formatCurrency(
                                    lens.promotion_active && lens.promotional_cost_price != null
                                      ? lens.promotional_cost_price
                                      : lens.cost_price
                                  )}
                                </span>
                                {lens.promotion_active && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Promo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                              {formatCurrency(lens.sale_price)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant={lens.active ? 'success' : 'danger'}>
                                {lens.active ? 'Ativo' : 'Inativo'}
                              </Badge>
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

                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    pagination={pagination}
                    perPage={perPage}
                    onPerPageChange={(newPerPage) => {
                      setPerPage(newPerPage);
                      fetchLaboratoryLenses(1, {
                        laboratory_id: Number(id),
                        order_by: sortBy || 'id',
                        order_dir: sortDirection || 'desc',
                        per_page: newPerPage,
                      });
                    }}
                    onPageChange={(page) => loadLenses(page)}
                    itemName="lentes"
                  />
                )}
              </Card>
            )}

            {activeTab === 'history' && (() => {
              const historyOrdersList = Array.isArray(historyOrders) ? historyOrders : Object.values(historyOrders || {});
              return (
              <div className="space-y-6">
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--store-color-light)' }}>
                        <TrendingUp size={28} style={{ color: 'var(--store-color)' }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de OS</p>
                        <h3 className="text-3xl font-black text-slate-900">{historyPagination?.totalItems || 0}</h3>
                      </div>
                    </div>
                  </Card>
                  <Card className="border-none shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-amber-50">
                        <DollarSign size={28} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custo Total (produtos usados)</p>
                        <h3 className="text-3xl font-black text-amber-600">
                          {historyReportData !== null
                            ? formatCurrency(historyReportData.total_cost)
                            : formatCurrency(historyOrdersList.reduce((acc, order) => {
                                const lenses = Array.isArray(order.laboratory_lenses) ? order.laboratory_lenses : Object.values(order.laboratory_lenses || {});
                        const lensCost = lenses.reduce((s, l) => {
                          const cost = l.cost_price_at_sale ?? l.cost_price;
                          return s + (Number(cost) || 0);
                        }, 0);
                                return acc + lensCost;
                              }, 0))}
                        </h3>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filtros */}
                <Card className="border-none shadow-lg">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Data Início
                      </label>
                      <input
                        type="date"
                        value={historyDateFrom}
                        onChange={(e) => setHistoryDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]"
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Data Fim
                      </label>
                      <input
                        type="date"
                        value={historyDateTo}
                        onChange={(e) => setHistoryDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]"
                      />
                    </div>
                    <div className="flex-1 min-w-[250px]">
                      <MultiSelect
                        label="Produtos"
                        value={historyProductFilter.length === 0 ? ['__all__'] : historyProductFilter}
                        onChange={(vals) => {
                          if (vals.includes('__all__')) {
                            setHistoryProductFilter([]);
                          } else {
                            setHistoryProductFilter(vals.filter((v) => v !== '__all__'));
                          }
                        }}
                        options={[
                          { value: '__all__', label: 'Todos os produtos' },
                          ...lensesList.map((lens) => ({ value: String(lens.id), label: lens.name })),
                        ]}
                        placeholder="Selecione os produtos..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleHistoryClearFilters}>
                        Limpar
                      </Button>
                      <Button onClick={handleHistoryApplyFilters}>
                        Filtrar
                      </Button>
                      {hasPermission('laboratories.history-report') && (
                      <Button
                        variant="outline"
                        onClick={handleGeneratePdf}
                        disabled={generatingPdf || (!historyDateFrom && !historyDateTo)}
                        style={{ borderColor: 'var(--store-color)', color: 'var(--store-color)' }}
                        title={!historyDateFrom && !historyDateTo ? 'Selecione pelo menos um filtro de data' : ''}
                      >
                        {generatingPdf ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Gerando...
                          </>
                        ) : (
                          <>
                            <FileDown size={16} /> Gerar PDF
                          </>
                        )}
                      </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Lista de OS */}
                <Card className="p-0 overflow-hidden border-none shadow-lg">
                  <div className="p-6 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Histórico de OS</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ordens de serviço com produtos deste laboratório
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <SortableHeader
                            label="Nº OS"
                            sortKey="os_number"
                            currentSort={historySortBy}
                            currentDirection={historySortDirection}
                            onSort={handleHistorySort}
                            className="px-6 py-4"
                          />
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Ótica</th>
                          <SortableHeader
                            label="Data"
                            sortKey="created_at"
                            currentSort={historySortBy}
                            currentDirection={historySortDirection}
                            onSort={handleHistorySort}
                            className="px-6 py-4"
                          />
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor OS</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Custo (lab)</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loadingHistory ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--store-color)' }} />
                                <span className="text-sm text-slate-500">Carregando histórico...</span>
                              </div>
                            </td>
                          </tr>
                        ) : historyOrdersList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <History size={48} className="text-slate-200" />
                                <p className="text-sm text-slate-500">Nenhuma OS encontrada para este laboratório</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          historyOrdersList.map((order) => {
                            const labProductsCost = Number(order.laboratory_products_cost);
                            const labCostDisplay = Number.isFinite(labProductsCost) ? labProductsCost : 0;
                            const labQtyDisplay = laboratoryProductsQuantityForOrder(order);
                            return (
                            <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                                  {String(order.os_number).padStart(4, '0')}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p 
                                  className="text-sm font-bold text-slate-900 cursor-pointer hover:opacity-80"
                                  onClick={() => order.client_id && navigate(`/clients/${order.client_id}`)}
                                >
                                  {order.client?.name || '-'}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-slate-600">{order.store?.name || '-'}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                <div>{formatDate(order.completed_at || order.created_at)}</div>
                                <div className="text-xs mt-0.5">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold ${
                                    order.status === 'completed' ? 'bg-green-50 text-green-700' :
                                    order.status === 'overdue' ? 'bg-red-50 text-red-700' :
                                    order.status === 'ready_for_pickup' ? 'bg-blue-50 text-blue-700' :
                                    order.status === 'sent_to_lab' ? 'bg-cyan-50 text-cyan-700' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {order.status === 'completed' ? 'Finalizada' :
                                     order.status === 'overdue' ? 'Inadimplente' :
                                     order.status === 'ready_for_pickup' ? 'Ag. Retirada' :
                                     order.status === 'sent_to_lab' ? 'No Lab' :
                                     'Pendente'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                                  {formatCurrency(order.price || 0)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-semibold text-slate-700">
                                  {formatCurrency(labCostDisplay)}
                                  <span className="text-slate-400 font-normal"> x{labQtyDisplay}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center">
                                  <button 
                                    title="Visualizar OS"
                                    onClick={() => navigate(`/service-orders/${order.id}`)}
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
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {historyPagination && historyPagination.totalPages > 1 && (
                    <Pagination
                      pagination={historyPagination}
                      perPage={historyPerPage}
                      onPerPageChange={(newPerPage) => {
                        setHistoryPerPage(newPerPage);
                        loadHistory(1, { per_page: newPerPage });
                      }}
                      onPageChange={(page) => loadHistory(page)}
                      itemName="ordens de serviço"
                    />
                  )}
                </Card>
              </div>
            );
            })()}
          </div>
        </div>
      </div>

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
