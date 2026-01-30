
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useAuth } from '../services/hooks/useAuth';
import { hasRoutePermission, getEffectiveUserPermissions, isSuperAdmin, hasAnyModulePermission, routePermissionMap } from '../utils/menuPermissions';
import { useStore } from '../contexts/StoreContext';
import { generateColorVariables } from '../utils/colorUtils';

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
    path: '/stores'
  },
  { 
    title: 'Clientes', 
    icon: <Users size={20} />, 
    path: '/clients'
  },
  { 
    title: 'Estoque', 
    icon: <Package size={20} />, 
    path: '/estoque',
    submenu: [
      { title: 'Armações', path: '/frames' },
      { title: 'Tipos de Armação', path: '/frame-types' },
      { title: 'Transferências', path: '/transferencias' }
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
    path: '/lenses'
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
      { title: 'Abrir Nova OS', path: '/pedidos/create' }
    ]
  },
  { 
    title: 'Sistema', 
    icon: <Settings size={20} />, 
    path: '/permissions',
    submenu: [
      { title: 'Permissões', path: '/permissions' },
      { title: 'Usuários', path: '/users' },
      { title: 'Auditoria', path: '/audit' },
      { title: 'Lixeira', path: '/trash' }
    ]
  },
];

// Componente de Dropdown do Usuário
const UserDropdown: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1.5"
      >
        <User size={16} className="sm:w-[18px] sm:h-[18px]" />
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Informações do Usuário */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                className="w-10 h-10 rounded-lg bg-slate-100 p-1 border border-slate-200" 
                alt="User"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
          
          {/* Botão de Logout */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all rounded-lg"
            >
              <LogOut size={16} />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const location = useLocation();
  const { user } = useAuth();
  const { selectedStore, availableStores, setSelectedStore, storeColor, storeUnity } = useStore();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar itens do menu baseado nas permissões efetivas do backend (all_permissions)
  const filteredMenuItems = useMemo(() => {
    if (!user) return [];

    if (isSuperAdmin(user)) return menuItems;

    const allPermissions = getEffectiveUserPermissions(user);

    // Sem all_permissions não mostramos itens que exigem permissão (apenas públicos)
    if (allPermissions.length === 0) {
      return menuItems.filter(item => {
        const requiredPermissions = routePermissionMap[item.path];
        return !requiredPermissions || requiredPermissions.length === 0;
      });
    }

    // Mapeamento de rotas para prefixos de módulos
    const routeToModuleMap: Record<string, string> = {
      '/clients': 'clients',
      '/stores': 'stores',
      '/lenses': 'lenses',
      '/frame-types': 'frame-types',
      '/frames': 'frames',
      '/transferencias': 'store-frames',
      '/users': 'users',
      '/permissions': 'roles', // permissions ou roles
      '/audit': 'audits',
      '/vendedores': 'sellers',
      '/fornecedores': 'suppliers',
      '/pedidos': 'orders',
      '/estoque': 'stock',
      '/financeiro': 'finance',
      '/pdv': 'pos',
      '/chat': 'chat',
    };

    // Filtrar e mapear itens do menu
    const filtered = menuItems
      .filter(item => {
        const requiredPermissions = routePermissionMap[item.path];
        const modulePrefix = routeToModuleMap[item.path];
        
        // Se há um prefixo de módulo mapeado, verificar PRIMEIRO se o usuário tem pelo menos uma permissão desse módulo
        // Isso garante que se o usuário não tem NENHUMA permissão do módulo, o item não aparece
        if (modulePrefix) {
          if (!hasAnyModulePermission(allPermissions, modulePrefix)) return false;
        }
        if (requiredPermissions && requiredPermissions.length > 0) {
          if (!hasRoutePermission(allPermissions, item.path, user)) return false;
        }
        if (item.submenu && item.submenu.length > 0) {
          const hasAnySubmenuPermission = item.submenu.some(sub =>
            hasRoutePermission(allPermissions, sub.path, user)
          );
          if (!hasAnySubmenuPermission) return false;
        }
        return true;
      })
      .map(item => {
        // Se tem submenu, filtrar os subitens baseado nas permissões
        if (item.submenu && item.submenu.length > 0) {
          const filteredSubmenu = item.submenu.filter(sub => 
            hasRoutePermission(allPermissions, sub.path, user)
          );
          return {
            ...item,
            submenu: filteredSubmenu,
          };
        }
        return item;
      });

    return filtered;
  }, [user]);

  // Mapeamento de rotas para breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ label: 'Dashboard', path: '/' }];

    if (path === '/') return [{ label: 'Dashboard', path: '/' }];

    // Mapeamento de rotas
    const routeMap: { [key: string]: string } = {
      '/pdv': 'PDV / Vendas',
      '/stores': 'Lojas / Unidades',
      '/stores/create': 'Nova Unidade',
      '/clients': 'Clientes',
      '/clients/create': 'Novo Cliente',
      '/clients/:id': 'Detalhes do Cliente',
      '/clients/:id/edit': 'Editar Cliente',
      '/vendedores': 'Vendedores',
      '/vendedores/create': 'Novo Vendedor',
      '/estoque': 'Estoque',
      '/fornecedores': 'Fornecedores',
      '/fornecedores/create': 'Novo Fornecedor',
      '/lenses': 'Lentes',
      '/lenses/create': 'Nova Lente',
      '/financeiro': 'Financeiro',
      '/financeiro/inadimplencias': 'Inadimplências',
      '/notas-fiscais': 'Notas Fiscais',
      '/pedidos': 'Ordens de Serviço',
      '/pedidos/laboratorio': 'Laboratório',
      '/pedidos/create': 'Nova OS',
      '/permissions': 'Permissões',
      '/users': 'Usuários',
      '/audit': 'Auditoria',
      '/trash': 'Lixeira',
    };

    // Detectar se é edição ou detalhes
    if (path.includes('/edit')) {
      const basePath = path.split('/edit')[0];
      const baseLabel = routeMap[basePath] || basePath.replace('/', '');
      crumbs.push({ label: baseLabel, path: basePath });
      crumbs.push({ label: 'Editar', path: path });
    } else if (path.match(/\/[^/]+\/[^/]+$/) && !path.includes('/create') && !path.includes('/laboratorio') && !path.includes('/inadimplencias') && !path.includes('/notas-fiscais')) {
      // Detectar detalhes (ex: /clients/:id)
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

  // Definir variáveis CSS para a cor do sistema
  useEffect(() => {
    const root = document.documentElement;
    const colorVars = generateColorVariables(storeColor);
    
    Object.entries(colorVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    return () => {
      // Limpar variáveis ao desmontar (opcional)
      Object.keys(colorVars).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [storeColor]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans min-h-0">
      {/* Header fixo */}
      <div className="p-4 sm:p-6 flex items-center gap-3 h-16 sm:h-20 shrink-0 border-b border-white/5">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
          style={{ backgroundColor: storeColor }}
        >
          <Store size={20} />
        </div>
        {(isSidebarOpen || isMobileMenuOpen) && (
          <span className="font-semibold text-lg tracking-tight whitespace-nowrap">
            {storeUnity || ''}
          </span>
        )}
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 min-h-0 scrollbar-hide">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => (
            <div key={item.title} className="group">
              {item.path === '/pdv' ? (
                <a
                  href="#/pdv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-between p-3 ${styles.button.default} cursor-pointer transition-all duration-300 ${
                    item.highlight ? 'border border-[var(--store-color-opacity-20)] text-[var(--store-color-dark)] hover:bg-[var(--store-color)] hover:text-white mb-2' : ''
                  } ${item.highlight && isActive(item.path, item.submenu) ? 'text-white border-transparent shadow-lg' : ''}`}
                  style={item.highlight && isActive(item.path, item.submenu) ? {
                    backgroundColor: 'var(--store-color)',
                    boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
                  } : item.highlight ? {
                    backgroundColor: 'var(--store-color-opacity-10)',
                  } : undefined}
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
                    item.highlight ? 'mb-2' : ''
                  } ${
                    isActive(item.path, item.submenu) && !item.highlight
                      ? 'text-white shadow-lg' 
                      : !item.highlight ? 'text-slate-400 hover:bg-white/5 hover:text-white' : ''
                  }`}
                  style={item.highlight && isActive(item.path, item.submenu) ? {
                    backgroundColor: 'var(--store-color)',
                    color: 'white',
                    borderColor: 'transparent',
                    boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
                  } : item.highlight ? {
                    backgroundColor: 'var(--store-color-opacity-10)',
                    borderColor: 'var(--store-color-opacity-20)',
                    color: 'var(--store-color-dark)',
                  } : isActive(item.path, item.submenu) ? {
                    backgroundColor: 'var(--store-color)',
                    boxShadow: '0 10px 15px -3px var(--store-color-opacity-10)',
                  } : undefined}
                  onMouseEnter={(e) => {
                    if (item.highlight && !isActive(item.path, item.submenu)) {
                      e.currentTarget.style.backgroundColor = 'var(--store-color)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (item.highlight && !isActive(item.path, item.submenu)) {
                      e.currentTarget.style.backgroundColor = 'var(--store-color-opacity-10)';
                      e.currentTarget.style.color = 'var(--store-color-dark)';
                    }
                  }}
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
                <div 
                  className="mt-1 ml-6 pl-4 border-l space-y-1 animate-in slide-in-from-top-2"
                  style={{ borderColor: 'var(--store-color-opacity-40)' }}
                >
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.title}
                      to={sub.path}
                      className={`flex items-center gap-2 p-2 text-xs font-medium ${styles.button.small} transition-all ${
                        location.pathname === sub.path ? 'text-white bg-white/5' : 'text-slate-500 hover:translate-x-1'
                      }
                      style={location.pathname !== sub.path ? { color: 'var(--store-color-opacity-50)' } : undefined}
                      onMouseEnter={(e) => {
                        if (location.pathname !== sub.path) {
                          e.currentTarget.style.color = 'var(--store-color)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== sub.path) {
                          e.currentTarget.style.color = 'var(--store-color-opacity-50)';
                        }
                      }}
                      }`}
                    >
                      <div 
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: location.pathname === sub.path ? 'var(--store-color)' : 'var(--store-color-opacity-50)' }}
                      ></div>
                      <span>{sub.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
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
              className="absolute -right-3 top-10 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white z-50"
              style={{ backgroundColor: 'var(--store-color)' }}
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
                <div className="flex flex-col h-full bg-slate-950 text-white font-sans min-h-0">
                  <div className="p-4 sm:p-6 flex items-center justify-between h-16 sm:h-20 shrink-0 border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
                        style={{ backgroundColor: storeColor }}
                      >
                        <Store size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-lg tracking-tight whitespace-nowrap block">
                          REI DO <span className="uppercase" style={{ color: storeColor }}>Óculos</span>
                        </span>
                        {user && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] truncate">
                              {selectedStore?.unity || selectedStore?.name || 'Nenhuma unidade'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:bg-red-600/10 hover:text-red-500 transition-all rounded-lg border border-transparent hover:border-red-600/20"
                        title="Sair"
                      >
                        <LogOut size={18} />
                      </button>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <SidebarContent />
                  </div>
                </div>
              </aside>
            </>
          )}
        </>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${isPDVPage ? 'w-full' : ''}`}>
        {!isPDVPage && (
          <header className="bg-white border-b border-gray-100 shrink-0 z-40">
          {/* Tudo na mesma linha: Horário + Breadcrumbs à esquerda | Seletor de Loja + Notificação + Usuário à direita */}
          <div className="min-h-14 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 lg:px-10 py-2 sm:py-0 gap-2 sm:gap-0">
            {/* Esquerda: Horário + Breadcrumbs */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0 flex-1">
              {/* Botão Menu Mobile */}
              <button 
                className={`lg:hidden p-2 sm:p-2.5 text-slate-600 bg-slate-50 ${styles.button.default} transition-all shrink-0`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
                  e.currentTarget.style.color = 'var(--store-color-dark)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = '';
                }}
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={18} className="sm:w-5 sm:h-5" />
              </button>
              
              {/* Horário */}
              <div className="hidden sm:flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-600 shrink-0">
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
            
            {/* Direita: Seletor de Loja + Notificação + Usuário */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Seletor de Loja */}
              {availableStores.length > 1 && (
                <div className="relative" ref={storeDropdownRef}>
                  <button
                    onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                  >
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: storeColor }}
                    ></div>
                    <span className="text-xs font-semibold text-slate-700 hidden sm:block">
                      {selectedStore ? (selectedStore.fancy_name || selectedStore.name) : 'Selecione'}
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${storeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {storeDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        {availableStores.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => {
                              setSelectedStore(store);
                              setStoreDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                              selectedStore?.id === store.id
                                ? 'bg-slate-50'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm shrink-0"
                              style={{ backgroundColor: store.color || '#dc2626' }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {store.fancy_name || store.name}
                              </p>
                              {store.fancy_name && (
                                <p className="text-[10px] text-slate-500 truncate">{store.name}</p>
                              )}
                            </div>
                            {selectedStore?.id === store.id && (
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: store.color || '#dc2626' }}></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Mostrar loja única */}
              {availableStores.length === 1 && selectedStore && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: storeColor }}
                  >
                    <Store size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden sm:block">
                    {selectedStore.fancy_name || selectedStore.name}
                  </span>
                </div>
              )}

              {/* Notificação e Usuário */}
              <div className={`flex items-center bg-slate-50 p-1 sm:p-1.5 ${styles.button.default} border border-slate-100`}>
                <button 
                  className="p-1.5 sm:p-2 text-slate-400 transition-colors relative"
                  style={{ color: 'var(--store-color-opacity-50)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--store-color-dark)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--store-color-opacity-50)';
                  }}
                >
                  <Bell size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span 
                    className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border-2 border-white"
                    style={{ backgroundColor: 'var(--store-color)' }}
                  ></span>
                </button>
                <div className="w-px h-5 sm:h-6 bg-slate-200 mx-0.5 sm:mx-1"></div>
                <UserDropdown user={user} onLogout={onLogout} />
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
