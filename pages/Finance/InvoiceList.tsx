
import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter,
  Eye, 
  Download, 
  Printer,
  ExternalLink,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, FilterSection } from '../../components/Common';

interface Invoice {
  id: string;
  invoiceNumber: string;
  series: string;
  osNumber: string;
  client: string;
  clientCpf: string;
  date: string;
  value: number;
  status: 'Autorizada' | 'Cancelada' | 'Rejeitada' | 'Pendente';
  store: string;
  accessKey: string;
  paymentMethod: string;
}

const mockInvoices: Invoice[] = [
  { 
    id: '1', 
    invoiceNumber: '000001', 
    series: '001',
    osNumber: '39832', 
    client: 'Maria das Graças dos Santos',
    clientCpf: '123.456.789-00',
    date: '21/01/2026 17:30', 
    value: 1450.00, 
    status: 'Autorizada',
    store: 'Maringá Centro',
    accessKey: '35260112345678000123550000000000012345678901',
    paymentMethod: 'Cartão de Crédito'
  },
  { 
    id: '2', 
    invoiceNumber: '000002', 
    series: '001',
    osNumber: '39830', 
    client: 'Maria Eduarda Simão',
    clientCpf: '987.654.321-00',
    date: '21/01/2026 15:10', 
    value: 2100.00, 
    status: 'Autorizada',
    store: 'Londrina Shopping',
    accessKey: '35260112345678000123550000000000012345678902',
    paymentMethod: 'PIX'
  },
  { 
    id: '3', 
    invoiceNumber: '000003', 
    series: '001',
    osNumber: '39829', 
    client: 'Jackline Virgínia',
    clientCpf: '111.222.333-44',
    date: '21/01/2026 15:05', 
    value: 550.00, 
    status: 'Autorizada',
    store: 'Curitiba Batel',
    accessKey: '35260112345678000123550000000000012345678903',
    paymentMethod: 'Dinheiro'
  },
  { 
    id: '4', 
    invoiceNumber: '000004', 
    series: '001',
    osNumber: '39831', 
    client: 'Elisangela de Oliveira Batista',
    clientCpf: '555.666.777-88',
    date: '21/01/2026 15:08', 
    value: 890.90, 
    status: 'Pendente',
    store: 'Maringá Centro',
    accessKey: '',
    paymentMethod: 'Crediário Próprio'
  },
  { 
    id: '5', 
    invoiceNumber: '000005', 
    series: '001',
    osNumber: '39828', 
    client: 'Lucas dos Santos',
    clientCpf: '999.888.777-66',
    date: '21/01/2026 14:30', 
    value: 1200.00, 
    status: 'Cancelada',
    store: 'Maringá Centro',
    accessKey: '35260112345678000123550000000000012345678905',
    paymentMethod: 'Cartão de Débito'
  },
];

export const InvoiceList: React.FC = () => {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.osNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.accessKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    const matchesStore = !storeFilter || invoice.store === storeFilter;

    return matchesSearch && matchesStatus && matchesStore;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Notas Fiscais Eletrônicas</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Fiscal • Emissão • Controle</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Printer size={18} /> Relatório Fiscal
          </Button>
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Download size={18} /> Exportar XML
          </Button>
        </div>
      </div>

      {/* Stats Resumidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', val: '12 NF-e', color: 'red' },
          { label: 'Mês Atual', val: '342 NF-e', color: 'blue' },
          { label: 'Autorizadas', val: '98.5%', color: 'emerald' },
          { label: 'Valor Total', val: 'R$ 125k', color: 'slate' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <p className={`text-lg font-black text-slate-900 mt-0.5`}>{stat.val}</p>
          </div>
        ))}
      </div>

      <FilterSection>
        <Input 
          label="Buscar" 
          placeholder="Nº NF-e, OS, Cliente ou Chave de Acesso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select 
          label="Status" 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            {label: 'TODOS', value: ''},
            {label: 'Autorizada', value: 'Autorizada'},
            {label: 'Pendente', value: 'Pendente'},
            {label: 'Cancelada', value: 'Cancelada'},
            {label: 'Rejeitada', value: 'Rejeitada'},
          ]} 
        />
        <Select 
          label="Unidade" 
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          options={[
            {label: 'TODAS', value: ''},
            {label: 'Maringá Centro', value: 'Maringá Centro'},
            {label: 'Londrina Shopping', value: 'Londrina Shopping'},
            {label: 'Curitiba Batel', value: 'Curitiba Batel'},
          ]} 
        />
      </FilterSection>

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">NF-e / Série</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">OS</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Data / Hora</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400">#{invoice.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">#{invoice.invoiceNumber}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">Série {invoice.series}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => window.location.hash = `#/pedidos/${invoice.osNumber}/editar`}
                      className="text-sm font-black text-red-600 hover:text-red-700 hover:underline transition-colors"
                    >
                      OS #{invoice.osNumber}
                    </button>
                  </td>
                  <td className="px-8 py-6">
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
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Calendar size={10} /> {invoice.date}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">R$ {invoice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[9px] font-bold text-slate-500 mt-1">{invoice.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={getStatusVariant(invoice.status)} className="flex items-center gap-1.5 w-fit">
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-100 transition-all">
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
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            title="Imprimir DANFE"
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-600 text-white font-black text-[10px]">1</button>
             <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 font-black text-[10px]">2</button>
             <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 font-black text-[10px]">3</button>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exibindo {filteredInvoices.length} de {invoices.length} Notas Fiscais</p>
        </div>
      </Card>
    </div>
  );
};
