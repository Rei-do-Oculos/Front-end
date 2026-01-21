
import React from 'react';
import { Search, Edit, Plus, Truck, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Card, Button, Badge, FilterSection, Input, Select } from '../../components/Common';

export const SupplierList: React.FC = () => {
  const suppliers = [
    { id: '1', name: 'Essilor Laboratório', cnpj: '00.123.456/0001-99', specialty: 'Lentes Premium', contact: 'Roberto (Consultor)', phone: '(11) 98877-6655', city: 'São Paulo - SP', status: 'Ativo' },
    { id: '2', name: 'Hoya Vision Care', cnpj: '11.444.777/0001-22', specialty: 'Tecnologia Japonesa', contact: 'Ana Paula', phone: '(11) 97766-5544', city: 'Curitiba - PR', status: 'Ativo' },
    { id: '3', name: 'Laboratório Maringá Lentes', cnpj: '22.333.555/0001-11', specialty: 'Lentes Multifocais', contact: 'Marcos', phone: '(44) 3025-1010', city: 'Maringá - PR', status: 'Atrasado' },
    { id: '4', name: 'Distribuidora Ray-Ban Brasil', cnpj: '33.555.888/0001-33', specialty: 'Armações Luxo', contact: 'Fernanda', phone: '(11) 4004-0000', city: 'Barueri - SP', status: 'Ativo' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Fornecedores & Laboratórios</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie seus parceiros de suprimentos e produção de lentes.</p>
        </div>
        <Button onClick={() => window.location.hash = '#/fornecedores/novo'} className="shadow-red-600/20">
          <Plus size={18} /> Novo Fornecedor
        </Button>
      </div>

      <FilterSection>
        <Input label="Razão Social / Fantasia" placeholder="Ex: Essilor..." />
        <Input label="CNPJ" placeholder="00.000.000/0000-00" />
        <Select label="Especialidade" options={[
          {label: 'TODAS', value: ''},
          {label: 'Laboratório', value: 'lab'},
          {label: 'Armações', value: 'frames'},
        ]} />
        <Select label="Status" options={[
          {label: 'TODOS', value: ''},
          {label: 'Ativo', value: 'ativo'},
          {label: 'Atrasado', value: 'atrasado'},
        ]} />
      </FilterSection>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Parceiro</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Especialidade</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Consultor / Contato</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {suppliers.map((sup) => (
                <tr key={sup.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <Truck size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{sup.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{sup.cnpj}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="info">{sup.specialty}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-700">{sup.contact}</p>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <Phone size={10} className="text-red-500" /> {sup.phone}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={sup.status === 'Ativo' ? 'success' : 'danger'}>{sup.status}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2.5 text-slate-400 hover:bg-white hover:text-red-600 rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Edit size={16} />
                      </button>
                      <button className="p-2.5 text-slate-400 hover:bg-white hover:text-slate-900 rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <ExternalLink size={16} />
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
