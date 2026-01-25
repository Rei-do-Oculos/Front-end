import React from 'react';
import { Eye, Edit, Plus, TrendingUp, User, Store } from 'lucide-react';
import { Card, Button, Input, Select, Badge, FilterSection, ActiveFiltersBadge } from '../../components/Common';
import { useActiveFilters } from '../../hooks/useActiveFilters';

interface Seller {
  id: string;
  name: string;
  store: string;
  goal: number;
  sales: number;
  status: 'Ativo' | 'Inativo';
  lastSale: string;
}

const sellers: Seller[] = [
  { id: 'v-102', name: 'Carla Nascimento', store: 'Maringá Centro', goal: 60000, sales: 48750, status: 'Ativo', lastSale: '21/01/2026 16:10' },
  { id: 'v-089', name: 'Renato Duarte', store: 'Londrina Shopping', goal: 52000, sales: 56840, status: 'Ativo', lastSale: '21/01/2026 15:22' },
  { id: 'v-076', name: 'Priscila Ramos', store: 'Curitiba Batel', goal: 48000, sales: 32210, status: 'Ativo', lastSale: '21/01/2026 13:58' },
  { id: 'v-063', name: 'Leonardo Mota', store: 'Maringá Centro', goal: 45000, sales: 19800, status: 'Inativo', lastSale: '18/01/2026 11:05' },
  { id: 'v-041', name: 'Sonia Oliveira', store: 'Londrina Shopping', goal: 55000, sales: 43100, status: 'Ativo', lastSale: '20/01/2026 17:41' },
];

export const SellerList: React.FC = () => {
  const [nameFilter, setNameFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const activeFilters = useActiveFilters({
    nameFilter,
    unitFilter,
    statusFilter,
  });

  const getStatusVariant = (status: Seller['status']) => (status === 'Ativo' ? 'success' : 'danger');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Vendedores</h1>
            <p className="text-gray-500 font-medium mt-1">Acompanhe metas, vendas e performance por vendedor.</p>
          </div>
          <ActiveFiltersBadge count={activeFilters} />
        </div>
        <Button onClick={() => window.location.hash = '#/vendedores/create'} className="shadow-red-600/20">
          <Plus size={18} /> Novo Vendedor
        </Button>
      </div>

      <FilterSection>
        <Input label="Nome do Vendedor" placeholder="Buscar por nome..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
        <Select label="Unidade" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} options={[
          { label: 'TODAS', value: '' },
          { label: 'Maringá Centro', value: 'maringa' },
          { label: 'Londrina Shopping', value: 'londrina' },
          { label: 'Curitiba Batel', value: 'curitiba' },
        ]} />
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
          { label: 'TODOS', value: '' },
          { label: 'Ativo', value: 'ativo' },
          { label: 'Inativo', value: 'inativo' },
        ]} />
        <Input label="Mês/Ano" type="month" />
      </FilterSection>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendedor</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta do Mês</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendas do Mês</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sellers.map((seller) => {
                const progress = Math.min(100, Math.round((seller.sales / seller.goal) * 100));
                return (
                  <tr key={seller.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-400">#{seller.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">{seller.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">Última venda: {seller.lastSale}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Store size={14} /> {seller.store}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      R$ {seller.goal.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <TrendingUp size={14} className="text-emerald-500" />
                          R$ {seller.sales.toLocaleString('pt-BR')}
                        </div>
                        <div className="h-2 w-40 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{progress}% da meta</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(seller.status)}>{seller.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Ver painel"
                          onClick={() => window.location.hash = `#/vendedores/${seller.id}`}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Editar vendedor"
                          onClick={() => window.location.hash = `#/vendedores/${seller.id}/editar`}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
