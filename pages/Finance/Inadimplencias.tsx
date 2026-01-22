import React from 'react';
import { AlertTriangle, FileText, Phone, User } from 'lucide-react';
import { Card, Badge, Button, FilterSection, Input, Select } from '../../components/Common';

interface Delinquency {
  id: string;
  osNumber: string;
  client: string;
  store: string;
  openedAt: string;
  amount: number;
  status: 'Em atraso' | 'Em cobrança' | 'Em negociação';
}

const delinquencyList: Delinquency[] = [
  { id: 'd-001', osNumber: '39812', client: 'Rafaela Mendes', store: 'Maringá Centro', openedAt: '12/01/2026', amount: 1240.0, status: 'Em atraso' },
  { id: 'd-002', osNumber: '39805', client: 'João Victor Reis', store: 'Londrina Shopping', openedAt: '10/01/2026', amount: 890.9, status: 'Em cobrança' },
  { id: 'd-003', osNumber: '39792', client: 'Mariana Costa', store: 'Curitiba Batel', openedAt: '07/01/2026', amount: 2150.0, status: 'Em negociação' },
  { id: 'd-004', osNumber: '39781', client: 'Carlos Henrique', store: 'Maringá Centro', openedAt: '05/01/2026', amount: 560.0, status: 'Em atraso' },
  { id: 'd-005', osNumber: '39770', client: 'Lívia Amaral', store: 'Londrina Shopping', openedAt: '03/01/2026', amount: 980.0, status: 'Em cobrança' },
];

export const Inadimplencias: React.FC = () => {
  const getVariant = (status: Delinquency['status']) => {
    switch (status) {
      case 'Em atraso':
        return 'danger';
      case 'Em cobrança':
        return 'warning';
      case 'Em negociação':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Inadimplências</h1>
          <p className="text-gray-500 font-medium mt-1">Ordens abertas no laboratório sem retirada e com valores em aberto.</p>
        </div>
        <Button className="shadow-red-600/20">
          <AlertTriangle size={18} /> Gerar cobrança
        </Button>
      </div>

      <FilterSection>
        <Input label="Cliente" placeholder="Nome do cliente..." />
        <Input label="Nº da OS" placeholder="Ex: 39812" />
        <Select label="Unidade" options={[
          { label: 'TODAS', value: '' },
          { label: 'Maringá Centro', value: 'maringa' },
          { label: 'Londrina Shopping', value: 'londrina' },
          { label: 'Curitiba Batel', value: 'curitiba' },
        ]} />
        <Select label="Status" options={[
          { label: 'TODOS', value: '' },
          { label: 'Em atraso', value: 'atraso' },
          { label: 'Em cobrança', value: 'cobranca' },
          { label: 'Em negociação', value: 'negociacao' },
        ]} />
      </FilterSection>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">OS / Data</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor em aberto</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {delinquencyList.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-400">#{item.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">#{item.osNumber}</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.openedAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <User size={18} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">{item.client}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.store}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-red-600">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button title="Ver histórico" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <FileText size={16} />
                      </button>
                      <button title="Entrar em contato" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Phone size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
