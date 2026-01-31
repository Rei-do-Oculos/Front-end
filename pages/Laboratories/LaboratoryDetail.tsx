import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FlaskConical, 
  Package,
  ShoppingCart,
  Edit,
  Plus,
  Trash2,
  Loader2,
  Phone,
  Mail,
  MapPin,
  User,
  Clock,
  FileText,
  Building2
} from 'lucide-react';
import { Card, Button, Badge, Modal, Pagination, SortableHeader, SortDirection } from '../../components/Common';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { useLaboratoryLenses } from '../../services/hooks/useLaboratoryLenses';
import { Laboratory } from '../../services/api/laboratories';
import { LaboratoryLens } from '../../services/api/laboratoryLenses';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';

export const LaboratoryDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'lenses' | 'sales'>('overview');
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
  
  const { getLaboratory } = useLaboratories({ autoFetch: false });
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'lenses') {
      loadLenses(1);
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
              {laboratory.delivery_days !== null && laboratory.delivery_days !== undefined && (
                <div className="flex items-center gap-3">
                  <Clock size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600">{laboratory.delivery_days} dias para entrega</p>
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
              { id: 'overview', label: 'Visão Geral', icon: Building2 },
              { id: 'lenses', label: 'Lentes', icon: Package },
              { id: 'sales', label: 'Vendas', icon: ShoppingCart },
            ].map((tab) => (
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
                      <h3 className="text-2xl font-black text-slate-900">{lensesList.length || 0}</h3>
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
                      <ShoppingCart size={24} style={{ color: 'var(--store-color)' }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">0</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendas com Produtos</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setActiveTab('sales')}
                  >
                    Ver Histórico de Vendas
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
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prazo Entrega</p>
                      <p className="text-sm font-bold text-slate-900">{laboratory.delivery_days ? `${laboratory.delivery_days} dias` : '-'}</p>
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
                              {formatCurrency(lens.cost_price)}
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

            {activeTab === 'sales' && (
              <Card className="border-none shadow-lg">
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                    <ShoppingCart size={48} style={{ color: 'var(--store-color)' }} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Histórico de Vendas</h3>
                  <p className="text-sm text-slate-500 text-center max-w-md">
                    Esta seção mostrará todas as Ordens de Serviço (OS) onde os produtos deste laboratório foram utilizados.
                  </p>
                  <Badge variant="info">Em breve</Badge>
                </div>
              </Card>
            )}
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
