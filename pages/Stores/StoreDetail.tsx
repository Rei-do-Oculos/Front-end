
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Store, 
  Users, 
  UserCog, 
  History, 
  TrendingUp, 
  ShoppingBag, 
  Smartphone, 
  MapPin, 
  Settings,
  Plus,
  Search,
  MoreVertical,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../../components/Common';

export const StoreDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'users' | 'history'>('overview');

  // Mock de dados da unidade
  const store = {
    name: 'Maringá Centro',
    fancyName: 'Rei do Óculos - Matriz PR',
    color: 'var(--store-color)',
    city: 'Maringá - PR',
    address: 'Av. Brasil, 4500 - Centro',
    phone: '(44) 3025-1010',
    email: 'maringa@reidooculos.com.br',
    cnpj: '12.345.678/0001-01',
    manager: 'Ricardo Oliveira'
  };

  const sellers = [
    { id: '1', name: 'Ana Paula Silva', role: 'Vendedora Senior', sales: 'R$ 45.200', performance: '105%', status: 'Online' },
    { id: '2', name: 'Marcos Santos', role: 'Vendedor Junior', sales: 'R$ 28.150', performance: '92%', status: 'Online' },
    { id: '3', name: 'Juliana Costa', role: 'Vendedora Pleno', sales: 'R$ 32.400', performance: '98%', status: 'Ausente' },
  ];

  const systemUsers = [
    { id: '1', user: 'ricardo.admin', name: 'Ricardo Oliveira', level: 'Gerente Unidade', lastAccess: 'Hoje às 08:30' },
    { id: '2', user: 'vendas.mga1', name: 'Equipe Frente de Loja', level: 'Operador PDV', lastAccess: 'Agora' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header com Identidade da Loja */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/stores')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 transition-all shadow-sm"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--store-color-dark)';
              e.currentTarget.style.borderColor = 'var(--store-color-opacity-20)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-950 tracking-tight">{store.name}</h1>
              <Badge variant="success">Unidade Operacional</Badge>
            </div>
            <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">{store.fancyName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200">
            <Settings size={18} /> Configurar Loja
          </Button>
          <Button className="px-8 rounded-2xl">
            <Plus size={18} /> Novo Vendedor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <div 
              className="w-24 h-24 mx-auto rounded-3xl mb-6 flex items-center justify-center text-white shadow-xl" 
              style={{ 
                backgroundColor: store.color,
                boxShadow: '0 20px 25px -5px var(--store-color-opacity-20)',
              }}
            >
               <Store size={48} />
            </div>
            <div className="text-center mb-8">
               <h3 className="font-black text-slate-900 tracking-tight">Identidade Visual</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">HEX: {store.color}</p>
            </div>
            
            <div className="space-y-4 border-t border-slate-50 pt-6">
               <div className="flex items-center gap-3">
                  <MapPin size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{store.address}</p>
               </div>
               <div className="flex items-center gap-3">
                  <Smartphone size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600">{store.phone}</p>
               </div>
               <div className="flex items-center gap-3">
                  <Mail size={16} style={{ color: 'var(--store-color)' }} className="shrink-0" />
                  <p className="text-xs font-semibold text-slate-600 truncate">{store.email}</p>
               </div>
            </div>
          </Card>

          <Card className="bg-slate-950 text-white border-none">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--store-color)' }}><TrendingUp size={16} /></div>
                <h4 className="text-xs font-black uppercase tracking-widest">Meta Mensal</h4>
             </div>
             <p className="text-2xl font-black tracking-tight">R$ 180.000</p>
             <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div className="h-full" style={{ width: '65%', backgroundColor: 'var(--store-color)' }}></div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">65% Atingido • R$ 117k</p>
          </Card>
        </div>

        {/* Conteúdo Principal com Abas */}
        <div className="lg:col-span-3 space-y-8">
          {/* Navegação de Abas */}
          <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
            {[
              { id: 'overview', label: 'Visão Geral', icon: ShoppingBag },
              { id: 'sellers', label: 'Vendedores', icon: Users },
              { id: 'users', label: 'Usuários Sistema', icon: UserCog },
              { id: 'history', label: 'Histórico', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: 'var(--store-color)',
                  boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
                } : undefined}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Renderização de Conteúdo Baseado na Aba */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card title="Vendas Recentes" className="border-none shadow-lg">
                      <div className="space-y-4 mt-4">
                         {[1,2,3].map(i => (
                           <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <div>
                                 <p className="text-xs font-black text-slate-900 uppercase">OS #3982{i}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Cliente: Maria Santos</p>
                              </div>
                              <p className="text-sm font-black" style={{ color: 'var(--store-color)' }}>R$ 1.450,00</p>
                           </div>
                         ))}
                         <button 
                           className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2"
                           onMouseEnter={(e) => {
                             e.currentTarget.style.color = 'var(--store-color-dark)';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.color = '';
                           }}
                         >Ver Todas as Vendas</button>
                      </div>
                   </Card>
                   <Card title="Status Laboratório" className="border-none shadow-lg">
                      <div className="space-y-6 mt-4">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Lentes em Produção</span>
                            <Badge variant="info">12 Pedidos</Badge>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Aguardando Conferência</span>
                            <Badge variant="warning">04 Pedidos</Badge>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Pronto para Entrega</span>
                            <Badge variant="success">08 Pedidos</Badge>
                         </div>
                      </div>
                   </Card>
                </div>
             )}

             {activeTab === 'sellers' && (
                <Card className="p-0 overflow-hidden border-none shadow-lg">
                   <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <div className="relative w-64">
                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input placeholder="Buscar vendedor..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none" />
                      </div>
                      <Button variant="secondary" className="rounded-xl py-2 px-4 text-[10px]"><Plus size={14}/> Vincular Vendedor</Button>
                   </div>
                   <table className="w-full">
                      <thead>
                         <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Nome / Cargo</th>
                            <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Vendas Mês</th>
                            <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Atingimento</th>
                            <th className="px-6 py-4 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                            <th className="px-6 py-4 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Ação</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {sellers.map(s => (
                           <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                 <div>
                                    <p className="text-xs font-bold text-slate-900">{s.name}</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase">{s.role}</p>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-black text-slate-700">{s.sales}</td>
                              <td className="px-6 py-4">
                                 <Badge variant={parseInt(s.performance) >= 100 ? 'success' : 'info'}>{s.performance}</Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <div className="flex items-center justify-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-bold text-slate-500">{s.status}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <button title="Mais opções" className="p-2 text-slate-300 hover:text-slate-900"><MoreVertical size={16}/></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </Card>
             )}

             {activeTab === 'users' && (
                <Card title="Acesso ao Sistema" subtitle="Quem pode operar o sistema nesta unidade">
                   <div className="space-y-4 mt-4">
                      {systemUsers.map(u => (
                        <div 
                          key={u.id} 
                          className="flex items-center justify-between p-5 border border-slate-100 rounded-3xl transition-all"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--store-color-opacity-20)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '';
                          }}
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                 <ShieldCheck size={20} />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Login: {u.user} • {u.level}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Último Acesso</p>
                              <p className="text-[11px] font-black text-slate-700">{u.lastAccess}</p>
                           </div>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 border-dashed border-2 rounded-2xl border-slate-200 text-slate-400"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--store-color-dark)';
                          e.currentTarget.style.borderColor = 'var(--store-color)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '';
                          e.currentTarget.style.borderColor = '';
                        }}
                      >
                         <Plus size={16} /> Liberar Novo Acesso
                      </Button>
                   </div>
                </Card>
             )}

             {activeTab === 'history' && (
                <Card title="Histórico da Unidade" subtitle="Log de eventos e alterações importantes">
                   <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 mt-6">
                      {[
                        { date: '21 Jan 2026, 14:30', event: 'Transferência de Estoque Recebida', desc: '15 Armações Rayban (Londrina -> Maringá)', icon: ShoppingBag, color: 'sky' },
                        { date: '21 Jan 2026, 08:00', event: 'Abertura de Caixa', desc: 'Operador: Vendas MGA1 • Saldo inicial R$ 250,00', icon: History, color: 'emerald' },
                        { date: '20 Jan 2026, 18:45', event: 'Meta de Vendas Atingida', desc: 'Unidade atingiu 100% da meta semanal!', icon: TrendingUp, color: 'amber' },
                      ].map((item, idx) => (
                        <div key={idx} className="relative">
                           <div className={`absolute -left-8 top-0 w-6 h-6 rounded-lg bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center border-4 border-white shadow-sm`}>
                              <item.icon size={12} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.date}</p>
                              <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.event}</h5>
                              <p className="text-xs text-slate-500 font-medium mt-1">{item.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
