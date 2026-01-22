
import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/Common';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export const POS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const products = [
    { id: '1', name: 'Armação Ray-Ban Aviator', price: 850.00, category: 'Armações', stock: 5 },
    { id: '2', name: 'Limpa Lentes Spray 60ml', price: 15.00, category: 'Acessórios', stock: 150 },
    { id: '3', name: 'Estojo Premium Couro', price: 45.00, category: 'Acessórios', stock: 20 },
    { id: '4', name: 'Armação Oakley Holbrook', price: 720.00, category: 'Armações', stock: 3 },
    { id: '5', name: 'Cordão Silicone Infantil', price: 12.00, category: 'Acessórios', stock: 45 },
  ];

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

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-160px)] animate-in fade-in duration-500">
      
      {/* Lado Esquerdo: Catálogo e Busca */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar produto ou código de barras..." 
              className="w-full pl-12 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-sm text-sm font-medium focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" className="px-8 whitespace-nowrap">
            <Zap size={18} /> Venda Rápida
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <div 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <Package size={24} />
                  </div>
                  <Badge variant="info">{product.category}</Badge>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">{product.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Estoque: {product.stock} un</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <Plus size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lado Direito: Carrinho e Checkout */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-red-50">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600 rounded-xl text-white">
                <ShoppingCart size={18} />
              </div>
              <h2 className="text-lg font-black tracking-tight">Carrinho</h2>
            </div>
            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black">{cart.length} ITENS</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Carrinho Vazio</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-600 transition-colors"><Minus size={12} /></button>
                    <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-red-600 transition-colors"><Plus size={12} /></button>
                  </div>
                  <button title="Remover do carrinho" onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Cliente</span>
                <button className="text-red-600 flex items-center gap-1 hover:underline">
                  <UserPlus size={14} /> Vincular
                </button>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-400">
                Consumidor Final (Venda Avulsa)
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 border-t border-slate-200 pt-4">
                <span>Total</span>
                <span className="text-red-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-red-600 hover:text-red-600 transition-all gap-2">
                 <CreditCard size={20} />
                 <span className="text-[10px] font-black uppercase">Cartão</span>
               </button>
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-red-600 hover:text-red-600 transition-all gap-2">
                 <QrCode size={20} />
                 <span className="text-[10px] font-black uppercase">PIX</span>
               </button>
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-red-600 hover:text-red-600 transition-all gap-2">
                 <Banknote size={20} />
                 <span className="text-[10px] font-black uppercase">Dinheiro</span>
               </button>
            </div>

            <Button className="w-full py-4 text-base shadow-xl shadow-red-200">
              <CheckCircle2 size={20} /> Finalizar Venda
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
