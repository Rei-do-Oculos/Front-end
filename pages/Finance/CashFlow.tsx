
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  Download,
  Users,
  Store,
  MoreVertical,
  Award,
  Target,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Plus
} from 'lucide-react';
import { StatCard, Card, Button, Badge, Input, Select } from '../../components/Common';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const weeklyData = [
  { name: 'Seg', entradas: 4200, saidas: 2100 },
  { name: 'Ter', entradas: 3800, saidas: 1800 },
  { name: 'Qua', entradas: 5100, saidas: 4200 },
  { name: 'Qui', entradas: 4600, saidas: 3100 },
  { name: 'Sex', entradas: 6200, saidas: 2800 },
  { name: 'Sáb', entradas: 7400, saidas: 1200 },
  { name: 'Dom', entradas: 2100, saidas: 800 },
];

const storePerformance = [
  { name: 'Maringá Centro', value: 45, color: '#ef4444' },
  { name: 'Londrina Shopping', value: 25, color: '#334155' },
  { name: 'Curitiba Batel', value: 30, color: '#94a3b8' },
];

const sellerRanking = [
  { name: 'Ricardo Silva', sales: 18400, target: 20000 },
  { name: 'Ana Beatriz', sales: 15200, target: 18000 },
  { name: 'Marcos Paulo', sales: 12100, target: 15000 },
  { name: 'Juliana Costa', sales: 9500, target: 12000 },
  { name: 'Lucas Neto', sales: 6200, target: 10000 },
];

export const CashFlow: React.FC = () => {
  const transactions = [
    { id: '1', date: '21/01/2026', desc: 'Venda OS #39832 - Lentes Varilux', cat: 'Vendas', type: 'entrada', val: 2850.00, seller: 'Ricardo Silva', store: 'Maringá', status: 'Pago' },
    { id: '2', date: '21/01/2026', desc: 'Aluguel Unidade Maringá Centro', cat: 'Fixo', type: 'saida', val: 3500.00, seller: '-', store: 'Maringá', status: 'Pendente' },
    { id: '3', date: '20/01/2026', desc: 'Venda PDV - Óculos de Sol Ray-Ban', cat: 'Vendas', type: 'entrada', val: 890.90, seller: 'Ana Beatriz', store: 'Londrina', status: 'Pago' },
    { id: '4', date: '20/01/2026', desc: 'Comissão Equipe - Dezembro', cat: 'RH', type: 'saida', val: 12200.00, seller: '-', store: 'Geral', status: 'Pago' },
    { id: '5', date: '19/01/2026', desc: 'Venda OS #39820 - Armação Oakley', cat: 'Vendas', type: 'entrada', val: 1550.00, seller: 'Marcos Paulo', store: 'Curitiba', status: 'Pago' },
    { id: '6', date: '19/01/2026', desc: 'Fornecedor Essilor - NF 8829', cat: 'Estoque', type: 'saida', val: 4500.00, seller: '-', store: 'Geral', status: 'Pago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Fluxo de Caixa & BI</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Inteligência de Dados • Gestão de Lojas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:text-slate-950 font-bold">
            <Download size={18} /> Exportar BI
          </Button>
          <Button className="shadow-red-600/20 bg-red-600 hover:bg-red-700 font-bold">
            <Plus size={18} /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* 2. KPIs de Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Receita Bruta" value="R$ 142.850" icon={DollarSign} color="red" trend="+15.4%" />
        <StatCard title="Ticket Médio" value="R$ 1.145,20" icon={Target} color="emerald" trend="+5.2%" />
        <StatCard title="Meta do Mês" value="78%" icon={TrendingUp} color="amber" trend="R$ 180k" />
        <StatCard title="Despesas Totais" value="R$ 58.210" icon={TrendingDown} color="slate" trend="-2.1%" />
      </div>

      {/* 3. Central de Filtros Avançados */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm border-t-4 border-t-red-600">
        <div className="flex items-center gap-2 mb-6">
           <Filter size={16} className="text-red-600" />
           <h3 className="text-[11px] font-bold text-slate-950 uppercase tracking-[0.2em]">Filtros de Segmentação</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input label="Período" type="date" />
          <Select label="Unidade / Loja" options={[
            {label: 'Todas as Lojas', value: 'todas'},
            {label: 'Maringá Centro', value: 'maringa'},
            {label: 'Londrina Shopping', value: 'londrina'},
            {label: 'Curitiba Batel', value: 'curitiba'},
          ]} />
          <Select label="Vendedor" options={[
            {label: 'Todos os Vendedores', value: 'todos'},
            {label: 'Ricardo Silva', value: 'ricardo'},
            {label: 'Ana Beatriz', value: 'ana'},
            {label: 'Marcos Paulo', value: 'marcos'},
          ]} />
          <Select label="Meio de Pagamento" options={[
            {label: 'Todos os Meios', value: ''},
            {label: 'Cartão de Crédito', value: 'card'},
            {label: 'PIX', value: 'pix'},
            {label: 'Dinheiro', value: 'cash'},
            {label: 'Crediário Próprio', value: 'crediario'},
          ]} />
          <div className="flex items-end">
            <Button className="w-full bg-slate-900 hover:bg-black py-3 font-bold">
               <Search size={18} /> Filtrar
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Gráficos de BI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Volume de Vendas Semanal" subtitle="Entradas vs Saídas consolidadas" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-6">
            <Bar
              data={{
                labels: weeklyData.map(d => d.name),
                datasets: [
                  {
                    label: 'Receitas',
                    data: weeklyData.map(d => d.entradas),
                    backgroundColor: '#ef4444',
                    borderRadius: 4,
                  },
                  {
                    label: 'Despesas',
                    data: weeklyData.map(d => d.saidas),
                    backgroundColor: '#334155',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      font: { size: 10, weight: 'bold' },
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#64748b',
                    },
                  },
                  tooltip: {
                    backgroundColor: 'white',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    padding: 12,
                    cornerRadius: 15,
                    boxPadding: 6,
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: { size: 10, weight: '500' },
                      color: '#64748b',
                    },
                  },
                  y: {
                    grid: {
                      color: '#f1f5f9',
                    },
                    ticks: {
                      font: { size: 10, weight: '500' },
                      color: '#94a3b8',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card title="Share por Unidade" subtitle="Participação no faturamento">
           <div className="h-[280px] w-full mt-4">
              <Doughnut
                data={{
                  labels: storePerformance.map(s => s.name),
                  datasets: [
                    {
                      data: storePerformance.map(s => s.value),
                      backgroundColor: storePerformance.map(s => s.color),
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      backgroundColor: 'white',
                      borderColor: '#e2e8f0',
                      borderWidth: 1,
                      titleColor: '#1e293b',
                      bodyColor: '#475569',
                      padding: 12,
                      cornerRadius: 15,
                      boxPadding: 6,
                    },
                  },
                }}
              />
           </div>
           <div className="space-y-3 mt-6">
              {storePerformance.map((store) => (
                <div key={store.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: store.color}}></div>
                      <span className="text-[11px] font-semibold text-slate-600">{store.name}</span>
                   </div>
                   <span className="text-[11px] font-bold text-slate-900">{store.value}%</span>
                </div>
              ))}
           </div>
        </Card>
      </div>

      {/* 5. Tabela e Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <Card title="Top Vendedores" subtitle="Performance mensal" className="lg:col-span-1 border-l-4 border-l-amber-400">
            <div className="space-y-6 mt-6">
               {sellerRanking.map((seller, index) => (
                 <div key={seller.name} className="relative group">
                    <div className="flex justify-between items-center mb-1.5">
                       <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">{seller.name}</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-900">R$ {(seller.sales/1000).toFixed(1)}k</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className={`h-full transition-all duration-1000 ${index === 0 ? 'bg-red-600' : 'bg-slate-400'}`} 
                        style={{ width: `${(seller.sales / seller.target) * 100}%` }}
                       ></div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="pt-6 text-center">
               <button className="text-[9px] font-bold text-red-600 uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto">
                 Comissões <ArrowUpCircle size={14} />
               </button>
            </div>
         </Card>

         <div className="lg:col-span-3">
            <Card className="p-0 overflow-hidden" title="Fluxo Detalhado">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Unidade</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Descrição</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Valor</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Status</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => (
                      <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-1.5">
                                <Store size={12} className="text-red-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{t.store}</span>
                             </div>
                             <span className="text-[10px] font-medium text-slate-400 mt-0.5 ml-4">{t.seller}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-semibold text-slate-700">{t.desc}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Calendar size={10} className="text-slate-300" />
                             <span className="text-[10px] text-slate-400 font-medium">{t.date}</span>
                             <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{t.cat}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className={`text-sm font-bold ${t.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'entrada' ? '+' : '-'} R$ {t.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant={t.status === 'Pago' ? 'success' : 'warning'}>{t.status}</Badge>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button title="Mais ações" className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                             <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
         </div>
      </div>
    </div>
  );
};
