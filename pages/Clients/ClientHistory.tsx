import React, { useState } from 'react';
import { ArrowLeft, DollarSign, ShoppingBag, Calendar, TrendingUp, Package, Eye, FileText, Phone, Mail, MapPin, Edit, ClipboardList, Stethoscope, Plus } from 'lucide-react';
import { Card, Button, Badge, StatCard } from '../../components/Common';
import { useParams } from 'react-router-dom';

interface Order {
  id: string;
  osNumber: string;
  date: string;
  store: string;
  items: string;
  value: number;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  paymentMethod: string;
}

interface Prescription {
  id: string;
  date: string;
  doctor: string;
  od: string; // Olho Direito
  oe: string; // Olho Esquerdo
  add: string; // Adição
  notes: string;
}

interface ClientHistory {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  registeredAt: string;
  totalSpent: number;
  totalOrders: number;
  averageTicket: number;
  lastPurchase: string;
  orders: Order[];
  prescriptions: Prescription[];
}

const mockClients: ClientHistory[] = [
  {
    id: '39832',
    name: 'Maria das Graças dos Santos',
    cpf: '123.456.789-00',
    phone: '(44) 99918-6060',
    email: 'maria.gracas@email.com',
    address: 'Rua das Flores, 123 - Maringá/PR',
    registeredAt: '15/03/2024',
    totalSpent: 12450.00,
    totalOrders: 8,
    averageTicket: 1556.25,
    lastPurchase: '21/01/2026',
    orders: [
      {
        id: '1',
        osNumber: '39832',
        date: '21/01/2026 17:23',
        store: 'Maringá Centro',
        items: 'Armação Ray-Ban + Lente Varilux Physio',
        value: 1450.00,
        status: 'Pago',
        paymentMethod: 'Cartão de Crédito'
      },
      {
        id: '2',
        osNumber: '39785',
        date: '12/12/2025 14:30',
        store: 'Maringá Centro',
        items: 'Óculos Solar Oakley',
        value: 890.00,
        status: 'Pago',
        paymentMethod: 'PIX'
      },
      {
        id: '3',
        osNumber: '39642',
        date: '05/11/2025 10:15',
        store: 'Maringá Centro',
        items: 'Lente Transitions + Armação Acetato',
        value: 2100.00,
        status: 'Pago',
        paymentMethod: 'Cartão de Crédito'
      },
      {
        id: '4',
        osNumber: '39518',
        date: '20/09/2025 16:45',
        store: 'Maringá Centro',
        items: 'Armação Infantil + Lente Antirreflexo',
        value: 650.00,
        status: 'Pago',
        paymentMethod: 'Dinheiro'
      },
      {
        id: '5',
        osNumber: '39401',
        date: '15/07/2025 11:20',
        store: 'Maringá Centro',
        items: 'Lente Multifocal Premium',
        value: 1850.00,
        status: 'Pago',
        paymentMethod: 'Cartão de Crédito'
      },
      {
        id: '6',
        osNumber: '39287',
        date: '28/05/2025 09:30',
        store: 'Maringá Centro',
        items: 'Óculos de Leitura',
        value: 420.00,
        status: 'Pago',
        paymentMethod: 'PIX'
      },
      {
        id: '7',
        osNumber: '39145',
        date: '10/04/2025 15:10',
        store: 'Maringá Centro',
        items: 'Armação Esportiva + Lente Blue',
        value: 1120.00,
        status: 'Pago',
        paymentMethod: 'Cartão de Crédito'
      },
      {
        id: '8',
        osNumber: '39012',
        date: '22/03/2025 13:45',
        store: 'Maringá Centro',
        items: 'Armação Premium + Lente Progressiva',
        value: 2970.00,
        status: 'Pago',
        paymentMethod: 'Cartão de Crédito'
      },
    ],
    prescriptions: [
      {
        id: '1',
        date: '21/01/2026',
        doctor: 'Dr. João Silva - CRM 12345',
        od: 'OD: -2.50 / -1.00 x 180°',
        oe: 'OE: -2.75 / -1.25 x 175°',
        add: 'Adição: +2.00',
        notes: 'Prescrição para lente progressiva. Paciente relata boa adaptação.'
      },
      {
        id: '2',
        date: '12/12/2025',
        doctor: 'Dr. João Silva - CRM 12345',
        od: 'OD: -2.25 / -0.75 x 180°',
        oe: 'OE: -2.50 / -1.00 x 175°',
        add: 'Adição: +1.75',
        notes: 'Ajuste de grau. Paciente em acompanhamento.'
      },
      {
        id: '3',
        date: '05/11/2025',
        doctor: 'Dra. Ana Costa - CRM 67890',
        od: 'OD: -2.00 / -0.50 x 180°',
        oe: 'OE: -2.25 / -0.75 x 175°',
        add: 'Adição: +1.50',
        notes: 'Primeira prescrição de lente progressiva.'
      },
    ],
  },
];

type TabType = 'compras' | 'receitas' | 'observacoes';

const PurchasesTab = ({ client }: { client: ClientHistory }) => {
  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'Pago': return 'success';
      case 'Pendente': return 'warning';
      case 'Cancelado': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">OS / Data</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Produtos</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Pagamento</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
            <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {client.orders.map((order) => (
            <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">#{order.osNumber}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{order.date}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <p className="text-sm font-semibold text-slate-700">{order.items}</p>
              </td>
              <td className="px-6 py-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{order.store}</p>
              </td>
              <td className="px-6 py-5">
                <p className="text-sm font-black text-slate-900">R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </td>
              <td className="px-6 py-5">
                <p className="text-xs font-medium text-slate-600">{order.paymentMethod}</p>
              </td>
              <td className="px-6 py-5">
                <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-center gap-2">
                  <button
                    title="Ver detalhes da OS"
                    onClick={() => window.location.hash = `#/pedidos?os=${order.osNumber}`}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    title="Imprimir OS"
                    onClick={() => window.print()}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                  >
                    <FileText size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PrescriptionsTab = ({ client }: { client: ClientHistory }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{client.prescriptions.length} receitas registradas</p>
        <Button variant="outline" className="text-xs">
          <Plus size={14} /> Nova Receita
        </Button>
      </div>
      {client.prescriptions.map((prescription) => (
        <Card key={prescription.id} className="border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{prescription.doctor}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Data: {prescription.date}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Olho Direito</p>
                  <p className="text-sm font-semibold text-slate-700">{prescription.od}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Olho Esquerdo</p>
                  <p className="text-sm font-semibold text-slate-700">{prescription.oe}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adição</p>
                  <p className="text-sm font-semibold text-slate-700">{prescription.add}</p>
                </div>
              </div>
              {prescription.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Observações</p>
                  <p className="text-sm text-slate-700">{prescription.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                title="Imprimir receita"
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <FileText size={16} />
              </button>
            </div>
          </div>
        </Card>
      ))}
      {client.prescriptions.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">Nenhuma receita cadastrada</p>
        </div>
      )}
    </div>
  );
};

const NotesTab = ({ client }: { client: ClientHistory }) => {
  const notes = [
    { id: '1', date: '21/01/2026 17:30', author: 'Rodrigo Paduin', note: 'Cliente preferiu armação mais leve. Anotar preferência para próximas compras.' },
    { id: '2', date: '12/12/2025 14:45', author: 'Ana Beatriz', note: 'Cliente satisfeito com lente progressiva. Retorno agendado para 3 meses.' },
    { id: '3', date: '05/11/2025 10:20', author: 'Ricardo Silva', note: 'Primeira compra. Cliente muito atencioso e educado.' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{notes.length} observações registradas</p>
        <Button variant="outline" className="text-xs">
          <Plus size={14} /> Nova Observação
        </Button>
      </div>
      {notes.map((note) => (
        <Card key={note.id} className="border-l-4 border-l-amber-500">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-slate-900">{note.author}</p>
                <span className="text-xs text-slate-400">•</span>
                <p className="text-xs text-slate-500">{note.date}</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{note.note}</p>
            </div>
          </div>
        </Card>
      ))}
      {notes.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">Nenhuma observação registrada</p>
        </div>
      )}
    </div>
  );
};

export const ClientHistory: React.FC = () => {
  const { id } = useParams();
  const client = mockClients.find((item) => item.id === id) ?? mockClients[0];
  const [activeTab, setActiveTab] = useState<TabType>('compras');

  const tabs = [
    { id: 'compras' as TabType, label: 'Histórico de Compras', icon: ShoppingBag },
    { id: 'receitas' as TabType, label: 'Receitas', icon: Stethoscope },
    { id: 'observacoes' as TabType, label: 'Observações', icon: ClipboardList },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Histórico do Cliente</h1>
            <p className="text-gray-500 font-medium mt-1">Visualize compras, gastos e histórico completo</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.hash = `#/clientes/${client.id}/editar`}>
            <Edit size={18} /> Editar Cliente
          </Button>
          <Button onClick={() => window.location.hash = `#/pedidos/novo?cliente=${client.id}`} className="shadow-red-600/20">
            <ShoppingBag size={18} /> Nova Venda
          </Button>
        </div>
      </div>

      {/* Informações do Cliente */}
      <Card className="border-l-4 border-l-red-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <Package size={28} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-slate-900">{client.name}</h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={16} className="text-red-600" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={16} className="text-red-600" />
                    {client.email || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={16} className="text-red-600" />
                    CPF: {client.cpf}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} className="text-red-600" />
                    Cliente desde: {client.registeredAt}
                  </div>
                </div>
                {client.address && (
                  <div className="flex items-start gap-2 mt-3 text-sm text-slate-600">
                    <MapPin size={16} className="text-red-600 mt-0.5" />
                    {client.address}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Compras</p>
              <p className="text-2xl font-black text-slate-900">{client.totalOrders}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Gasto</p>
              <p className="text-2xl font-black text-emerald-700">R$ {client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gasto"
          value={`R$ ${client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="red"
        />
        <StatCard
          title="Total de Compras"
          value={client.totalOrders.toString()}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${client.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Última Compra"
          value={client.lastPurchase}
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Abas de Conteúdo */}
      <Card className="p-0 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-100">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-8">
          {activeTab === 'compras' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Histórico de Compras</h3>
                <p className="text-sm text-slate-500 mt-1">{client.orders.length} ordens de serviço registradas</p>
              </div>
              <PurchasesTab client={client} />
            </div>
          )}
          {activeTab === 'receitas' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Receitas Médicas</h3>
                <p className="text-sm text-slate-500 mt-1">Prescrições e graus do cliente</p>
              </div>
              <PrescriptionsTab client={client} />
            </div>
          )}
          {activeTab === 'observacoes' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Observações</h3>
                <p className="text-sm text-slate-500 mt-1">Anotações e observações sobre o cliente</p>
              </div>
              <NotesTab client={client} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
