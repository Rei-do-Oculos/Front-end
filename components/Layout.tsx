
import React, { useState, useEffect } from 'react';
import { styles } from '../config/styles';
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
  Building2,
  ShieldCheck,
  FlaskConical,
  User,
  KeyRound,
  Sparkles,
  Home,
  Clock,
  Calendar
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
    title: 'Lojas / Unidades', 
    icon: <Store size={20} />, 
    path: '/lojas'
  },
  { 
    title: 'Clientes', 
    icon: <Users size={20} />, 
    path: '/clientes'
  },
  {
    title: 'Vendedores',
    icon: <User size={20} />,
    path: '/vendedores'
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
    path: '/fornecedores'
  },
  { 
    title: 'Lentes', 
    icon: <Sparkles size={20} />, 
    path: '/lentes'
  },
  { 
    title: 'Financeiro', 
    icon: <DollarSign size={20} />, 
    path: '/financeiro',
    submenu: [
      { title: 'Fluxo de Caixa', path: '/financeiro' },
      { title: 'Inadimplências', path: '/financeiro/inadimplencias' },
      { title: 'Notas Fiscais', path: '/notas-fiscais' }
    ]
  },
  { 
    title: 'Ordens de Serviço', 
    icon: <ClipboardList size={20} />, 
    path: '/pedidos',
    submenu: [
      { title: 'Listagem Geral (Faturamento)', path: '/pedidos' },
      { title: 'Laboratório / Produção', path: '/pedidos/laboratorio' },
      { title: 'Abrir Nova OS', path: '/pedidos/novo' }
    ]
  },
  { 
    title: 'Sistema', 
    icon: <Settings size={20} />, 
    path: '/permissoes',
    submenu: [
      { title: 'Permissões', path: '/permissoes' },
      { title: 'Auditoria', path: '/auditoria' },
      { title: 'Lixeira', path: '/lixeira' }
    ]
  },
];

export const Layout: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const location = useLocation();

  // Mapeamento de rotas para breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ label: 'Dashboard', path: '/' }];

    if (path === '/') return [{ label: 'Dashboard', path: '/' }];

    // Mapeamento de rotas
    const routeMap: { [key: string]: string } = {
      '/pdv': 'PDV / Vendas',
      '/lojas': 'Lojas / Unidades',
      '/lojas/novo': 'Nova Unidade',
      '/clientes': 'Clientes',
      '/clientes/novo': 'Novo Cliente',
      '/vendedores': 'Vendedores',
      '/vendedores/novo': 'Novo Vendedor',
      '/estoque': 'Estoque',
      '/fornecedores': 'Fornecedores',
      '/fornecedores/novo': 'Novo Fornecedor',
      '/lentes': 'Lentes',
      '/lentes/novo': 'Nova Marca',
      '/financeiro': 'Financeiro',
      '/financeiro/inadimplencias': 'Inadimplências',
      '/notas-fiscais': 'Notas Fiscais',
      '/pedidos': 'Ordens de Serviço',
      '/pedidos/laboratorio': 'Laboratório',
      '/pedidos/novo': 'Nova OS',
      '/permissoes': 'Permissões',
      '/auditoria': 'Auditoria',
      '/lixeira': 'Lixeira',
    };

    // Detectar se é edição ou detalhes
    if (path.includes('/editar')) {
      const basePath = path.split('/editar')[0];
      const baseLabel = routeMap[basePath] || basePath.replace('/', '');
      crumbs.push({ label: baseLabel, path: basePath });
      crumbs.push({ label: 'Editar', path: path });
    } else if (path.match(/\/[^/]+\/[^/]+$/) && !path.includes('/novo') && !path.includes('/laboratorio') && !path.includes('/inadimplencias') && !path.includes('/notas-fiscais')) {
      // Detectar detalhes (ex: /clientes/:id)
      const basePath = '/' + path.split('/')[1];
      const baseLabel = routeMap[basePath] || basePath.replace('/', '');
      crumbs.push({ label: baseLabel, path: basePath });
      crumbs.push({ label: 'Detalhes', path: path });
    } else if (path.includes('/notas-fiscais/') && path.split('/').length > 2) {
      // Detectar detalhes da NF-e
      crumbs.push({ label: 'Notas Fiscais', path: '/notas-fiscais' });
      crumbs.push({ label: 'Detalhes da NF-e', path: path });
    } else {
      const label = routeMap[path] || path.split('/').pop()?.replace(/-/g, ' ') || path;
      crumbs.push({ label: label, path: path });
    }

    return crumbs;
  };

  // Atualizar data e hora
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      
      setCurrentDate(`${day} de ${month}. de ${year}`);
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000); // Atualizar a cada segundo

    return () => clearInterval(interval);
  }, []);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (path: string, submenu?: { title: string; path: string }[]) => {
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    if (submenu) {
      return submenu.some(sub => location.pathname === sub.path || (sub.path !== '/' && location.pathname.startsWith(sub.path)));
    }
    return false;
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans">
      <div className="p-6 flex items-center gap-3 h-20 shrink-0">
        <div className={`w-10 h-10 bg-red-600 ${styles.button.small} flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20`}>
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
              {item.path === '/pdv' ? (
                <a
                  href="#/pdv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-between p-3 ${styles.button.default} cursor-pointer transition-all duration-300 ${
                    item.highlight ? 'bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white mb-2' : ''
                  } ${item.highlight && isActive(item.path, item.submenu) ? 'bg-red-600 text-white border-transparent shadow-lg shadow-red-600/20' : ''}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`${isActive(item.path) ? 'text-white' : ''} group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </span>
                    {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-medium tracking-wide">{item.title}</span>}
                  </div>
                </a>
              ) : (
                <Link
                  to={item.path}
                  onClick={(e) => {
                    if (item.submenu) {
                      e.preventDefault();
                      toggleSubmenu(item.title);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 ${styles.button.default} cursor-pointer transition-all duration-300 ${
                    item.highlight ? 'bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white mb-2' : ''
                  } ${
                    isActive(item.path, item.submenu) && !item.highlight
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' 
                      : !item.highlight ? 'text-slate-400 hover:bg-white/5 hover:text-white' : ''
                  } ${item.highlight && isActive(item.path, item.submenu) ? 'bg-red-600 text-white border-transparent shadow-lg shadow-red-600/20' : ''}`}
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
              )}
              {(isSidebarOpen || isMobileMenuOpen) && item.submenu && openSubmenus.includes(item.title) && (
                <div className="mt-1 ml-6 pl-4 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.title}
                      to={sub.path}
                      className={`block p-2 text-xs font-medium ${styles.button.small} transition-all ${
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
        {/* Informações do Usuário */}
        <div className="flex items-center gap-3">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rodrigo" 
            className={`w-10 h-10 ${styles.button.small} bg-slate-800 p-1 border border-white/10`} 
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
          className={`w-full flex items-center gap-3 p-3 ${styles.button.default} text-slate-400 hover:bg-red-600/10 hover:text-red-500 transition-all border border-transparent hover:border-red-600/20`}
        >
          <LogOut size={18} />
          {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-semibold">Sair</span>}
        </button>
      </div>
    </div>
  );

  const isPDVPage = location.pathname === '/pdv';

  return (
    <div className="flex h-screen bg-[#f8f9fc] overflow-hidden font-sans text-slate-900">
      {!isPDVPage && (
        <>
          {/* Sidebar Desktop */}
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

          {/* Menu Mobile Overlay */}
          {isMobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <aside className="fixed left-0 top-0 h-full w-72 shadow-2xl z-50 lg:hidden animate-in slide-in-from-left duration-300">
                <div className="flex flex-col h-full bg-slate-950 text-white font-sans">
                  <div className="p-6 flex items-center justify-between h-20 shrink-0 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-red-600 ${styles.button.small} flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20`}>
                        <span className="font-bold text-white text-lg">RÓ</span>
                      </div>
                      <span className="font-semibold text-lg tracking-tight whitespace-nowrap">
                        REI DO <span className="text-red-600 uppercase">Óculos</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <SidebarContent />
                </div>
              </aside>
            </>
          )}
        </>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${isPDVPage ? 'w-full' : ''}`}>
        {!isPDVPage && (
          <header className="bg-white border-b border-gray-100 shrink-0 z-40">
          {/* Breadcrumbs e Data/Hora */}
          <div className="min-h-14 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 lg:px-10 py-2 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-0">
                {getBreadcrumbs().map((crumb, index, array) => (
                  <React.Fragment key={crumb.path}>
                    {index === 0 ? (
                      <Link to={crumb.path} className="flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <Home size={14} className="sm:w-4 sm:h-4" />
                        <span className="truncate">{crumb.label}</span>
                      </Link>
                    ) : (
                      <>
                        <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 text-slate-300 shrink-0" />
                        {index === array.length - 1 ? (
                          <span className="text-slate-900 font-semibold truncate">{crumb.label}</span>
                        ) : (
                          <Link to={crumb.path} className="text-slate-400 hover:text-slate-900 transition-colors truncate">
                            {crumb.label}
                          </Link>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Data e Hora */}
            <div className="hidden sm:flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-600">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Calendar size={14} className="md:w-4 md:h-4 text-slate-400" />
                <span className="font-medium">{currentDate}</span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Clock size={14} className="md:w-4 md:h-4 text-slate-400" />
                <span className="font-medium">{currentTime}</span>
              </div>
            </div>
          </div>

          {/* Barra de Busca e Ações */}
          <div className="min-h-16 flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 lg:px-10 py-2 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <button 
                className={`lg:hidden p-2 sm:p-2.5 text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 ${styles.button.default} transition-all shrink-0`}
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="relative flex-1 sm:flex-none hidden sm:block">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} className="sm:w-4 sm:h-4" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className={`pl-10 sm:pl-12 pr-4 sm:pr-6 py-2 sm:py-2.5 bg-slate-50 border-none ${styles.input.default} text-xs sm:text-sm focus:ring-4 focus:ring-red-500/5 transition-all outline-none w-full sm:w-80 font-medium`}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className={`flex items-center bg-slate-50 p-1 sm:p-1.5 ${styles.button.default} border border-slate-100`}>
                <button className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 transition-colors relative">
                  <Bell size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-px h-5 sm:h-6 bg-slate-200 mx-0.5 sm:mx-1"></div>
                <button className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </header>
        )}

        <main className={`flex-1 overflow-y-auto ${isPDVPage ? 'bg-white' : 'bg-slate-50/50'}`}>
          {isPDVPage ? (
            <div className="h-full">
              {children}
            </div>
          ) : (
            <div className="max-w-[1920px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
