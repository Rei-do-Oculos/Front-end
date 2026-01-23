
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  UserPlus, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  Package,
  X,
  FileText,
  Receipt,
  User,
  XCircle,
  ArrowLeft,
  Home,
  Clock,
  Calendar
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/Common';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface Client {
  id: string;
  name: string;
  cpf: string;
  phone?: string;
}

type ViewMode = 'products' | 'client';

export const POS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'cash' | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [visibleProducts, setVisibleProducts] = useState(15);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Atualizar data e hora
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        weekday: 'short'
      };
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      
      const dateStr = now.toLocaleDateString('pt-BR', dateOptions);
      // Formatar: "seg, 22/01/2026" -> "Seg, 22/01/2026"
      setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
      setCurrentTime(now.toLocaleTimeString('pt-BR', timeOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mock de clientes - substituir por busca na API
  const mockClients: Client[] = [
    { id: '1', name: 'Maria das Graças dos Santos', cpf: '123.456.789-00', phone: '(44) 99999-9999' },
    { id: '2', name: 'João Silva', cpf: '987.654.321-00', phone: '(44) 88888-8888' },
    { id: '3', name: 'Ana Paula Costa', cpf: '111.222.333-44', phone: '(44) 77777-7777' },
  ];

  const products = [
    { id: '1', name: 'Armação Ray-Ban Aviator', price: 850.00, category: 'Armações', stock: 5 },
    { id: '2', name: 'Limpa Lentes Spray 60ml', price: 15.00, category: 'Acessórios', stock: 150 },
    { id: '3', name: 'Estojo Premium Couro', price: 45.00, category: 'Acessórios', stock: 20 },
    { id: '4', name: 'Armação Oakley Holbrook', price: 720.00, category: 'Armações', stock: 3 },
    { id: '5', name: 'Cordão Silicone Infantil', price: 12.00, category: 'Acessórios', stock: 45 },
    { id: '6', name: 'Armação Prada PR 01VS', price: 1200.00, category: 'Armações', stock: 2 },
    { id: '7', name: 'Lente Essilor Varilux Comfort', price: 450.00, category: 'Lentes', stock: 8 },
    { id: '8', name: 'Armação Gucci GG0061S', price: 980.00, category: 'Armações', stock: 4 },
    { id: '9', name: 'Kit Limpeza Completo', price: 35.00, category: 'Acessórios', stock: 60 },
    { id: '10', name: 'Armação Versace VE4285', price: 1100.00, category: 'Armações', stock: 3 },
    { id: '11', name: 'Lente Hoya EnRoute', price: 380.00, category: 'Lentes', stock: 12 },
    { id: '12', name: 'Armação Tom Ford TF5236', price: 1350.00, category: 'Armações', stock: 2 },
    { id: '13', name: 'Cordão Nylon Adulto', price: 18.00, category: 'Acessórios', stock: 80 },
    { id: '14', name: 'Armação Dior DIORSO1', price: 1250.00, category: 'Armações', stock: 1 },
    { id: '15', name: 'Lente Zeiss Individual', price: 520.00, category: 'Lentes', stock: 6 },
    { id: '16', name: 'Armação Prada PR 17VS', price: 1150.00, category: 'Armações', stock: 3 },
    { id: '17', name: 'Estojo Rígido Couro', price: 55.00, category: 'Acessórios', stock: 25 },
    { id: '18', name: 'Armação Ray-Ban Wayfarer', price: 680.00, category: 'Armações', stock: 7 },
    { id: '19', name: 'Lente Transitions XTRActive', price: 420.00, category: 'Lentes', stock: 10 },
    { id: '20', name: 'Armação Oakley OO9208', price: 750.00, category: 'Armações', stock: 5 },
    { id: '21', name: 'Spray Anti-embaçante', price: 22.00, category: 'Acessórios', stock: 90 },
    { id: '22', name: 'Armação Gucci GG0063', price: 1020.00, category: 'Armações', stock: 2 },
    { id: '23', name: 'Lente Crizal Alize', price: 290.00, category: 'Lentes', stock: 15 },
    { id: '24', name: 'Armação Versace VE4287', price: 1080.00, category: 'Armações', stock: 4 },
    { id: '25', name: 'Cordão Elástico Esportivo', price: 20.00, category: 'Acessórios', stock: 50 },
    { id: '26', name: 'Armação Tom Ford TF5238', price: 1400.00, category: 'Armações', stock: 1 },
    { id: '27', name: 'Lente Essilor Eyezen', price: 480.00, category: 'Lentes', stock: 9 },
    { id: '28', name: 'Armação Dior DIORSO2', price: 1300.00, category: 'Armações', stock: 2 },
    { id: '29', name: 'Estojo Dobrável Nylon', price: 28.00, category: 'Acessórios', stock: 40 },
    { id: '30', name: 'Armação Ray-Ban Clubmaster', price: 720.00, category: 'Armações', stock: 6 },
  ];

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.cpf.includes(clientSearch)
  );

  // Resetar produtos visíveis quando busca mudar
  useEffect(() => {
    setVisibleProducts(15);
  }, [search]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientSearch(false);
    setClientSearch('');
    setViewMode('products');
  };

  const removeClient = () => {
    setSelectedClient(null);
  };

  const handleFinishSale = () => {
    if (cart.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar a venda.');
      return;
    }
    if (!paymentMethod) {
      alert('Selecione uma forma de pagamento.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSale = () => {
    setShowConfirmModal(false);
    setShowFinishModal(true);
  };

  const handlePrintInvoice = () => {
    console.log('Criando OS e emitindo NF-e...', {
      client: selectedClient,
      items: cart,
      paymentMethod,
      total
    });
    alert('NF-e emitida com sucesso! Redirecionando para impressão...');
    resetSale();
  };

  const handlePrintReceipt = () => {
    console.log('Criando OS simples e imprimindo recibo...', {
      client: selectedClient,
      items: cart,
      paymentMethod,
      total
    });
    alert('Recibo gerado com sucesso! Redirecionando para impressão...');
    resetSale();
  };

  const resetSale = () => {
    setCart([]);
    setSelectedClient(null);
    setPaymentMethod(null);
    setShowFinishModal(false);
    setShowConfirmModal(false);
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // View: Seleção de Cliente (Modal Overlay)
  if (viewMode === 'client') {
    return (
      <div className="h-screen flex flex-col animate-in fade-in duration-500 bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Selecionar Cliente</h1>
            <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Opcional • Busca por Nome ou CPF</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => setViewMode('products')}
            className="border-slate-200 text-slate-600 bg-white"
          >
            <ArrowLeft size={18} /> Voltar
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
          <Input
            placeholder="Digite o nome ou CPF do cliente..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="text-lg"
          />

          <div className="flex-1 overflow-y-auto space-y-2">
            {clientSearch ? (
              filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="w-full p-4 bg-white rounded-xl border border-slate-100 hover:border-red-200 hover:shadow-md transition-all text-left"
                  >
                    <p className="text-sm font-black text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{client.cpf}</p>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <User size={48} className="mb-4 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Nenhum cliente encontrado</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <User size={64} className="mb-4 text-slate-300" />
                <p className="text-sm font-bold text-slate-400 mb-2">Busque por nome ou CPF</p>
                <p className="text-xs text-slate-400">Ou continue sem cliente como Consumidor Final</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button 
              onClick={() => {
                setSelectedClient(null);
                setViewMode('products');
              }}
              variant="outline"
              className="w-full border-slate-200 text-slate-600 bg-white"
            >
              Continuar sem Cliente (Consumidor Final)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // View: Produtos + Carrinho (Layout lado a lado)
  return (
    <div className="h-screen flex flex-col bg-white animate-in fade-in duration-500">
      {/* Header */}
      <header className="min-h-20 bg-red-600 shrink-0 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 shadow-lg gap-3 md:gap-0">
        {/* Lado Esquerdo: PDV */}
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/20 rounded-lg md:rounded-xl border border-white/30">
              <span className="text-white font-black text-sm md:text-lg tracking-wider">PDV</span>
            </div>
            {selectedClient && (
              <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/20 border border-white/30 rounded-lg md:rounded-xl">
                <User size={14} className="text-white" />
                <span className="text-[10px] md:text-xs font-bold text-white max-w-[120px] truncate">{selectedClient.name}</span>
                <button onClick={removeClient} className="ml-1 text-white hover:text-red-200 transition-colors">
                  <XCircle size={12} />
                </button>
              </div>
            )}
            <button 
              onClick={() => setViewMode('client')}
              className="px-2 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg md:rounded-xl text-white font-semibold text-xs md:text-sm transition-all flex items-center gap-1 md:gap-2"
            >
              <UserPlus size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">{selectedClient ? 'Trocar' : 'Cliente'}</span>
            </button>
          </div>
          <button 
            onClick={() => window.location.hash = '#/'}
            className="px-2 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg md:rounded-xl text-white font-semibold text-xs md:text-sm transition-all flex items-center gap-1 md:gap-2"
          >
            <Home size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>

        {/* Cliente Mobile */}
        {selectedClient && (
          <div className="md:hidden w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg flex items-center gap-2">
            <User size={14} className="text-white" />
            <span className="text-xs font-bold text-white flex-1 truncate">{selectedClient.name}</span>
            <button onClick={removeClient} className="text-white hover:text-red-200 transition-colors">
              <XCircle size={14} />
            </button>
          </div>
        )}

        {/* Centro: Logo */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 md:w-12 h-10 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart size={20} className="md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight">Rei do Óculos</h1>
              <p className="text-[9px] md:text-[10px] text-white/80 font-medium uppercase tracking-widest">Ponto de Venda</p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Data/Hora */}
        <div className="hidden md:flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-white">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Calendar size={16} className="md:w-[18px] md:h-[18px] text-white/80" />
              <span className="font-bold text-xs md:text-sm">{currentDate}</span>
            </div>
            <div className="w-px h-4 md:h-6 bg-white/30"></div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Clock size={16} className="md:w-[18px] md:h-[18px] text-white/80" />
              <span className="font-black text-xs md:text-sm">{currentTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal: Produtos + Carrinho */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 overflow-hidden">
        {/* Lado Esquerdo: Catálogo de Produtos */}
        <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-hidden min-w-0">
          {/* Busca */}
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar produto ou código de barras..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grid de Produtos */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {products
                .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                .slice(0, visibleProducts)
                .map(product => (
                  <div 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white p-3 rounded-lg border-2 border-red-100 hover:border-red-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                          <Package size={16} />
                        </div>
                        <Badge variant="info" className="text-[9px] px-1.5 py-0.5">{product.category}</Badge>
                      </div>
                      <h3 className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Estoque: {product.stock}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <div className="p-1.5 bg-red-600 text-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                        <Plus size={12} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Botão Ver Mais */}
            {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).length > visibleProducts && (
              <div className="pt-4 border-t border-slate-100 mt-4 shrink-0">
                <button
                  onClick={() => setVisibleProducts(prev => Math.min(prev + 15, products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).length))}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Ver Mais</span>
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Carrinho e Checkout */}
        <div className="w-full lg:w-[450px] flex flex-col gap-3 md:gap-4 shrink-0 lg:shrink-0 order-first lg:order-last">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-red-50 max-h-[600px] lg:max-h-none">
            <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600 rounded-xl text-white">
                  <ShoppingCart size={18} />
                </div>
                <h2 className="text-lg font-black tracking-tight">Carrinho</h2>
              </div>
              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black">{cart.length} ITENS</span>
            </div>

            {/* Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 md:space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">Carrinho Vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-600 transition-colors"><Minus size={12} /></button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-red-600 transition-colors"><Plus size={12} /></button>
                    </div>
                    <div className="text-xs font-black text-slate-900 w-20 text-right">
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <button title="Remover" onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer: Cliente, Pagamento e Total */}
            <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 space-y-3 md:space-y-4 shrink-0">
              {/* Cliente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Cliente (Opcional)</span>
                  {!selectedClient && (
                    <button 
                      onClick={() => setViewMode('client')}
                      className="text-red-600 flex items-center gap-1 hover:underline"
                    >
                      <UserPlus size={12} /> Buscar
                    </button>
                  )}
                </div>
                {selectedClient ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <User size={16} className="text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-900 truncate">{selectedClient.name}</p>
                        <p className="text-[10px] text-emerald-600 truncate">{selectedClient.cpf}</p>
                      </div>
                    </div>
                    <button onClick={removeClient} className="text-emerald-600 hover:text-red-600 shrink-0 ml-2">
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-400">
                    Consumidor Final (Venda Avulsa)
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold text-slate-900">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xl font-black border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span className="text-red-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500">Forma de Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                      paymentMethod === 'card' 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-white border-slate-200 hover:border-red-200'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[10px] font-black uppercase">Cartão</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                      paymentMethod === 'pix' 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-white border-slate-200 hover:border-red-200'
                    }`}
                  >
                    <QrCode size={18} />
                    <span className="text-[10px] font-black uppercase">PIX</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                      paymentMethod === 'cash' 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-white border-slate-200 hover:border-red-200'
                    }`}
                  >
                    <Banknote size={18} />
                    <span className="text-[10px] font-black uppercase">Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Botão Finalizar */}
              <Button 
                onClick={handleFinishSale}
                className="w-full py-4 text-base shadow-xl shadow-red-200"
                disabled={cart.length === 0 || !paymentMethod}
              >
                <CheckCircle2 size={20} /> Finalizar Venda
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Confirmar Venda</h3>
              <p className="text-sm text-slate-500 mt-1">Revise os dados antes de finalizar</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedClient ? selectedClient.name : 'Consumidor Final'}
                  </p>
                  {selectedClient && (
                    <p className="text-xs text-slate-500 mt-1">{selectedClient.cpf}</p>
                  )}
                </div>
              </div>

              {/* Produtos */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Produtos ({cart.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">Qtd: {item.quantity} × R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <p className="text-sm font-black text-slate-900 ml-4">
                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagamento e Total */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Forma de Pagamento:</span>
                  <span className="font-bold text-slate-900">
                    {paymentMethod === 'card' ? 'Cartão' : paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-black border-t border-slate-200 pt-3">
                  <span>Total:</span>
                  <span className="text-red-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 border-slate-200 text-slate-600 bg-white"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmSale}
                  className="flex-1 shadow-xl shadow-red-200"
                >
                  <CheckCircle2 size={18} /> Confirmar Venda
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Finalização (NF-e ou Recibo) */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 text-center">
              <h3 className="text-2xl font-black text-slate-900 mb-1">Venda Finalizada!</h3>
              <p className="text-sm text-gray-500 uppercase tracking-widest">Escolha o tipo de documento</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handlePrintInvoice}
                  className="flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all group"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    <FileText size={28} className="md:w-9 md:h-9" />
                  </div>
                  <span className="text-lg md:text-xl font-black text-slate-900 mb-1 md:mb-2">Nota Fiscal</span>
                  <span className="text-xs md:text-sm text-slate-600">NF-e Eletrônica</span>
                </button>
                
                <button
                  onClick={handlePrintReceipt}
                  className="flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 hover:shadow-xl transition-all group"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    <Receipt size={28} className="md:w-9 md:h-9" />
                  </div>
                  <span className="text-lg md:text-xl font-black text-slate-900 mb-1 md:mb-2">Recibo</span>
                  <span className="text-xs md:text-sm text-slate-600">Simples</span>
                </button>
              </div>

              <div className="p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cliente:</span>
                    <span className="font-bold text-slate-900">{selectedClient ? selectedClient.name : 'Consumidor Final'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Itens:</span>
                    <span className="font-bold text-slate-900">{cart.length} produto(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pagamento:</span>
                    <span className="font-bold text-slate-900">
                      {paymentMethod === 'card' ? 'Cartão' : paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-black border-t border-slate-200 pt-3 mt-2">
                    <span>Total:</span>
                    <span className="text-red-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline"
                onClick={resetSale}
                className="w-full border-slate-200 text-slate-600 bg-white"
              >
                <ArrowLeft size={18} /> Nova Venda
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
