
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Card, Button, Input, FilterSection, ActiveFiltersBadge } from '../../components/Common';
import { useActiveFilters } from '../../hooks/useActiveFilters';

interface Brand {
  id: string;
  name: string;
}

const mockBrands: Brand[] = [
  { id: '1', name: 'Essilor' },
  { id: '2', name: 'Hoya' },
  { id: '3', name: 'Zeiss' },
  { id: '4', name: 'Varilux' },
  { id: '5', name: 'Transitions' },
];

export const BrandList: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [nameFilter, setNameFilter] = useState('');
  
  const activeFilters = useActiveFilters({
    nameFilter,
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta marca?')) {
      setBrands(brands.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Marcas de Lentes</h1>
            <p className="text-gray-500 font-medium mt-1">Gerencie as marcas de lentes disponíveis no sistema.</p>
          </div>
          <ActiveFiltersBadge count={activeFilters} />
        </div>
        <Button onClick={() => window.location.hash = '#/lenses/create'} className="shadow-red-600/20">
          <Plus size={18} /> Nova Marca
        </Button>
      </div>

      <FilterSection>
        <Input label="Nome da Marca" placeholder="Buscar por nome..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
      </FilterSection>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome da Marca</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {brands.map((brand) => (
                <tr key={brand.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-400">#{brand.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">{brand.name}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Visualizar"
                        onClick={() => window.location.hash = `#/lentes/${brand.id}`}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        title="Editar marca"
                        onClick={() => window.location.hash = `#/lentes/${brand.id}/editar`}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        title="Excluir marca"
                        onClick={() => handleDelete(brand.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {brands.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-medium">Nenhuma marca cadastrada</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 px-6">
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 font-bold text-xs">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 font-bold text-xs">3</button>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {brands.length} marcas</p>
        </div>
      </Card>
    </div>
  );
};
