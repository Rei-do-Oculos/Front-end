
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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StatCard, Card, Button, Badge } from '../components/Common';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const chartData = [
  { month: 'Jan', orders: 320 }, { month: 'Fev', orders: 480 },
  { month: 'Mar', orders: 450 }, { month: 'Abr', orders: 460 },
  { month: 'Mai', orders: 510 }, { month: 'Jun', orders: 530 },
  { month: 'Jul', orders: 590 }, { month: 'Ago', orders: 490 },
  { month: 'Set', orders: 485 }, { month: 'Out', orders: 488 },
  { month: 'Nov', orders: 495 }, { month: 'Dez', orders: 620 },
];

export const Dashboard: React.FC = () => {
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

      {/* Pipeline de OS e IA Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Visual */}
        <Card title="Rastreio de Pedidos" subtitle="Status das Ordens de Serviço Ativas" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Laboratório', count: 14, icon: Clock, color: 'sky' },
              { label: 'Conferência', count: 5, icon: AlertCircle, color: 'amber' },
              { label: 'Pronto', count: 8, icon: CheckCircle2, color: 'emerald' },
              { label: 'Para Retirar', count: 12, icon: Eye, color: 'red' },
            ].map((step) => (
              <div key={step.label} className={`p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group`}>
                <div className={`w-10 h-10 rounded-xl bg-${step.color}-100 text-${step.color}-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <step.icon size={20} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{step.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{step.count}</p>
              </div>
            ))}
          </div>
          
          <div className="h-[250px] w-full mt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="orders" stroke="#dc2626" strokeWidth={2} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* IA Assistant / Insights Sidebar */}
        <div className="space-y-8">
          <div className="bg-slate-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-red-600/20 transition-all duration-700"></div>
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-600 rounded-xl">
                   <Sparkles size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">IA Insights</h3>
             </div>
             <div className="space-y-6">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                   <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Sugestão de Compra</p>
                   <p className="text-xs text-slate-300 leading-relaxed font-medium">
                     O estoque de <span className="text-white font-semibold">Lentes Multifocais</span> está baixo (15%). Recomendo reposição antes do pico de vendas.
                   </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                   <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Oportunidade CRM</p>
                   <p className="text-xs text-slate-300 leading-relaxed font-medium">
                     <span className="text-white font-semibold">42 clientes</span> não retornam há 1 ano. Enviar cupom de "Renovação de Grau" via WhatsApp?
                   </p>
                </div>
                <Button className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-none">
                  Ver Sugestões <ArrowRight size={14} className="ml-1" />
                </Button>
             </div>
          </div>

          <Card title="Alertas de Retorno" subtitle="Clientes para re-exame este mês">
             <div className="space-y-5 mt-4">
                {[
                  { name: 'Maria Santos', last: '14/01/2024', delay: '12 meses' },
                  { name: 'João Oliveira', last: '16/01/2024', delay: '12 meses' },
                  { name: 'Alice Silva', last: '20/01/2024', delay: '12 meses' },
                ].map((client) => (
                  <div key={client.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Última compra: {client.last}</p>
                    </div>
                    <Badge variant="danger">{client.delay}</Badge>
                  </div>
                ))}
                <button className="w-full text-center text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] pt-2 hover:underline">Ver Todos</button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
