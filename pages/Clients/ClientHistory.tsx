import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  TrendingUp, 
  Eye, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  ClipboardList, 
  Stethoscope, 
  Plus,
  User,
  AlertTriangle,
  Loader2,
  Building2
} from 'lucide-react';
import { Card, Button, Badge, Pagination, SortableHeader, SortDirection } from '../../components/Common';
import { useClients } from '../../services/hooks/useClients';
import { usePermission } from '../../services/hooks/usePermission';
import { Client } from '../../services/api/clients';
import { ServiceOrder } from '../../services/api/serviceOrders';

// Interface estendida para incluir dados do relacionamento
interface ClientWithRelationships extends Client {
  relationships?: {
    stores?: Array<{ id: number; name: string; unity?: string }>;
  };
}

type TabType = 'compras' | 'receitas' | 'observacoes';

interface Statistics {
  total_spent: number;
  total_orders: number;
  average_ticket: number;
  last_purchase: string | null;
  is_overdue: boolean;
  overdue_count: number;
  overdue_total: number;
}

const PurchasesTab = ({ 
  orders, 
  loading, 
  pagination,
  onPageChange,
  sortBy,
  sortDirection,
  onSort,
  navigate,
}: { 
  orders: ServiceOrder[];
  loading: boolean;
  pagination: { currentPage: number; totalPages: number; totalItems: number } | null;
  onPageChange: (page: number) => void;
  sortBy: string | null;
  sortDirection: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
  navigate: (path: string) => void;
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Finalizada', variant: 'success' as const };
      case 'pending': return { label: 'Pendente', variant: 'warning' as const };
      case 'sent_to_lab': return { label: 'No Laboratório', variant: 'info' as const };
      case 'ready_for_pickup': return { label: 'Aguardando Retirada', variant: 'primary' as const };
      case 'overdue': return { label: 'Inadimplente', variant: 'danger' as const };
      default: return { label: status, variant: 'info' as const };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatOsNumber = (osNumber: number) => {
    return String(osNumber).padStart(4, '0');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--store-color)' }} />
        <span className="ml-3 text-sm text-slate-500">Carregando histórico...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <ShoppingBag size={48} className="text-slate-200" />
        <p className="text-sm text-slate-500">Nenhuma ordem de serviço encontrada</p>
      </div>
    );
  }

  return (
    <div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
              <SortableHeader
                label="Nº OS"
                sortKey="os_number"
                currentSort={sortBy}
                currentDirection={sortDirection}
                onSort={onSort}
                className="px-6 py-4"
              />
              <SortableHeader
                label="Data"
                sortKey="created_at"
                currentSort={sortBy}
                currentDirection={sortDirection}
                onSort={onSort}
                className="px-6 py-4"
              />
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Ótica</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
            <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
            <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5">
                    <span className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                      {formatOsNumber(order.os_number)}
                    </span>
              </td>
              <td className="px-6 py-5">
                    <span className="text-sm text-slate-600">{formatDate(order.created_at)}</span>
              </td>
              <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {order.store?.name || '-'}
                    </p>
              </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                      {formatCurrency(order.price || 0)}
                    </p>
              </td>
                  <td className="px-6 py-5 text-center">
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </td>
              <td className="px-6 py-5">
                    <div className="flex items-center justify-center">
                  <button
                    title="Ver detalhes da OS"
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
            })}
        </tbody>
      </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          perPage={10}
          onPerPageChange={() => {}}
          onPageChange={onPageChange}
          itemName="ordens de serviço"
        />
      )}
    </div>
  );
};

const PrescriptionsTab = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
        <Stethoscope size={40} style={{ color: 'var(--store-color)' }} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Receitas Médicas</h3>
      <p className="text-sm text-slate-500 text-center max-w-md">
        Módulo de receitas médicas será implementado em breve.
      </p>
      <Badge variant="info">Em breve</Badge>
    </div>
  );
};

const NotesTab = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-amber-50">
        <ClipboardList size={40} className="text-amber-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Observações</h3>
      <p className="text-sm text-slate-500 text-center max-w-md">
        Módulo de observações será implementado em breve.
      </p>
      <Badge variant="info">Em breve</Badge>
    </div>
  );
};

export const ClientHistory: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { getHistory } = useClients({ autoFetch: false });

  const [client, setClient] = useState<ClientWithRelationships | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('compras');
  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadHistory = useCallback(async (page = 1, params: any = {}) => {
    if (!id) return;

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingOrders(true);
    }

    try {
      const result = await getHistory(id, {
        page,
        per_page: 10,
        order_by: params.order_by || sortBy || 'created_at',
        order_dir: params.order_dir || sortDirection || 'desc',
      });

      // Processar cliente - stores podem vir em relationships ou diretamente
      const clientData = result.client as ClientWithRelationships;
      
      // Verificar se stores está em relationships
      if (clientData.relationships?.stores && (!clientData.stores || (Array.isArray(clientData.stores) && clientData.stores.length === 0))) {
        clientData.stores = clientData.relationships.stores;
      }
      // Converter stores de objeto para array se necessário
      if (clientData.stores && !Array.isArray(clientData.stores)) {
        clientData.stores = Object.values(clientData.stores);
      }
      
      setClient(clientData);
      setStatistics(result.statistics);

      // Processar service_orders
      const serviceOrdersData = result.service_orders;
      let ordersArray: ServiceOrder[] = [];
      
      if (serviceOrdersData?.data) {
        if (Array.isArray(serviceOrdersData.data)) {
          ordersArray = serviceOrdersData.data;
        } else if (typeof serviceOrdersData.data === 'object') {
          ordersArray = Object.values(serviceOrdersData.data) as ServiceOrder[];
        }
      }

      setOrders(ordersArray);
      
      if (serviceOrdersData) {
        setPagination({
          currentPage: serviceOrdersData.current_page || 1,
          totalPages: serviceOrdersData.last_page || 1,
          totalItems: serviceOrdersData.total || 0,
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
      setLoadingOrders(false);
    }
  }, [id, getHistory, sortBy, sortDirection]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDirection(direction);
    loadHistory(1, { order_by: key, order_dir: direction });
  };

  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined, showTime = false) => {
    if (!dateString) return '-';
    try {
      // O backend retorna no formato "d/m/Y H:i:s" (ex: "23/01/2026 14:30:00")
      // Precisamos converter para um formato que o JavaScript entenda
      let date: Date;
      
      if (dateString.includes('/')) {
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        
        date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      if (showTime) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      console.error('Erro ao formatar data:', e, dateString);
      return '-';
    }
  };

  // Pegar a primeira loja do cliente (onde foi cadastrado)
  const clientStore = client?.stores && Array.isArray(client.stores) && client.stores.length > 0
    ? client.stores[0]
    : null;

  const tabs = [
    { id: 'compras' as TabType, label: 'Histórico de Compras', icon: ShoppingBag },
    { id: 'receitas' as TabType, label: 'Receitas', icon: Stethoscope },
    { id: 'observacoes' as TabType, label: 'Observações', icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error || 'Cliente não encontrado'}</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/clients')}
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
              <h1 className="text-3xl font-black text-slate-950 tracking-tight">{client.name}</h1>
              {statistics?.is_overdue && (
                <Badge variant="danger">
                  <AlertTriangle size={12} className="mr-1" />
                  Inadimplente
                </Badge>
              )}
            </div>
            <p className="text-gray-500 font-medium mt-1">Histórico completo do cliente</p>
          </div>
        </div>
        <div className="flex gap-3">
          {hasPermission('clients.update') && (
            <Button variant="outline" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <Edit size={18} /> Editar Cliente
          </Button>
          )}
          {hasPermission('service-orders.create') && (
            <Button onClick={() => navigate(`/service-orders/create?client_id=${client.id}`)}>
              <Plus size={18} /> Nova OS
          </Button>
          )}
        </div>
      </div>

      {/* Card de Informações do Cliente */}
      <Card className="border-l-4" style={{ borderLeftColor: statistics?.is_overdue ? '#ef4444' : 'var(--store-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-start gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ 
                  backgroundColor: statistics?.is_overdue ? '#fef2f2' : 'var(--store-color-light)',
                  color: statistics?.is_overdue ? '#ef4444' : 'var(--store-color)',
                }}
              >
                <User size={28} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-slate-900">{client.name}</h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={16} style={{ color: 'var(--store-color)' }} />
                    {client.phone || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={16} style={{ color: 'var(--store-color)' }} />
                    {client.email || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={16} style={{ color: 'var(--store-color)' }} />
                    CPF: {client.document || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 size={16} style={{ color: 'var(--store-color)' }} />
                    Loja: {clientStore?.name || 'Não informada'}
                    {clientStore?.unity && ` (${clientStore.unity})`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                    <Calendar size={16} style={{ color: 'var(--store-color)' }} />
                    Cliente desde: {formatDate(client.created_at)}
                  </div>
                </div>
                {client.address && (
                  <div className="flex items-start gap-2 mt-3 text-sm text-slate-600">
                    <MapPin size={16} style={{ color: 'var(--store-color)' }} className="mt-0.5" />
                    {client.address}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Compras</p>
              <p className="text-2xl font-black text-slate-900">{statistics?.total_orders || 0}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Gasto</p>
              <p className="text-2xl font-black text-emerald-700">{formatCurrency(statistics?.total_spent || 0)}</p>
            </div>
          </div>
        </div>

        {/* Alerta de Inadimplência */}
        {statistics?.is_overdue && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  Cliente com {statistics.overdue_count} OS inadimplente(s)
                </p>
                <p className="text-xs text-red-600">
                  Valor total em atraso: {formatCurrency(statistics.overdue_total)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Gasto', value: formatCurrency(statistics?.total_spent || 0), icon: DollarSign },
          { title: 'Total de Compras', value: String(statistics?.total_orders || 0), icon: ShoppingBag },
          { title: 'Ticket Médio', value: formatCurrency(statistics?.average_ticket || 0), icon: TrendingUp },
          { title: 'Última Compra', value: statistics?.last_purchase ? formatDate(statistics.last_purchase) : 'Nenhuma', icon: Calendar },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white p-5 lg:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative"
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"
                style={{ backgroundColor: 'var(--store-color-opacity-10)' }}
              />
              
              <div className="flex items-center justify-between mb-4 lg:mb-8">
                <div 
                  className="p-3 lg:p-4 rounded-xl"
                  style={{ 
                    backgroundColor: 'var(--store-color-light)',
                    color: 'var(--store-color)',
                  }}
                >
                  <Icon size={20} className="lg:w-6 lg:h-6" strokeWidth={2} />
                </div>
              </div>
              
              <div>
                <p className="text-[9px] lg:text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Abas de Conteúdo */}
      <Card className="p-0 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-100">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  style={activeTab === tab.id ? {
                    backgroundColor: 'var(--store-color)',
                    boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
                  } : undefined}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-8">
          {activeTab === 'compras' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Histórico de Compras</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {pagination?.totalItems || 0} ordens de serviço registradas
                </p>
              </div>
              <PurchasesTab
                orders={orders}
                loading={loadingOrders}
                pagination={pagination}
                onPageChange={handlePageChange}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
                navigate={navigate}
              />
            </div>
          )}
          {activeTab === 'receitas' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Receitas Médicas</h3>
                <p className="text-sm text-slate-500 mt-1">Prescrições e graus do cliente</p>
              </div>
              <PrescriptionsTab />
            </div>
          )}
          {activeTab === 'observacoes' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Observações</h3>
                <p className="text-sm text-slate-500 mt-1">Anotações e observações sobre o cliente</p>
              </div>
              <NotesTab />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
