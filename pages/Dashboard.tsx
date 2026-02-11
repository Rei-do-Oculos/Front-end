import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ArrowRight,
  DollarSign,
  Beaker,
  UserPlus,
} from 'lucide-react';
import { StatCard, Card, Button } from '../components/Common';
import { usePermission } from '../services/hooks/usePermission';
import { useAuth } from '../services/hooks/useAuth';
import { getDashboardCards, getDashboardCharts, DashboardCards, DashboardCharts } from '../services/api/dashboard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Dados por mês (mock – pode vir da API depois)
const adimplenciaPorMesData = [312, 468, 435, 450, 492, 516, 568, 474, 466, 475, 478, 595];
const inadimplenciaPorMesData = [8, 12, 15, 10, 18, 14, 22, 16, 19, 13, 17, 25];
const clientesPorMesData = [120, 185, 210, 245, 280, 320, 365, 410, 450, 485, 520, 580];
const osPorMesData = [320, 480, 450, 460, 510, 530, 590, 490, 485, 488, 495, 620];

/** Permissões: se tiver, mostra o card/gráfico; se não tiver, não aparece. Dashboard aberto a todos. */
const DASHBOARD_SECTIONS = {
  cardVendasHoje: ['finance.dashboard', 'service-orders.list'],
  cardClientesDia: ['clients.list'],
  cardOsDia: ['service-orders.list'],
  cardOsLab: ['service-orders-lab.list'],
  chartAdimplencia: ['finance.overdue-summary', 'service-orders-overdue.list'],
  chartInadimplencia: ['finance.overdue-summary', 'service-orders-overdue.list'],
  chartClientes: ['clients.list'],
  chartOs: ['service-orders.list'],
} as const;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 10 }, color: '#94a3b8' },
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, color: '#64748b' },
    },
  },
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [cards, setCards] = useState<DashboardCards | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);

  useEffect(() => {
    getDashboardCards()
      .then(setCards)
      .catch(() => setCards(null));
  }, []);

  useEffect(() => {
    getDashboardCharts()
      .then(setCharts)
      .catch(() => setCharts(null));
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const chartLabels = useMemo(() => {
    if (!charts?.labels) return [];
    return Array.isArray(charts.labels) ? charts.labels : Object.values(charts.labels);
  }, [charts?.labels]);

  const chartData = useMemo(() => ({
    adimplencia: Array.isArray(charts?.adimplencia) ? charts.adimplencia : (charts?.adimplencia ? Object.values(charts.adimplencia) : []),
    inadimplencia: Array.isArray(charts?.inadimplencia) ? charts.inadimplencia : (charts?.inadimplencia ? Object.values(charts.inadimplencia) : []),
    clientes: Array.isArray(charts?.clientes) ? charts.clientes : (charts?.clientes ? Object.values(charts.clientes) : []),
    os: Array.isArray(charts?.os) ? charts.os : (charts?.os ? Object.values(charts.os) : []),
  }), [charts]);

  const canSee = useMemo(() => {
    const check = (perms: readonly string[] | undefined) =>
      Array.isArray(perms) && perms.some((p) => hasPermission(p));
    return {
      cardVendasHoje: check(DASHBOARD_SECTIONS.cardVendasHoje),
      cardClientesDia: check(DASHBOARD_SECTIONS.cardClientesDia),
      cardOsDia: check(DASHBOARD_SECTIONS.cardOsDia),
      cardOsLab: check(DASHBOARD_SECTIONS.cardOsLab),
      chartAdimplencia: check(DASHBOARD_SECTIONS.chartAdimplencia),
      chartInadimplencia: check(DASHBOARD_SECTIONS.chartInadimplencia),
      chartClientes: check(DASHBOARD_SECTIONS.chartClientes),
      chartOs: check(DASHBOARD_SECTIONS.chartOs),
    };
  }, [hasPermission]);

  return (
    <div className="space-y-8 lg:space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-950 tracking-tight">Seja bem-vindo{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">Resumo Painel Administrativo</p>
        </div>
        {hasPermission('service-orders.create') && (
          <Button className="shadow-red-600/20" onClick={() => navigate('/service-orders/create')}>
            Nova OS <ArrowRight size={18} />
          </Button>
        )}
      </div>

      {/* 4 Cards: Vendas hoje (usuário), Clientes do dia, OS do dia, OS laboratório */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
        {canSee.cardVendasHoje && (
          <StatCard
            title="Vendas Hoje (você)"
            value={cards ? formatCurrency(cards.sales_today_user) : '–'}
            icon={DollarSign}
            color="red"
          />
        )}
        {canSee.cardClientesDia && (
          <StatCard
            title="Clientes do Dia"
            value={cards != null ? cards.clients_today : '–'}
            icon={UserPlus}
            color="slate"
          />
        )}
        {canSee.cardOsDia && (
          <StatCard
            title="OS do Dia"
            value={cards != null ? cards.os_today : '–'}
            icon={ClipboardList}
            color="emerald"
          />
        )}
        {canSee.cardOsLab && (
          <StatCard
            title="OS Laboratório"
            value={cards != null ? cards.os_lab : '–'}
            icon={Beaker}
            color="amber"
          />
        )}
      </div>

      {/* 4 Gráficos: Clientes em meses, OS em meses, Inadimplência em meses, Adimplência em meses (dados reais) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {canSee.chartClientes && (
          <Card title="Clientes em Meses" subtitle="Novos clientes por mês">
            <div className="h-[300px] w-full mt-6">
              <Line
                id="chart-clientes-meses"
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: 'Clientes',
                      data: chartData.clientes,
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </Card>
        )}

        {canSee.chartOs && (
          <Card title="OS em Meses" subtitle="Ordens de serviço por mês">
            <div className="h-[300px] w-full mt-6">
              <Bar
                id="chart-os-meses"
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: 'OS',
                      data: chartData.os,
                      backgroundColor: '#8b5cf6',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </Card>
        )}

        {canSee.chartInadimplencia && (
          <Card title="Inadimplência em Meses" subtitle="OS inadimplentes por mês (por chegada)">
            <div className="h-[300px] w-full mt-6">
              <Bar
                id="chart-inadimplencia-meses"
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: 'Inadimplentes',
                      data: chartData.inadimplencia,
                      backgroundColor: '#ef4444',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </Card>
        )}

        {canSee.chartAdimplencia && (
          <Card title="Adimplência em Meses" subtitle="OS finalizadas e faturadas por mês">
            <div className="h-[300px] w-full mt-6">
              <Bar
                id="chart-adimplencia-meses"
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      label: 'Adimplentes',
                      data: chartData.adimplencia,
                      backgroundColor: '#10b981',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
