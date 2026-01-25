
import React, { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ArrowRight, 
  PackageCheck, 
  FilePlus2,
  AlertCircle,
  Timer,
  ChevronRight,
  Filter,
  Send,
  Boxes,
  // Added missing Plus icon
  Plus
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, FilterSection, ActiveFiltersBadge } from '../../components/Common';
import { useActiveFilters } from '../../hooks/useActiveFilters';

interface LabOrder {
  id: string;
  client: string;
  lens: string;
  lab: string;
  status: 'Aguardando Envio' | 'Em Laboratório' | 'Recebido na Loja';
  priority: 'Normal' | 'Urgente';
  createdAt: string;
  sentAt?: string;
  receivedAt?: string;
}

const initialLabOrders: LabOrder[] = [
  { 
    id: 'LAB-9021', 
    client: 'Marcos Vinícius Silva', 
    lens: 'Varilux Physio 3.0 BlueUV', 
    lab: 'Essilor Brasil', 
    status: 'Em Laboratório', 
    priority: 'Urgente',
    createdAt: '20/01/2026',
    sentAt: '21/01/2026'
  },
  { 
    id: 'LAB-9022', 
    client: 'Ana Cláudia Pereira', 
    lens: 'Hoya Miolens 1.67 AR', 
    lab: 'Laboratório Regional', 
    status: 'Aguardando Envio', 
    priority: 'Normal',
    createdAt: '21/01/2026'
  },
  { 
    id: 'LAB-9018', 
    client: 'Roberto Carlos Duarte', 
    lens: 'Visão Simples Poly Transitions', 
    lab: 'Montagem Interna', 
    status: 'Recebido na Loja', 
    priority: 'Normal',
    createdAt: '19/01/2026',
    sentAt: '19/01/2026',
    receivedAt: '21/01/2026'
  }
];

export const LabOrders: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>(initialLabOrders);
  const [protocolFilter, setProtocolFilter] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const activeFilters = useActiveFilters({
    protocolFilter,
    labFilter,
    statusFilter,
    dateFilter,
  });

  const updateStatus = (id: string, newStatus: LabOrder['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Recebido na Loja': return 'success';
      case 'Em Laboratório': return 'primary';
      case 'Aguardando Envio': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Fluxo de Laboratório</h1>
            <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Triagem de Lentes • Controle de Produção Externa</p>
          </div>
          <ActiveFiltersBadge count={activeFilters} />
        </div>
        <div className="flex gap-3">
           <Button className="shadow-red-600/20 bg-red-600 rounded-2xl">
              <FilePlus2 size={18} /> Nova Solicitação
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pendente Envio', count: 5, color: 'amber', icon: Clock },
          { label: 'No Laboratório', count: 12, color: 'blue', icon: FlaskConical },
          { label: 'Chegou na Loja', count: 3, color: 'emerald', icon: PackageCheck },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}>
              <stat.icon size={24} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      <FilterSection>
        <Input label="Protocolo ou Cliente" placeholder="Ex: LAB-000..." value={protocolFilter} onChange={(e) => setProtocolFilter(e.target.value)} />
        <Select label="Laboratório" value={labFilter} onChange={(e) => setLabFilter(e.target.value)} options={[
          {label: 'TODOS', value: ''},
          {label: 'Essilor', value: 'essilor'},
          {label: 'Hoya', value: 'hoya'},
        ]} />
        <Select label="Status Atual" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
          {label: 'TODOS', value: ''},
          {label: 'Aguardando Envio', value: 'wait'},
          {label: 'Em Laboratório', value: 'lab'},
          {label: 'Recebido na Loja', value: 'received'},
        ]} />
        <Input label="Data Solicitação" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </FilterSection>

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocolo / Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Lente / Lab</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Produção</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Datas de Controle</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações de Fluxo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400">#{order.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant={order.priority === 'Urgente' ? 'danger' : 'info'}>{order.id}</Badge>
                        {order.priority === 'Urgente' && <AlertCircle size={14} className="text-red-600 animate-pulse" />}
                      </div>
                      <p className="text-sm font-black text-slate-900">{order.client}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-700">{order.lens}</p>
                    <p className="text-[10px] font-black text-red-600 uppercase mt-1 tracking-tight">{order.lab}</p>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={getStatusStyle(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Plus size={10} className="text-emerald-500" /> Aberto: {order.createdAt}
                      </div>
                      {order.sentAt && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Send size={10} className="text-blue-500" /> Enviado: {order.sentAt}
                        </div>
                      )}
                      {order.receivedAt && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                          <PackageCheck size={10} /> Chegou: {order.receivedAt}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      {order.status === 'Aguardando Envio' && (
                        <Button 
                          onClick={() => updateStatus(order.id, 'Em Laboratório')}
                          className="bg-blue-600 text-[10px] py-2 px-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700"
                        >
                          <Send size={14} /> Despachar Lab
                        </Button>
                      )}
                      
                      {order.status === 'Em Laboratório' && (
                        <Button 
                          onClick={() => updateStatus(order.id, 'Recebido na Loja')}
                          className="bg-emerald-500 text-[10px] py-2 px-4 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-600"
                        >
                          <PackageCheck size={14} /> Confirmar Chegada
                        </Button>
                      )}

                      {order.status === 'Recebido na Loja' && (
                        <Button 
                          className="bg-red-600 text-[10px] py-2 px-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-200"
                        >
                          <Boxes size={14} /> Gerar OS Faturamento
                        </Button>
                      )}
                      
                      <button title="Ver detalhes completos" className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-start gap-4">
        <AlertCircle className="text-red-600 shrink-0" size={24} />
        <div>
          <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">Manual de Processo</h4>
          <p className="text-xs text-red-700 font-medium leading-relaxed mt-1">
            Utilize este painel para registrar a logística de lentes. O status deve ser alterado manualmente conforme o produto físico se move. 
            <strong> Gerar OS de Faturamento</strong> removerá o registro desta lista e criará uma Ordem de Serviço definitiva na listagem principal.
          </p>
        </div>
      </div>
    </div>
  );
};
