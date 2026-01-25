
import React from 'react';
import { 
  Users, 
  Eye, 
  ClipboardList, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Package,
  Target
} from 'lucide-react';
import { StatCard, Card, Button, Badge } from '../components/Common';
import { useStore } from '../contexts/StoreContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Padrão de meses para todos os gráficos
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Dados para gráficos
const inadimplenciasData = [
  { month: 'Jan', inadimplentes: 8, adimplentes: 312 }, 
  { month: 'Fev', inadimplentes: 12, adimplentes: 468 },
  { month: 'Mar', inadimplentes: 15, adimplentes: 435 }, 
  { month: 'Abr', inadimplentes: 10, adimplentes: 450 },
  { month: 'Mai', inadimplentes: 18, adimplentes: 492 }, 
  { month: 'Jun', inadimplentes: 14, adimplentes: 516 },
  { month: 'Jul', inadimplentes: 22, adimplentes: 568 }, 
  { month: 'Ago', inadimplentes: 16, adimplentes: 474 },
  { month: 'Set', inadimplentes: 19, adimplentes: 466 }, 
  { month: 'Out', inadimplentes: 13, adimplentes: 475 },
  { month: 'Nov', inadimplentes: 17, adimplentes: 478 }, 
  { month: 'Dez', inadimplentes: 25, adimplentes: 595 },
];

const usuariosCadastradosData = [
  { month: 'Jan', usuarios: 120 }, 
  { month: 'Fev', usuarios: 185 },
  { month: 'Mar', usuarios: 210 }, 
  { month: 'Abr', usuarios: 245 },
  { month: 'Mai', usuarios: 280 }, 
  { month: 'Jun', usuarios: 320 },
  { month: 'Jul', usuarios: 365 }, 
  { month: 'Ago', usuarios: 410 },
  { month: 'Set', usuarios: 450 }, 
  { month: 'Out', usuarios: 485 },
  { month: 'Nov', usuarios: 520 }, 
  { month: 'Dez', usuarios: 580 },
];

const osPorMesData = [
  { month: 'Jan', os: 320 }, 
  { month: 'Fev', os: 480 },
  { month: 'Mar', os: 450 }, 
  { month: 'Abr', os: 460 },
  { month: 'Mai', os: 510 }, 
  { month: 'Jun', os: 530 },
  { month: 'Jul', os: 590 }, 
  { month: 'Ago', os: 490 },
  { month: 'Set', os: 485 }, 
  { month: 'Out', os: 488 },
  { month: 'Nov', os: 495 }, 
  { month: 'Dez', os: 620 },
];

const pedidosPorLojaData = [
  { loja: 'Maringá Centro', pedidos: 245 },
  { loja: 'Londrina Shopping', pedidos: 198 },
  { loja: 'Curitiba Batel', pedidos: 177 },
];

const pedidosPorVendedorData = [
  { vendedor: 'Carla Nascimento', pedidos: 142 },
  { vendedor: 'Renato Duarte', pedidos: 128 },
  { vendedor: 'Priscila Ramos', pedidos: 98 },
  { vendedor: 'Ana Beatriz', pedidos: 87 },
  { vendedor: 'Ricardo Silva', pedidos: 75 },
];

const adimplenciaData = [
  { name: 'Adimplentes', value: 595, color: '#10b981' },
  { name: 'Inadimplentes', value: 25, color: '#ef4444' },
];

export const Dashboard: React.FC = () => {
  const { storeColor } = useStore();
  
  return (
    <div className="space-y-8 lg:space-y-10 animate-in fade-in duration-700">
      {/* Header com Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-950 tracking-tight">Painel Executivo</h1>
          <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">Status da unidade Maringá Centro em tempo real.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-slate-200 font-bold">
            <Calendar size={18} /> Filtrar Data
          </Button>
          <Button className="shadow-red-600/20">
            Nova OS <ArrowRight size={18} />
          </Button>
        </div>
      </div>

      {/* Stats Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
        <StatCard title="Vendas Hoje" value="R$ 4.280" icon={TrendingUp} color="red" trend="+12.5%" />
        <StatCard title="Novas OS" value="18" icon={ClipboardList} color="emerald" trend="+2" />
        <StatCard title="Clientes" value="39k" icon={Users} color="slate" trend="+15" />
        <StatCard title="A Vencer" value="12" icon={AlertCircle} color="amber" />
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inadimplências */}
        <Card title="Inadimplências" subtitle="Evolução de adimplentes vs inadimplentes">
          <div className="h-[300px] w-full mt-6">
            <Line
              data={{
                labels: meses,
                datasets: [
                  {
                    label: 'Adimplentes',
                    data: inadimplenciasData.map(d => d.adimplentes),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: 'Inadimplentes',
                    data: inadimplenciasData.map(d => d.inadimplentes),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
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
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    borderRadius: 12,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#f1f5f9',
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#94a3b8',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* Usuários Cadastrados */}
        <Card title="Usuários Cadastrados" subtitle="Crescimento de clientes por mês">
          <div className="h-[300px] w-full mt-6">
            <Bar
              data={{
                labels: meses,
                datasets: [
                  {
                    label: 'Usuários',
                    data: usuariosCadastradosData.map(d => d.usuarios),
                    backgroundColor: '#dc2626',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    borderRadius: 12,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#f1f5f9',
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#94a3b8',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Gráficos de OS e Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OS por Mês */}
        <Card title="Ordens de Serviço" subtitle="Quantidade de OS registradas por mês">
          <div className="h-[300px] w-full mt-6">
            <Bar
              data={{
                labels: meses,
                datasets: [
                  {
                    label: 'OS',
                    data: osPorMesData.map(d => d.os),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    borderRadius: 12,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#f1f5f9',
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#94a3b8',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* Adimplência vs Inadimplência */}
        <Card title="Status de Pagamento" subtitle="Distribuição atual de adimplência">
          <div className="h-[300px] w-full mt-4 flex items-center justify-center">
            <div className="w-full max-w-[280px]">
              <Doughnut
                data={{
                  labels: adimplenciaData.map(d => d.name),
                  datasets: [
                    {
                      data: adimplenciaData.map(d => d.value),
                      backgroundColor: adimplenciaData.map(d => d.color),
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        font: { size: 11, weight: 'bold' },
                        padding: 15,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#1e293b',
                      bodyColor: '#64748b',
                      borderColor: '#e2e8f0',
                      borderWidth: 1,
                      padding: 12,
                      borderRadius: 12,
                      callbacks: {
                        label: (context: any) => {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const value = context.parsed;
                          const percentage = ((value / total) * 100).toFixed(0);
                          return `${context.label}: ${percentage}%`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos de Pedidos por Loja e Vendedor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pedidos por Loja */}
        <Card title="Pedidos por Loja" subtitle="Distribuição de pedidos entre unidades">
          <div className="h-[300px] w-full mt-6">
            <Bar
              data={{
                labels: pedidosPorLojaData.map(d => d.loja),
                datasets: [
                  {
                    label: 'Pedidos',
                    data: pedidosPorLojaData.map(d => d.pedidos),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    borderRadius: 12,
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: {
                      color: '#f1f5f9',
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* Pedidos por Vendedor */}
        <Card title="Pedidos por Vendedor" subtitle="Performance individual da equipe">
          <div className="h-[300px] w-full mt-6">
            <Bar
              data={{
                labels: pedidosPorVendedorData.map(d => d.vendedor),
                datasets: [
                  {
                    label: 'Pedidos',
                    data: pedidosPorVendedorData.map(d => d.pedidos),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    borderRadius: 12,
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: {
                      color: '#f1f5f9',
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: { size: 10 },
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Produtos Mais Vendidos */}
      <Card title="Produtos Mais Vendidos" subtitle="Top produtos do mês atual">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {[
            { name: 'Lente Multifocal Essilor', sales: 45, revenue: 'R$ 67.500', icon: Package },
            { name: 'Armação Ray-Ban', sales: 38, revenue: 'R$ 28.500', icon: Package },
            { name: 'Lente Transitions', sales: 32, revenue: 'R$ 19.200', icon: Package },
            { name: 'Óculos Solar Oakley', sales: 28, revenue: 'R$ 22.400', icon: Package },
          ].map((product, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <product.icon size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">{product.name}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Vendas</span>
                  <span className="font-bold text-slate-900">{product.sales} unidades</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Receita</span>
                  <span className="font-bold text-emerald-600">{product.revenue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid de Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Clientes VIP / Maiores Compradores */}
        <Card title="Clientes VIP" subtitle="Maiores compradores do mês">
          <div className="space-y-4 mt-4">
            {[
              { name: 'Maria das Graças', total: 'R$ 8.450', purchases: 5, badge: 'VIP' },
              { name: 'João Oliveira', total: 'R$ 6.200', purchases: 4, badge: 'VIP' },
              { name: 'Alice Silva', total: 'R$ 5.800', purchases: 3, badge: 'Premium' },
              { name: 'Carlos Mendes', total: 'R$ 4.900', purchases: 3, badge: 'Premium' },
              { name: 'Ana Costa', total: 'R$ 4.200', purchases: 2, badge: 'Premium' },
            ].map((client) => (
              <div key={client.name} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-slate-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-red-600 transition-colors">{client.name}</p>
                    <Badge variant={client.badge === 'VIP' ? 'success' : 'primary'}>{client.badge}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{client.purchases} compras este mês</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">{client.total}</p>
              </div>
            ))}
            <button 
              onClick={() => window.location.hash = '#/clients'}
              className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] pt-3 hover:underline transition-all"
              style={{ color: storeColor }}
            >
              Ver Todos os Clientes →
            </button>
          </div>
        </Card>

        {/* Top Vendedores */}
        <Card title="Top Vendedores do Mês" subtitle="Performance da equipe">
          <div className="space-y-4 mt-4">
            {[
              { name: 'Carla Nascimento', sales: 'R$ 48.750', goal: 'R$ 60.000', percent: 81, status: 'success' },
              { name: 'Renato Duarte', sales: 'R$ 56.840', goal: 'R$ 52.000', percent: 109, status: 'success' },
              { name: 'Priscila Ramos', sales: 'R$ 32.210', goal: 'R$ 48.000', percent: 67, status: 'warning' },
            ].map((seller) => (
              <div key={seller.name} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between mb-3">
                    <div>
                    <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Meta: {seller.goal}</p>
                  </div>
                  <Badge variant={seller.status === 'success' ? 'success' : 'warning'}>
                    {seller.percent}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Vendas</span>
                    <span className="font-bold text-slate-900">{seller.sales}</span>
                    </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        seller.percent >= 100 ? 'bg-emerald-500' : seller.percent >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(seller.percent, 100)}%` }}
                    />
                  </div>
                </div>
                  </div>
                ))}
            <button 
              onClick={() => window.location.hash = '#/vendedores'}
              className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] pt-2 hover:underline transition-all"
              style={{ color: storeColor }}
            >
              Ver Todos os Vendedores →
            </button>
             </div>
          </Card>
        </div>

      {/* Estoque Crítico e Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Estoque Crítico */}
        <Card title="Estoque Crítico" subtitle="Produtos com estoque baixo">
          <div className="space-y-3 mt-4">
            {[
              { product: 'Lentes Multifocais Essilor', stock: '15%', status: 'danger' },
              { product: 'Armação Infantil Nylon 1360', stock: '8 unidades', status: 'warning' },
              { product: 'Lente Transitions', stock: '22%', status: 'warning' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 rounded-lg border transition-all"
                style={{ 
                  borderColor: `${storeColor}40`,
                  backgroundColor: `${storeColor}10`
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${storeColor}20`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${storeColor}10`}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.product}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Estoque atual</p>
                </div>
                <Badge variant={item.status as any}>{item.stock}</Badge>
              </div>
            ))}
            <button 
              onClick={() => window.location.hash = '#/estoque'}
              className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] pt-2 hover:underline transition-all"
              style={{ color: 'var(--store-color-dark)' }}
            >
              Ver Estoque Completo →
            </button>
          </div>
        </Card>

        {/* Pedidos Recentes */}
        <Card title="Pedidos Recentes" subtitle="Últimas ordens de serviço">
          <div className="space-y-3 mt-4">
            {[
              { os: '39832', client: 'Maria das Graças', value: 'R$ 1.450', status: 'Laboratório' },
              { os: '39831', client: 'Elisangela Batista', value: 'R$ 890', status: 'Pronto' },
              { os: '39830', client: 'Maria Eduarda', value: 'R$ 620', status: 'Conferência' },
            ].map((order) => (
              <div key={order.os} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-slate-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">#{order.os}</span>
                    <Badge variant={order.status === 'Pronto' ? 'success' : order.status === 'Conferência' ? 'warning' : 'info'}>
                      {order.status}
                    </Badge>
                  </div>
                  <p 
                    className="text-sm font-semibold text-slate-900 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = storeColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    {order.client}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">{order.value}</p>
              </div>
            ))}
            <button 
              onClick={() => window.location.hash = '#/pedidos'}
              className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] pt-2 hover:underline transition-all"
              style={{ color: storeColor }}
            >
              Ver Todos os Pedidos →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};