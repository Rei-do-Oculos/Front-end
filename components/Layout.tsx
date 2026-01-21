
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  DollarSign, 
  ClipboardList, 
  Trash2, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Search,
  Bell,
  Eye,
  Target,
  Store,
  Truck,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  submenu?: { title: string; path: string }[];
  highlight?: boolean;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { 
    title: 'PDV / Vendas', 
    icon: <ShoppingCart size={20} />, 
    path: '/pdv',
    highlight: true 
  },
  { 
    title: 'Chat Unidades', 
    icon: <MessageSquare size={20} />, 
    path: '/chat' 
  },
  { 
    title: 'Clientes', 
    icon: <Users size={20} />, 
    path: '/clientes',
    submenu: [
      { title: 'Todos os Clientes', path: '/clientes' },
      { title: 'Cadastrar Novo', path: '/clientes/novo' },
      { title: 'Alertas de Retorno', path: '/clientes/retorno' }
    ]
  },
  { 
    title: 'Estoque', 
    icon: <Package size={20} />, 
    path: '/estoque',
    submenu: [
      { title: 'Visão Geral', path: '/estoque' },
      { title: 'Nova Armação', path: '/estoque/novo' },
      { title: 'Lentes e Insumos', path: '/estoque/lentes' }
    ]
  },
  { 
    title: 'Fornecedores', 
    icon: <Truck size={20} />, 
    path: '/fornecedores',
    submenu: [
      { title: 'Lista de Parceiros', path: '/fornecedores' },
      { title: 'Cadastrar Fornecedor', path: '/fornecedores/novo' }
    ]
  },
  { title: 'Fluxo de Caixa', icon: <DollarSign size={20} />, path: '/financeiro' },
  { 
    title: 'Ordens de Serviço', 
    icon: <ClipboardList size={20} />, 
    path: '/pedidos',
    submenu: [
      { title: 'Listagem de OS', path: '/pedidos' },
      { title: 'Abrir Nova OS', path: '/pedidos/novo' },
      { title: 'Status Laboratório', path: '/pedidos/status' }
    ]
  },
  { title: 'Lixeira', icon: <Trash2 size={20} />, path: '/lixeira' },
];

export const Layout: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const location = useLocation();

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans">
      <div className="p-6 flex items-center gap-3 h-20 shrink-0">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
          <span className="font-bold text-white text-lg">RÓ</span>
        </div>
        {(isSidebarOpen || isMobileMenuOpen) && (
          <span className="font-semibold text-lg tracking-tight whitespace-nowrap">
            REI DO <span className="text-red-600 uppercase">Óculos</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-hide">
        <nav className="space-y-1">
          <p className="px-4 pb-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.25em]">Navegação</p>
          {menuItems.map((item) => (
            <div key={item.title} className="group">
              <Link
                to={item.path}
                onClick={(e) => {
                  if (item.submenu) {
                    e.preventDefault();
                    toggleSubmenu(item.title);
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  item.highlight ? 'bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white mb-2' : ''
                } ${
                  isActive(item.path) && !item.highlight
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' 
                    : !item.highlight ? 'text-slate-400 hover:bg-white/5 hover:text-white' : ''
                } ${item.highlight && isActive(item.path) ? 'bg-red-600 text-white border-transparent shadow-lg shadow-red-600/20' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`${isActive(item.path) ? 'text-white' : ''} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-medium tracking-wide">{item.title}</span>}
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && item.submenu && (
                  <ChevronDown size={14} className={`transition-transform duration-300 ${openSubmenus.includes(item.title) ? 'rotate-180' : ''}`} />
                )}
              </Link>
              {(isSidebarOpen || isMobileMenuOpen) && item.submenu && openSubmenus.includes(item.title) && (
                <div className="mt-1 ml-6 pl-4 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.title}
                      to={sub.path}
                      className={`block p-2 text-xs font-medium rounded-lg transition-all ${
                        location.pathname === sub.path ? 'text-white bg-white/5' : 'text-slate-500 hover:text-red-400 hover:translate-x-1'
                      }`}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rodrigo" 
            className="w-10 h-10 rounded-xl bg-slate-800 p-1 border border-white/10" 
            alt="User"
          />
          {(isSidebarOpen || isMobileMenuOpen) && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Rodrigo Paduin</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">Unidade Maringá</p>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-600/10 hover:text-red-500 transition-all border border-transparent hover:border-red-600/20"
        >
          <LogOut size={18} />
          {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-semibold">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8f9fc] overflow-hidden font-sans text-slate-900">
      <aside 
        className={`hidden lg:flex flex-col shadow-2xl transition-all duration-500 ease-in-out relative ${
          isSidebarOpen ? 'w-72' : 'w-24'
        }`}
      >
        <SidebarContent />
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-10 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white z-50"
        >
          <ChevronRight size={14} className={`transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 shrink-0 z-40">
          <div className="flex items-center gap-6">
             <button 
              className="lg:hidden p-2.5 text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
              onClick={() => setIsMobileMenuOpen(true)}
             >
               <Menu size={20} />
             </button>
             <div className="relative hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-12 pr-6 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-4 focus:ring-red-500/5 transition-all outline-none w-80 font-medium"
               />
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button className="p-2 text-slate-400 hover:text-red-600 transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-[1600px] mx-auto p-4 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
