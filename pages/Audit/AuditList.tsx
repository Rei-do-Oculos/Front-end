
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Store, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Database,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, FilterSection } from '../../components/Common';

interface AuditDetail {
  field: string;
  old: string | null;
  new: string | null;
}

interface AuditLog {
  id: string;
  user: string;
  avatar: string;
  action: 'CRIOU' | 'ATUALIZOU' | 'EXCLUIU';
  target: string;
  model: string;
  store: string;
  date: string;
  type: 'create' | 'update' | 'delete';
  details: AuditDetail[];
}

const auditLogs: AuditLog[] = [
  { 
    id: '10245', 
    user: 'Rodrigo Paduin', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rodrigo',
    action: 'CRIOU', 
    target: 'Ordem de Serviço #39832', 
    model: 'Order',
    store: 'Maringá Centro', 
    date: 'Hoje, às 14:22',
    type: 'create',
    details: [
      { field: 'cliente_id', old: null, new: 'Maria Santos (398)' },
      { field: 'valor_total', old: null, new: 'R$ 1.450,00' },
      { field: 'status', old: null, new: 'Pendente' }
    ]
  },
  { 
    id: '10244', 
    user: 'Ana Beatriz', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    action: 'ATUALIZOU', 
    target: 'Estoque Armação Rayban Ref 3447', 
    model: 'Stock',
    store: 'Londrina Shopping', 
    date: 'Hoje, às 13:45',
    type: 'update',
    details: [
      { field: 'quantidade', old: '5', new: '4' },
      { field: 'ultima_venda', old: '20/01/2026', new: '21/01/2026' }
    ]
  },
  { 
    id: '10243', 
    user: 'Ricardo Silva', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo',
    action: 'EXCLUIU', 
    target: 'Cliente Sem Nome (Rascunho)', 
    model: 'Client',
    store: 'Curitiba Batel', 
    date: 'Ontem, às 18:10',
    type: 'delete',
    details: [
      { field: 'deleted_at', old: null, new: '20/01/2026 18:10' }
    ]
  },
];

export const AuditList: React.FC = () => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Auditoria do Sistema</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Histórico de Alterações • Logs de Dados</p>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Logs em Tempo Real Ativos</span>
           </div>
        </div>
      </div>

      <FilterSection>
        <Input label="Pesquisar Log" placeholder="Usuário, ID ou Entidade..." />
        <Select label="Tipo de Ação" options={[
          {label: 'TODAS', value: ''},
          {label: 'Criação', value: 'create'},
          {label: 'Edição', value: 'update'},
          {label: 'Exclusão', value: 'delete'},
        ]} />
        <Select label="Entidade (Model)" options={[
          {label: 'TODAS', value: ''},
          {label: 'Ordens de Serviço', value: 'Order'},
          {label: 'Clientes', value: 'Client'},
          {label: 'Estoque', value: 'Stock'},
        ]} />
        <Input label="Data" type="date" />
      </FilterSection>

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Colaborador</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Ação</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Registro Afetado</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Loja</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Data</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {auditLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className={`group transition-all duration-300 ${expandedRows.includes(log.id) ? 'bg-red-50/20' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={log.avatar} className="w-10 h-10 rounded-xl bg-white p-0.5 border border-slate-100 shadow-sm" alt={log.user} />
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none">{log.user}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">ID Log: {log.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {getActionBadge(log.type, log.action)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className="text-xs font-black text-slate-700">{log.target}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Model: {log.model}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <Store size={14} className="text-red-600" />
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{log.store}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock size={12} /> {log.date}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                         <button 
                            onClick={() => toggleRow(log.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              expandedRows.includes(log.id) 
                              ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                              : 'bg-white text-slate-400 border border-slate-100 hover:border-red-200 hover:text-red-600'
                            }`}
                         >
                            {expandedRows.includes(log.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expandedRows.includes(log.id) ? 'Ocultar' : 'Detalhes'}
                         </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Linha Expandida - Detalhes do Log */}
                  {expandedRows.includes(log.id) && (
                    <tr className="bg-red-50/10">
                      <td colSpan={6} className="px-8 py-0">
                        <div className="py-6 border-t border-red-100/30 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-4">
                                <Database size={16} className="text-red-600" />
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Alterações de Dados</h4>
                              </div>
                              
                              <div className="bg-white rounded-2xl border border-red-100/50 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
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
                                    {log.details.map((detail, idx) => (
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
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-4">
                                <Info size={16} className="text-red-600" />
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Informações Adicionais</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço IP</p>
                                  <p className="text-xs font-bold text-slate-900 tracking-tight">192.168.1.142</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Navegador</p>
                                  <p className="text-xs font-bold text-slate-900 tracking-tight">Chrome (Windows)</p>
                                </div>
                                <div className="col-span-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">URL de Origem</p>
                                  <p className="text-xs font-bold text-slate-900 tracking-tight truncate">/api/v1/orders/store</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrando {auditLogs.length} logs desta sessão</p>
         <div className="flex gap-2">
            <Button variant="outline" className="px-6 py-2 text-[10px] rounded-xl">Anterior</Button>
            <Button className="px-6 py-2 text-[10px] rounded-xl">Próxima Página</Button>
         </div>
      </div>
    </div>
  );
};
