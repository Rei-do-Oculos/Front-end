import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Eye, 
  Download, 
  Printer,
  ExternalLink,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  TrendingUp,
  BarChart3,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input, SingleSelect, FilterSection, ActiveFiltersBadge, Pagination, Badge, SortableHeader, SortDirection } from '../../components/Common';
import { usePlucks } from '../../services/hooks/usePlucks';
import { storesService } from '../../services/api/stores';
import { useActiveFilters } from '../../hooks/useActiveFilters';
import { useNotification } from '../../hooks/useNotification';

interface Invoice {
  id: string;
  invoiceNumber: string;
  series: string;
  osNumber: string;
  client: string;
  clientCpf: string;
  clientEmail?: string;
  date: string;
  dateTime: string;
  value: number;
  status: 'Autorizada' | 'Cancelada' | 'Rejeitada' | 'Pendente';
  store: string;
  storeId: number;
  accessKey: string;
  protocol?: string;
  paymentMethod: string;
  installments?: number;
  items: Array<{
    description: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
  }>;
}

// Dados mockados completos e realistas
const generateMockInvoices = (): Invoice[] => {
  const stores = ['Maringá Centro', 'Londrina Shopping', 'Curitiba Batel', 'Cascavel Centro', 'Foz do Iguaçu'];
  const statuses: Array<'Autorizada' | 'Cancelada' | 'Rejeitada' | 'Pendente'> = ['Autorizada', 'Autorizada', 'Autorizada', 'Autorizada', 'Pendente', 'Cancelada'];
  const paymentMethods = ['Cartão de Crédito', 'PIX', 'Dinheiro', 'Cartão de Débito', 'Crediário Próprio'];
  const clients = [
    { name: 'Maria das Graças dos Santos', cpf: '123.456.789-00' },
    { name: 'Maria Eduarda Simão', cpf: '987.654.321-00' },
    { name: 'Jackline Virgínia', cpf: '111.222.333-44' },
    { name: 'Elisangela de Oliveira Batista', cpf: '555.666.777-88' },
    { name: 'Lucas dos Santos', cpf: '999.888.777-66' },
    { name: 'Ana Paula Silva', cpf: '444.333.222-11' },
    { name: 'Roberto Carlos Mendes', cpf: '777.888.999-00' },
    { name: 'Fernanda Costa', cpf: '222.111.333-44' },
    { name: 'João Pedro Alves', cpf: '666.555.444-33' },
    { name: 'Juliana Ferreira', cpf: '333.444.555-66' },
  ];

  const invoices: Invoice[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 150; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Últimos 90 dias
    const hours = Math.floor(Math.random() * 12) + 8; // Entre 8h e 20h
    const minutes = Math.floor(Math.random() * 60);
    
    const client = clients[Math.floor(Math.random() * clients.length)];
    const store = stores[Math.floor(Math.random() * stores.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const value = Math.floor(Math.random() * 3000 + 200) + (Math.random() * 100); // Entre R$ 200 e R$ 3.100
    
    const invoiceNumber = String(i).padStart(6, '0');
    const accessKey = status === 'Autorizada' || status === 'Cancelada' 
      ? `3526${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}123456780001235500000000${invoiceNumber}${Math.floor(Math.random() * 100)}`
      : '';

    invoices.push({
      id: String(i),
      invoiceNumber,
      series: '001',
      osNumber: String(39800 + i),
      client: client.name,
      clientCpf: client.cpf,
      clientEmail: `${client.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      date: date.toLocaleDateString('pt-BR'),
      dateTime: `${date.toLocaleDateString('pt-BR')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      value: parseFloat(value.toFixed(2)),
      status,
      store,
      storeId: stores.indexOf(store) + 1,
      accessKey,
      protocol: status === 'Autorizada' ? String(Math.floor(Math.random() * 1000000000000000)).padStart(15, '0') : undefined,
      paymentMethod,
      installments: paymentMethod === 'Cartão de Crédito' ? Math.floor(Math.random() * 6) + 1 : undefined,
      items: [
        {
          description: 'Lentes Varilux Comfort 1.67',
          quantity: 1,
          unitValue: parseFloat((value * 0.6).toFixed(2)),
          totalValue: parseFloat((value * 0.6).toFixed(2)),
        },
        {
          description: 'Armação Ray-Ban RB2140',
          quantity: 1,
          unitValue: parseFloat((value * 0.4).toFixed(2)),
          totalValue: parseFloat((value * 0.4).toFixed(2)),
        },
      ],
    });
  }

  return invoices.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });
};

const mockInvoices = generateMockInvoices();

export const InvoiceList: React.FC = () => {
  const { showSuccess } = useNotification();
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortBy, setSortBy] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  
  // Usar usePlucks para trazer todas as lojas que o usuário tem acesso
  const { plucks: storesPlucks } = usePlucks({
    service: storesService,
    autoFetch: true,
  });
  
  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];
  
  // Calcular quantidade de filtros ativos
  const activeFilters = useActiveFilters({
    searchTerm,
    statusFilter,
    storeFilter,
    dateFromFilter,
    dateToFilter,
  });

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date.split('/').reverse().join('-'));
      invDate.setHours(0, 0, 0, 0);
      return invDate.getTime() === today.getTime();
    });
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date.split('/').reverse().join('-'));
      return invDate >= thisMonth;
    });
    
    const authorized = invoices.filter(inv => inv.status === 'Autorizada');
    const totalValue = invoices.reduce((sum, inv) => sum + inv.value, 0);
    const monthValue = monthInvoices.reduce((sum, inv) => sum + inv.value, 0);
    const todayValue = todayInvoices.reduce((sum, inv) => sum + inv.value, 0);
    
    const authorizationRate = invoices.length > 0 
      ? ((authorized.length / invoices.length) * 100).toFixed(1)
      : '0.0';
    
    return {
      today: {
        count: todayInvoices.length,
        value: todayValue,
      },
      month: {
        count: monthInvoices.length,
        value: monthValue,
      },
      total: {
        count: invoices.length,
        value: totalValue,
      },
      authorizationRate: parseFloat(authorizationRate),
      authorized: authorized.length,
    };
  }, [invoices]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Autorizada': return 'success';
      case 'Cancelada': return 'danger';
      case 'Rejeitada': return 'danger';
      case 'Pendente': return 'warning';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Autorizada': return <CheckCircle2 size={14} />;
      case 'Cancelada': return <XCircle size={14} />;
      case 'Rejeitada': return <XCircle size={14} />;
      case 'Pendente': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  // Filtrar e ordenar notas fiscais
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.osNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.accessKey.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      
      const matchesStore = !storeFilter || String(invoice.storeId) === storeFilter;
      
      const matchesDateFrom = !dateFromFilter || (() => {
        const invDate = new Date(invoice.date.split('/').reverse().join('-'));
        const filterDate = new Date(dateFromFilter);
        return invDate >= filterDate;
      })();
      
      const matchesDateTo = !dateToFilter || (() => {
        const invDate = new Date(invoice.date.split('/').reverse().join('-'));
        const filterDate = new Date(dateToFilter);
        filterDate.setHours(23, 59, 59);
        return invDate <= filterDate;
      })();

      return matchesSearch && matchesStatus && matchesStore && matchesDateFrom && matchesDateTo;
    });

    // Ordenação
    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case 'invoiceNumber':
            aVal = parseInt(a.invoiceNumber);
            bVal = parseInt(b.invoiceNumber);
            break;
          case 'date':
            aVal = new Date(a.date.split('/').reverse().join('-')).getTime();
            bVal = new Date(b.date.split('/').reverse().join('-')).getTime();
            break;
          case 'value':
            aVal = a.value;
            bVal = b.value;
            break;
          case 'client':
            aVal = a.client.toLowerCase();
            bVal = b.client.toLowerCase();
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [invoices, searchTerm, statusFilter, storeFilter, dateFromFilter, dateToFilter, sortBy, sortDirection]);

  // Paginação
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return filteredAndSortedInvoices.slice(start, end);
  }, [filteredAndSortedInvoices, currentPage, perPage]);

  const totalPages = Math.ceil(filteredAndSortedInvoices.length / perPage);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStoreFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDownloadXML = (invoice: Invoice) => {
    showSuccess('Download iniciado', `XML da NF-e ${invoice.invoiceNumber} será baixado.`);
  };

  const handlePrintDANFE = (invoice: Invoice) => {
    showSuccess('Impressão', `DANFE da NF-e ${invoice.invoiceNumber} será impresso.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <FileText size={28} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Notas Fiscais Eletrônicas</h1>
            <p className="text-gray-500 font-medium mt-1">Fiscal • Emissão • Controle</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <BarChart3 size={18} /> Relatório Fiscal
          </Button>
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Download size={18} /> Exportar XML
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hoje</p>
              <p className="text-2xl font-black text-slate-900">{stats.today.count} NF-e</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{formatCurrency(stats.today.value)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <Calendar size={24} className="text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mês Atual</p>
              <p className="text-2xl font-black text-slate-900">{stats.month.count} NF-e</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{formatCurrency(stats.month.value)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Taxa de Autorização</p>
              <p className="text-2xl font-black text-emerald-600">{stats.authorizationRate}%</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{stats.authorized} autorizadas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileCheck size={24} className="text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.total.value)}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{stats.total.count} notas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <DollarSign size={24} className="text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <FilterSection onClear={handleClearFilters} onApply={handleApplyFilters}>
        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input 
            label="Buscar" 
            placeholder="Nº NF-e, OS, Cliente ou Chave de Acesso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SingleSelect
            label="Status"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Todos' },
              { value: 'Autorizada', label: 'Autorizada' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Cancelada', label: 'Cancelada' },
              { value: 'Rejeitada', label: 'Rejeitada' },
            ]}
            placeholder="Todos"
          />
          <SingleSelect
            label="Unidade"
            value={storeFilter}
            onChange={(val) => setStoreFilter(val)}
            options={[
              { value: '', label: 'Todas' },
              ...safeStoresPlucks.map((store: any) => ({ 
                value: String(store.id), 
                label: store.name 
              })),
            ]}
            placeholder="Todas"
          />
          <Input 
            label="Data Início" 
            type="date"
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
          />
          <Input 
            label="Data Fim" 
            type="date"
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
          />
        </div>
      </FilterSection>

      {/* Contagem de resultados */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-slate-600">
            {filteredAndSortedInvoices.length === 0 ? 'Nenhum resultado encontrado' : 
             filteredAndSortedInvoices.length === 1 ? '1 resultado encontrado' : 
             `${filteredAndSortedInvoices.length} resultados encontrados`}
          </p>
          {activeFilters > 0 && (
            <ActiveFiltersBadge count={activeFilters} />
          )}
        </div>
      </div>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <SortableHeader
                  label="NF-e / Série"
                  sortKey="invoiceNumber"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">OS</th>
                <SortableHeader
                  label="Cliente"
                  sortKey="client"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Data / Hora"
                  sortKey="date"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Valor"
                  sortKey="value"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="px-6 py-4"
                />
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={40} className="text-slate-400" />
                      <span className="text-sm text-slate-500">Nenhuma nota fiscal encontrada</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">#{invoice.invoiceNumber}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">Série {invoice.series}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => window.location.hash = `#/service-orders/${invoice.osNumber}`}
                        className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
                      >
                        OS #{invoice.osNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-red-600 transition-colors">{invoice.client}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{invoice.clientCpf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar size={12} /> {invoice.dateTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{formatCurrency(invoice.value)}</span>
                        <span className="text-[9px] font-bold text-slate-500 mt-1">{invoice.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(invoice.status)} className="flex items-center gap-1.5 w-fit">
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          title="Visualizar NF-e"
                          onClick={() => window.location.hash = `#/notas-fiscais/${invoice.id}`}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        {invoice.status === 'Autorizada' && (
                          <>
                            <button 
                              title="Download XML"
                              onClick={() => handleDownloadXML(invoice)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              title="Imprimir DANFE"
                              onClick={() => handlePrintDANFE(invoice)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Printer size={16} />
                            </button>
                          </>
                        )}
                        {invoice.accessKey && (
                          <button 
                            title="Consultar na SEFAZ"
                            onClick={() => window.open(`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConteudo=XbSeqxE8pl8=`, '_blank')}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                          >
                            <ExternalLink size={16} />
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

        {/* Paginação */}
        {totalPages > 1 && (
          <Pagination
            pagination={{
              currentPage,
              totalPages,
              totalItems: filteredAndSortedInvoices.length,
              perPage,
            }}
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            onPageChange={(page) => setCurrentPage(page)}
            itemName="notas fiscais"
          />
        )}
      </Card>
    </div>
  );
};
