import React from 'react';
import { ArrowLeft, Award, BadgeDollarSign, Calendar, CheckCircle2, FileText, Target, TrendingUp, User } from 'lucide-react';
import { Card, Button, Badge } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';

interface Sale {
  id: string;
  date: string;
  description: string;
  value: number;
  status: 'Pago' | 'Pendente';
}

interface SellerProfile {
  id: string;
  name: string;
  store: string;
  monthGoal: number;
  monthSales: number;
  commissionRate: number;
  notes: string;
  sales: Sale[];
}

const sellers: SellerProfile[] = [
  {
    id: 'v-102',
    name: 'Carla Nascimento',
    store: 'Maringá Centro',
    monthGoal: 60000,
    monthSales: 48750,
    commissionRate: 2.5,
    notes: 'Especialista em vendas consultivas e lentes premium. Excelente relacionamento com clientes recorrentes.',
    sales: [
      { id: 'S-9821', date: '21/01/2026 16:10', description: 'Armação premium + lente multifocal', value: 1890.0, status: 'Pago' },
      { id: 'S-9817', date: '20/01/2026 14:02', description: 'Óculos solar polarizado', value: 620.0, status: 'Pago' },
      { id: 'S-9801', date: '19/01/2026 11:45', description: 'Armação infantil + lente antirreflexo', value: 890.0, status: 'Pendente' },
    ],
  },
  {
    id: 'v-089',
    name: 'Renato Duarte',
    store: 'Londrina Shopping',
    monthGoal: 52000,
    monthSales: 56840,
    commissionRate: 3.0,
    notes: 'Performance acima da meta nos últimos 3 meses. Forte em combos e upgrades.',
    sales: [
      { id: 'S-9764', date: '21/01/2026 15:22', description: 'Lente progressiva premium', value: 2150.0, status: 'Pago' },
      { id: 'S-9729', date: '20/01/2026 12:30', description: 'Armação italiana + lente Blue', value: 1480.0, status: 'Pago' },
      { id: 'S-9710', date: '18/01/2026 17:10', description: 'Óculos solar esportivo', value: 790.0, status: 'Pago' },
    ],
  },
  {
    id: 'v-076',
    name: 'Priscila Ramos',
    store: 'Curitiba Batel',
    monthGoal: 48000,
    monthSales: 32210,
    commissionRate: 2.2,
    notes: 'Em crescimento. Trabalhar metas de ticket médio e conversão.',
    sales: [
      { id: 'S-9652', date: '21/01/2026 13:58', description: 'Lente com filtro azul', value: 620.0, status: 'Pago' },
      { id: 'S-9627', date: '20/01/2026 10:25', description: 'Armação leve + lente simples', value: 540.0, status: 'Pendente' },
    ],
  },
];

export const SellerDetail: React.FC = () => {
  const { id } = useParams();
  const seller = sellers.find((item) => item.id === id) ?? sellers[0];

  const percent = Math.min(100, Math.round((seller.monthSales / seller.monthGoal) * 100));
  const commissionEstimate = (seller.monthSales * seller.commissionRate) / 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            <User size={14} />
            Vendedor
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight mt-2">{seller.name}</h1>
          <p className="text-gray-500 font-medium mt-1">Unidade {seller.store} • Painel de performance mensal</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Voltar
          </Button>
          <Button onClick={() => window.location.hash = `#/vendedores/${seller.id}?editar=true`} className="shadow-red-600/20">
            <FileText size={18} /> Editar Perfil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: 'Meta do Mês', value: `R$ ${seller.monthGoal.toLocaleString('pt-BR')}`, icon: Target },
          { title: 'Vendas do Mês', value: `R$ ${seller.monthSales.toLocaleString('pt-BR')}`, icon: TrendingUp },
          { title: '% da Meta', value: `${percent}%`, icon: Award },
          { title: 'Comissão Estimada', value: `R$ ${commissionEstimate.toLocaleString('pt-BR')}`, icon: BadgeDollarSign },
        ].map((item) => (
          <Card key={item.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.title}</p>
                <p className="text-xl font-black text-slate-900 mt-2">{item.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <item.icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Vendas do Mês</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Resumo das últimas vendas e status de pagamento.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Calendar size={16} /> Jan/2026
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Venda</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {seller.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-slate-500">#{sale.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">{sale.description}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-900">R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4">
                      <Badge variant={sale.status === 'Pago' ? 'success' : 'warning'}>{sale.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-8">
          <Card>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 mt-1" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Descrição & Diretrizes</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{seller.notes}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Atual</p>
                <p className="text-sm font-bold text-slate-900">R$ {seller.monthGoal.toLocaleString('pt-BR')}</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{percent}% atingido</p>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Award size={14} className="text-emerald-500" />
                Comissão aplicada: {seller.commissionRate}% sobre vendas fechadas.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
