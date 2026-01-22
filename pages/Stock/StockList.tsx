
import React from 'react';
import { Search, Edit, Plus, ArrowRightLeft, Filter, Package } from 'lucide-react';
import { Card, Button, Input, Select, FilterSection, Badge } from '../../components/Common';

export const StockList: React.FC = () => {
  const stockItems = [
    { id: '1360', desc: 'Armação Infantil Nylon 1360', type: 'INFANTIL NYLON', gender: 'Feminino', date: '17/06/2024', loc: 'MARINGÁ' },
    { id: '4386', desc: 'Armação Masculina Acetato 4386', type: 'INFANTIL ACETATO', gender: 'Masculino', date: '17/06/2024', loc: 'MARINGÁ' },
    { id: '2010', desc: 'Armação Classic 20102', type: 'INFANTIL ACETATO', gender: 'Masculino', date: '18/06/2024', loc: 'MARINGÁ' },
    { id: '1811', desc: 'Metal Frame 18110', type: 'INFANTIL METAL', gender: 'Masculino', date: '18/06/2024', loc: 'MARINGÁ' },
    { id: '1815', desc: 'Acetato Preta 18158', type: 'INFANTIL ACETATO', gender: 'Masculino', date: '18/06/2024', loc: 'MARINGÁ' },
    { id: '0200', desc: 'Clipon Metal 200', type: 'CLIPON METAL', gender: 'Masculino', date: '18/06/2024', loc: 'MARINGÁ' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Estoque Geral</h1>
          <p className="text-gray-500 font-medium mt-1">Controle de armações, lentes e insumos da unidade.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline">
            <ArrowRightLeft size={18} /> Transferências
          </Button>
          <Button onClick={() => window.location.hash = '#/estoque/novo'} className="shadow-red-600/20">
            <Plus size={18} /> Cadastrar Armação
          </Button>
        </div>
      </div>

      <FilterSection>
        <Input label="Código/SKU" placeholder="0000" />
        <Input label="Descrição do Produto" placeholder="Buscar por modelo..." />
        <Select label="Tipo de Armação" options={[{label: 'TODOS', value: ''}, {label: 'ACETATO', value: 'acetato'}, {label: 'METAL', value: 'metal'}]} />
        <Select label="Gênero" options={[{label: 'TODOS', value: ''}, {label: 'Masculino', value: 'm'}, {label: 'Feminino', value: 'f'}]} />
        <Select label="Unidade/Ótica" options={[{label: 'TODAS', value: ''}, {label: 'MARINGÁ', value: 'maringa'}]} />
        <Input label="Cadastrado após" type="date" />
      </FilterSection>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Código</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição da Armação</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo / Gênero</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stockItems.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-400">#{item.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-900">#{item.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <Package size={18} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-700">{item.desc}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Ref: 2024-X</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                       <Badge variant="info">{item.type}</Badge>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{item.gender}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-black text-red-600 uppercase tracking-widest">{item.loc}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button title="Editar armação" className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Edit size={16} />
                      </button>
                      <button title="Transferir entre unidades" className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <ArrowRightLeft size={16} />
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
