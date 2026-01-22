
import React from 'react';
import { Plus, Store, MapPin, Phone, Edit, Trash2, Eye, Search, Building2, ChevronRight } from 'lucide-react';
// Added Select to the imports from ../../components/Common
import { Card, Button, Badge, Input, FilterSection, Select } from '../../components/Common';
import { Link } from 'react-router-dom';

const stores = [
  { 
    id: '1', 
    name: 'Maringá Centro', 
    fancyName: 'Rei do Óculos - Matriz',
    cnpj: '12.345.678/0001-01', 
    city: 'Maringá - PR', 
    phone: '(44) 3025-1010', 
    color: '#dc2626', 
    status: 'Ativa',
    employees: 8,
    lastActivity: 'Há 5 min'
  },
  { 
    id: '2', 
    name: 'Londrina Shopping', 
    fancyName: 'Rei do Óculos - Catuaí',
    cnpj: '12.345.678/0002-02', 
    city: 'Londrina - PR', 
    phone: '(43) 3322-4455', 
    color: '#334155', 
    status: 'Ativa',
    employees: 5,
    lastActivity: 'Há 12 min'
  },
  { 
    id: '3', 
    name: 'Curitiba Batel', 
    fancyName: 'Rei do Óculos - Batel',
    cnpj: '12.345.678/0003-03', 
    city: 'Curitiba - PR', 
    phone: '(41) 3344-5566', 
    color: '#059669', 
    status: 'Inativa',
    employees: 0,
    lastActivity: 'Inativa'
  },
];

export const StoreList: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Gestão de Unidades</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Filiais • Franquias • Pontos de Venda</p>
        </div>
        <Button onClick={() => window.location.hash = '#/lojas/novo'} className="shadow-red-600/20 px-8 py-4 rounded-2xl">
          <Plus size={20} /> Adicionar Nova Loja
        </Button>
      </div>

      <FilterSection>
        <Input label="Pesquisar Unidade" placeholder="Nome, CNPJ ou Cidade..." />
        {/* Select component is now properly imported */}
        <Select label="Status" options={[
          {label: 'TODAS', value: ''},
          {label: 'Ativa', value: 'ativa'},
          {label: 'Inativa', value: 'inativa'},
        ]} />
      </FilterSection>

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Localização</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipe</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stores.map((store) => (
                <tr key={store.id} className="group hover:bg-red-50/30 transition-all duration-300">
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-400">#{store.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                        style={{ backgroundColor: store.color }}
                      >
                        <Store size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none">{store.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">{store.cnpj}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <MapPin size={14} className="text-red-500" /> {store.city}
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 ml-5">{store.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-black text-slate-900">{store.employees} Colaboradores</p>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{store.lastActivity}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={store.status === 'Ativa' ? 'success' : 'danger'}>
                      {store.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <Link 
                        to={`/lojas/${store.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-slate-200"
                      >
                        Ver Unidade <ChevronRight size={14} />
                      </Link>
                      <button 
                        title="Editar unidade"
                        onClick={() => window.location.hash = `#/lojas/${store.id}/editar`}
                        className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                      >
                        <Edit size={18} />
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
