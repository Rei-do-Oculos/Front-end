
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
  Eye,
  Target,
  Store,
  Truck,
  ShoppingCart,
  Building2,
  ShieldCheck,
  FlaskConical,
  Glasses,
  User,
  KeyRound,
  Home,
  Clock,
  Calendar
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
    path: '/pdv'
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
    path: '/stock',
    submenu: [
      { title: 'Armações', path: '/frames' },
      { title: 'Tipos de Armação', path: '/frame-types' },
      { title: 'Transferências', path: '/transfers' },
      { title: 'Relatórios', path: '/stock/reports' }
    ]
  },
  // CRUD Lentes oculto no front por enquanto (opcional na OS)
  // { title: 'Lentes', icon: <Glasses size={20} />, path: '/lenses' },
  { 
    title: 'Laboratórios', 
    icon: <FlaskConical size={20} />, 
    path: '/laboratories',
    submenu: [
      { title: 'Laboratórios', path: '/laboratories' },
      { title: 'Lentes/Produtos', path: '/laboratory-lenses' }
    ]
  },
  { 
    title: 'Financeiro', 
    icon: <DollarSign size={20} />, 
    path: '/finance',
    submenu: [
      { title: 'Fluxo de Caixa', path: '/finance' },
      { title: 'Faturamento operacional', path: '/finance/operational' },
      { title: 'Despesas', path: '/finance/expenses' },
      { title: 'Despesas administrativas', path: '/finance/admin-expenses' },
      { title: 'Inadimplências', path: '/finance/overdue' },
      { title: 'Notas Fiscais', path: '/invoices' }
    ]
  },
  { 
    title: 'Pedidos (OS)', 
    icon: <ClipboardList size={20} />, 
    path: '/service-orders',
    submenu: [
      { title: 'Listagem', path: '/service-orders' },
      { title: 'OS Laboratório', path: '/service-orders/lab' }
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

interface SidebarContentProps {
  filteredMenuItems: MenuItem[];
  openSubmenus: string[];
  toggleSubmenu: (title: string) => void;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  storeColor: string;
  storeUnity: string | null;
  storeDisplayName: string | null;
  isActive: (path: string, submenu?: { title: string; path: string }[]) => boolean;
  onCloseMobile?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  filteredMenuItems,
  openSubmenus,
  toggleSubmenu,
  isSidebarOpen,
  isMobileMenuOpen,
  storeColor,
  storeUnity,
  storeDisplayName,
  isActive,
  onCloseMobile,
}) => {
  const location = useLocation();
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans min-h-0">
      <div className="p-4 sm:p-6 flex items-center justify-between gap-3 h-16 sm:h-20 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: storeColor }}
          >
            <Store size={20} />
          </div>
          {(isSidebarOpen || isMobileMenuOpen) && (
            <span className="font-semibold text-lg tracking-tight whitespace-nowrap">
              {storeUnity || storeDisplayName || ''}
            </span>
          )}
        </div>
        {isMobileMenuOpen && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg shrink-0"
            title="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-6 min-h-0">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => (
            <div key={item.title} className="group">
              <Link
                to={item.path}
                onClick={(e) => {
                  if (item.submenu) {
                    e.preventDefault();
                    toggleSubmenu(item.title);
                  }
                }}
                className={`w-full flex items-center justify-between p-3 ${styles.button.default} cursor-pointer transition-all duration-300 mb-2 ${
                  isActive(item.path, item.submenu) ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                style={isActive(item.path, item.submenu) ? {
                  backgroundColor: 'var(--store-color)',
                  boxShadow: '0 10px 15px -3px var(--store-color-opacity-10)',
                } : undefined}
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
                <div 
                  className="mt-1 ml-6 pl-4 border-l space-y-1 animate-in slide-in-from-top-2"
                  style={{ borderColor: 'var(--store-color-opacity-40)' }}
                >
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.title}
                      to={sub.path}
                      className={`flex items-center gap-2 p-2 text-xs font-medium ${styles.button.small} transition-all text-white ${
                        location.pathname === sub.path ? 'bg-white/5' : 'hover:translate-x-1'
                      }`}
                      onMouseEnter={(e) => {
                        if (location.pathname !== sub.path) {
                          e.currentTarget.style.color = 'var(--store-color)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== sub.path) {
                          e.currentTarget.style.color = 'white';
                        }
                      }}
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
};

// Componente de Dropdown do Usuário
const UserDropdown: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm border border-black/5"
                style={{ backgroundColor: 'var(--store-color, #dc2626)' }}
                role="img"
                aria-label={user?.name ? `Usuário ${user.name}` : 'Usuário'}
              >
                <User size={20} strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
          
          {/* Meu Perfil */}
          <div className="p-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-all rounded-lg"
            >
              <User size={16} />
              <span className="font-medium">Meu perfil</span>
            </button>
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
  const isSheetPage = location.pathname.includes('/service-orders/') && location.pathname.endsWith('/sheet');
  const isReceiptPage = location.pathname.includes('/service-orders/') && location.pathname.endsWith('/receipt');
  const isInvoiceDetailPage = /^\/invoices\/[^/]+$/.test(location.pathname);
  const { selectedStore, availableStores, setSelectedStore, storeColor, storeUnity, storeDisplayName } = useStore();
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
    // Para itens com submenu, usar array de prefixos para verificar qualquer um deles
    const routeToModuleMap: Record<string, string | string[]> = {
      '/clients': 'clients',
      '/stores': 'stores',
      '/lenses': 'lenses',
      '/frame-types': 'frame-types',
      '/frames': 'frames',
      '/transfers': 'store-frames',
      '/users': 'users',
      '/audit': 'audits',
      '/suppliers': 'suppliers',
      // Itens com submenu que têm múltiplos módulos
      '/stock': ['frames', 'frame-types', 'store-frames', 'stock-reports'],
      '/laboratories': ['laboratories', 'laboratory-lenses'],
      '/permissions': ['roles', 'permissions', 'users', 'audits', 'trash'], // Sistema
      '/service-orders': ['service-orders', 'service-orders-lab'], // Pedidos (OS)
      '/finance': ['finance', 'service-orders-overdue', 'expenses', 'expenses-admin', 'invoices'],
      '/pdv': 'pdv',
      // Módulos ainda sem permissões específicas (públicos por enquanto)
      '/orders': [],
      '/chat': [],
    };

    // Filtrar e mapear itens do menu
    const filtered = menuItems
      .filter(item => {
        const requiredPermissions = routePermissionMap[item.path];
        const modulePrefix = routeToModuleMap[item.path];
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        
        // DEBUG: Log para itens com submenu problemáticos
        if (hasSubmenu && item.path === '/service-orders') {
          console.log('[Layout] 🔍 Verificando item do menu:', {
            itemPath: item.path,
            itemTitle: item.title,
            submenuItems: item.submenu?.map(s => ({ path: s.path, title: s.title })),
            modulePrefix,
            allPermissions: allPermissions.map(p => typeof p === 'string' ? p : p.name),
          });
        }
        
        // Se há um prefixo de módulo mapeado, verificar PRIMEIRO se o usuário tem pelo menos uma permissão desse módulo
        // Isso garante que se o usuário não tem NENHUMA permissão do módulo, o item não aparece
        if (modulePrefix) {
          // Suporte para múltiplos prefixos (ex: Estoque pode ter frames, frame-types, store-frames)
          if (Array.isArray(modulePrefix)) {
            // Array vazio significa público (sem verificação de módulo)
            if (modulePrefix.length > 0) {
              // Se é um array com prefixos, verificar se o usuário tem permissão em QUALQUER um dos módulos
              const hasAnyModule = modulePrefix.some(prefix => 
                hasAnyModulePermission(allPermissions, prefix)
              );
              
              // DEBUG para service-orders
              if (item.path === '/service-orders') {
                console.log('[Layout] 🔍 Verificação de módulo:', {
                  modulePrefix,
                  hasAnyModule,
                  moduleChecks: modulePrefix.map(prefix => ({
                    prefix,
                    hasPermission: hasAnyModulePermission(allPermissions, prefix),
                  })),
                });
              }
              
              if (!hasAnyModule) return false;
            }
            // Se array vazio, não faz verificação (público)
          } else {
            if (!hasAnyModulePermission(allPermissions, modulePrefix)) return false;
          }
        }
        
        // Para itens COM submenu: verificar se tem acesso a pelo menos um subitem
        // NÃO verificar requiredPermissions do item pai - o pai aparece se algum filho tiver permissão
        if (hasSubmenu) {
          const submenuPermissions = item.submenu!.map(sub => ({
            path: sub.path,
            hasPermission: hasRoutePermission(allPermissions, sub.path, user),
          }));
          
          const hasAnySubmenuPermission = submenuPermissions.some(sp => sp.hasPermission);
          
          // DEBUG para service-orders
          if (item.path === '/service-orders') {
            console.log('[Layout] 🔍 Verificação de submenu:', {
              submenuPermissions,
              hasAnySubmenuPermission,
            });
          }
          
          if (!hasAnySubmenuPermission) return false;
          
          // IMPORTANTE: Se tem submenu, também verificar se após filtrar os subitens ainda há algum
          // Isso garante que se o usuário não tem permissão para NENHUM subitem, o item pai não aparece
          const filteredSubmenu = item.submenu!.filter(sub => 
            hasRoutePermission(allPermissions, sub.path, user)
          );
          
          if (filteredSubmenu.length === 0) {
            // DEBUG
            if (item.path === '/service-orders') {
              console.log('[Layout] ❌ Item removido: nenhum subitem válido após filtrar');
            }
            return false;
          }
        } else {
          // Para itens SEM submenu: verificar requiredPermissions normalmente
          if (requiredPermissions && requiredPermissions.length > 0) {
            if (!hasRoutePermission(allPermissions, item.path, user)) return false;
          }
        }
        
        return true;
      })
      .map(item => {
        // Se tem submenu, filtrar os subitens baseado nas permissões
        if (item.submenu && item.submenu.length > 0) {
          const filteredSubmenu = item.submenu.filter(sub => {
            const hasPerm = hasRoutePermission(allPermissions, sub.path, user);
            
            // DEBUG para service-orders
            if (item.path === '/service-orders') {
              console.log('[Layout] 🔍 Filtrando subitem:', {
                subPath: sub.path,
                subTitle: sub.title,
                hasPermission: hasPerm,
              });
            }
            
            return hasPerm;
          });
          
          // DEBUG para service-orders
          if (item.path === '/service-orders') {
            console.log('[Layout] 📋 Resultado do filtro de submenu:', {
              originalCount: item.submenu.length,
              filteredCount: filteredSubmenu.length,
              filteredItems: filteredSubmenu.map(s => ({ path: s.path, title: s.title })),
            });
          }
          
          // Se após filtrar não sobrou nenhum subitem, não retornar o item pai
          if (filteredSubmenu.length === 0) {
            if (item.path === '/service-orders') {
              console.log('[Layout] ❌ Item removido: nenhum subitem válido após filtrar');
            }
            return null;
          }
          return {
            ...item,
            submenu: filteredSubmenu,
          };
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);

    return filtered;
  }, [user]);

  // Atualizar data e hora (horário de Brasília)
  const BRASILIA_TZ = 'America/Sao_Paulo';
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRASILIA_TZ,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRASILIA_TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentDate(dateFormatter.format(now));
      setCurrentTime(timeFormatter.format(now));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

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

  // Bloquear scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

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

  const sidebarContentProps: SidebarContentProps = {
    filteredMenuItems,
    openSubmenus,
    toggleSubmenu,
    isSidebarOpen,
    isMobileMenuOpen,
    storeColor,
    storeUnity,
    storeDisplayName,
    isActive,
  };

  const isPDVPage = location.pathname === '/pdv';

  return (
    <div className={`flex h-screen bg-[#f8f9fc] overflow-hidden font-sans text-slate-900 ${isSheetPage || isReceiptPage ? 'print-sheet-page' : ''} ${isInvoiceDetailPage ? 'print-invoice-detail-page' : ''}`}>
      {!isPDVPage && (
        <>
          {/* Sidebar Desktop */}
          <aside 
            className={`hidden lg:flex flex-col h-screen shrink-0 shadow-2xl transition-all duration-500 ease-in-out relative ${
              isSidebarOpen ? 'w-72' : 'w-24'
            }`}
          >
            <SidebarContent {...sidebarContentProps} />
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
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <SidebarContent 
                      {...sidebarContentProps} 
                      onCloseMobile={() => setIsMobileMenuOpen(false)} 
                    />
                  </div>
                </div>
              </aside>
            </>
          )}
        </>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${isPDVPage ? 'w-full' : ''}`}>
        {!isPDVPage && (
          <header className="bg-white border-b border-gray-100 shrink-0 z-40 sticky top-0">
          <div className="min-h-14 flex flex-row items-center justify-between px-3 sm:px-6 lg:px-10 py-2 gap-2 sm:gap-4">
            {/* Esquerda: Botão Menu Mobile + Nome loja | Horário */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0 flex-1">
              {/* Botão Menu Mobile - Toggle sidebar (visível em mobile/tablet < 1024px) */}
              <button 
                className="lg:hidden flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] p-2.5 text-white font-semibold border-2 shadow-lg active:scale-95 transition-all shrink-0"
                style={{ 
                  backgroundColor: 'var(--store-color)', 
                  borderColor: 'var(--store-color)',
                }}
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menu"
                title="Abrir menu"
              >
                <Menu size={22} className="sm:w-6 sm:h-6" />
              </button>
              
              {/* Nome fantasia da loja - visível apenas no mobile */}
              <span className="lg:hidden text-sm font-semibold text-slate-800 truncate min-w-0 flex-1 ml-1">
                {storeDisplayName || ''}
              </span>
              
              {/* Horário - oculto em mobile, visível em sm+ */}
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
            
            {/* Direita: Seletor de Loja + Usuário */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Seletor de Loja */}
              {availableStores.length > 1 && (
                <div className="relative" ref={storeDropdownRef}>
                  <button
                    onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                  >
                    <Store size={16} className="text-slate-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 hidden sm:block">
                      {storeDisplayName || 'Selecione'}
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
                            <Store size={18} className="text-slate-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {store.name}
                              </p>
                              {store.fancy_name && (
                                <p className="text-[10px] text-slate-500 truncate">{store.fancy_name}</p>
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
              
              {/* Mostrar loja única - mesmo estilo visual do seletor */}
              {availableStores.length === 1 && selectedStore && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <Store size={16} className="text-slate-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">
                    {storeDisplayName || ''}
                  </span>
                </div>
              )}
              
              {/* Fallback: Se não tem lojas disponíveis mas está logado, mostrar indicador */}
              {availableStores.length === 0 && user && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Store size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">
                    Sem loja vinculada
                  </span>
                </div>
              )}

              {/* Usuário */}
              <div className={`flex items-center bg-slate-50 p-1 sm:p-1.5 ${styles.button.default} border border-slate-100`}>
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
