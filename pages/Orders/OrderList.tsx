
import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Printer, 
  Trash2, 
  FileText,
  Filter,
  MoreVertical,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  FileCheck
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, FilterSection, ActiveFiltersBadge } from '../../components/Common';
import { useActiveFilters } from '../../hooks/useActiveFilters';

interface OS {
  id: string;
  osNumber: string;
  client: string;
  date: string;
  value: number;
  status: 'Pendente' | 'Laboratório' | 'Pronto' | 'Entregue' | 'Cancelado';
  store: string;
  payment: 'Pago' | 'Pendente';
  invoiceId?: string; // ID da NF-e relacionada (se existir)
  invoiceNumber?: string;
}

const mockOS: OS[] = [
  { 
    id: '1', 
    osNumber: '39832', 
    client: 'Maria das Graças dos Santos', 
    date: '21/01/2026 17:23', 
    value: 1450.00, 
    status: 'Laboratório', 
    store: 'Maringá Centro',
    payment: 'Pago',
    invoiceId: '1',
    invoiceNumber: '000001'
  },
  { 
    id: '2', 
    osNumber: '39831', 
    client: 'Elisangela de Oliveira Batista', 
    date: '21/01/2026 15:07', 
    value: 890.90, 
    status: 'Pendente', 
    store: 'Maringá Centro',
    payment: 'Pendente'
  },
  { 
    id: '3', 
    osNumber: '39830', 
    client: 'Maria Eduarda Simão', 
    date: '21/01/2026 15:05', 
    value: 2100.00, 
    status: 'Pronto', 
    store: 'Londrina Shopping',
    payment: 'Pago',
    invoiceId: '2',
    invoiceNumber: '000002'
  },
  { 
    id: '4', 
    osNumber: '39829', 
    client: 'Jackline Virgínia', 
    date: '21/01/2026 15:01', 
    value: 550.00, 
    status: 'Entregue', 
    store: 'Curitiba Batel',
    payment: 'Pago'
  },
  { 
    id: '5', 
    osNumber: '39828', 
    client: 'Lucas dos Santos', 
    date: '21/01/2026 14:26', 
    value: 1200.00, 
    status: 'Cancelado', 
    store: 'Maringá Centro',
    payment: 'Pendente'
  },
];

export const OrderList: React.FC = () => {
  const [osNumber, setOsNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  
  const activeFilters = useActiveFilters({
    osNumber,
    clientName,
    statusFilter,
    unitFilter,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Laboratório': return 'primary';
      case 'Pendente': return 'warning';
      case 'Pronto': return 'success';
      case 'Entregue': return 'info';
      case 'Cancelado': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Ordens de Serviço</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Faturamento • Controle de Vendas • Entrega</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Printer size={18} /> Relatório Diário
          </Button>
          <Button onClick={() => window.location.hash = '#/pedidos/create'} className="shadow-red-600/20 bg-red-600">
            <Plus size={18} /> Abrir Nova OS
          </Button>
        </div>
      </div>

      {/* Stats Resumidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', val: '14 OS', color: 'red' },
          { label: 'Aguardando Lab', val: '08 OS', color: 'blue' },
          { label: 'Prontas p/ Retirada', val: '05 OS', color: 'emerald' },
          { label: 'Faturamento Mês', val: 'R$ 42k', color: 'slate' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <p className={`text-lg font-black text-slate-900 mt-0.5`}>{stat.val}</p>
          </div>
        ))}
      </div>

      <FilterSection>
        <Input label="Nº da OS" placeholder="Ex: 39832" value={osNumber} onChange={(e) => setOsNumber(e.target.value)} />
        <Input label="Cliente" placeholder="Nome do paciente..." value={clientName} onChange={(e) => setClientName(e.target.value)} />
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
          {label: 'TODOS', value: ''},
          {label: 'Pendente', value: 'pendente'},
          {label: 'Laboratório', value: 'lab'},
          {label: 'Pronto', value: 'pronto'},
          {label: 'Entregue', value: 'entregue'},
          {label: 'Cancelado', value: 'cancelado'},
        ]} />
        <Select label="Unidade" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} options={[
          {label: 'TODAS', value: ''},
          {label: 'Maringá Centro', value: 'maringa'},
          {label: 'Londrina Shopping', value: 'londrina'},
          {label: 'Curitiba Batel', value: 'curitiba'},
        ]} />
      </FilterSection>

      {/* Contagem de resultados e badge de filtros ativos */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-slate-600">
            {mockOS.length === 0 ? 'Nenhum resultado encontrado' : 
             mockOS.length === 1 ? '1 resultado encontrado' : 
             `${mockOS.length} resultados encontrados`}
          </p>
          {activeFilters > 0 && (
            <ActiveFiltersBadge count={activeFilters} />
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">OS / Data</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Paciente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor Total</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockOS.map((os) => (
                <tr key={os.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400">#{os.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">#{os.osNumber}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400">
                        <Calendar size={10} /> {os.date}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <User size={18} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-red-600 transition-colors">{os.client}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{os.store}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">R$ {os.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className={`text-[9px] font-black uppercase mt-1 ${os.payment === 'Pago' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {os.payment}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={getStatusVariant(os.status)}>{os.status}</Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-100 transition-all">
                      <button title="Visualizar" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Eye size={16} />
                      </button>
                      <button 
                        title="Editar"
                        onClick={() => window.location.hash = `#/pedidos/${os.id}/editar`}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      {os.invoiceId && (
                        <button 
                          title={`Ver NF-e #${os.invoiceNumber}`}
                          onClick={() => window.location.hash = `#/notas-fiscais/${os.invoiceId}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <FileCheck size={16} />
                        </button>
                      )}
                      <button title="Imprimir OS" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Printer size={16} />
                      </button>
                      <button title="Excluir" className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Trash2 size={16} />
                      </button>
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
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exibindo 5 de 1,240 Ordens de Serviço</p>
        </div>
      </Card>
    </div>
  );
};
