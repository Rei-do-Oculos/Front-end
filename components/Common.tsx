
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon, Filter, ChevronDown, X, Search, ChevronDown as ChevronDownIcon, AlertTriangle, Info, CheckCircle2, Trash2, ArrowUp, ArrowDown, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { styles } from '../config/styles';

/**
 * Card padrão de "Acesso Negado" – exibido quando o usuário não tem permissão
 * ou quando a API retorna 403. Reutilizado em ProtectedRoute e em listagens.
 */
export const AccessDeniedCard: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
            <ShieldCheck size={40} style={{ color: 'var(--store-color)' }} />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
          <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

/**
 * Badge de filtros ativos - Componente padronizado
 * Mostra a quantidade de filtros aplicados
 */
export const ActiveFiltersBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <div className="flex items-center gap-2">
      <span 
        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
        style={{
          backgroundColor: 'var(--store-color-light)',
          color: 'var(--store-color-dark)',
        }}
      >
        <Search size={12} className="mr-1.5" />
        {count} {count === 1 ? 'filtro ativo' : 'filtros ativos'}
      </span>
    </div>
  );
};

export type SortDirection = 'asc' | 'desc' | null;

export interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: string | null;
  currentDirection?: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
  className?: string;
}

/**
 * Sortable Header Component
 * Reusable component for table headers with sorting functionality
 */
export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className = '',
}) => {
  const handleClick = () => {
    if (currentSort === sortKey) {
      // Alternar entre asc e desc quando já está ordenado por este campo
      if (currentDirection === 'asc') {
        onSort(sortKey, 'desc');
      } else {
        onSort(sortKey, 'asc');
      }
    } else {
      // Novo campo, começar com asc
      onSort(sortKey, 'asc');
    }
  };

  const isActive = currentSort === sortKey;
  const Icon = isActive 
    ? (currentDirection === 'asc' ? ArrowUp : ArrowDown)
    : ArrowUpDown;

  return (
    <th
      className={`text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <Icon 
          size={14} 
          className={`transition-colors ${
            isActive 
              ? 'text-slate-700' 
              : 'text-slate-300'
          }`}
          style={isActive ? {
            color: 'var(--store-color)',
          } : undefined}
        />
      </div>
    </th>
  );
};

export interface PaginationProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPage?: number;
  itemName?: string;
}

/**
 * Pagination Component
 * Reusable pagination component for all lists
 */
export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onPerPageChange,
  perPage = 15,
  itemName = 'itens',
}) => {
  if (!pagination) {
    return null;
  }

  // Construir lista de páginas: 1 2 3 ... [atual±1] ... 148 149 150
  const total = pagination.totalPages;
  const current = pagination.currentPage;
  const edgeCount = 3; // primeiras e últimas N páginas sempre visíveis

  const buildPageItems = (): (number | 'ellipsis')[] => {
    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const result: (number | 'ellipsis')[] = [];

    // 1, 2, 3
    for (let i = 1; i <= Math.min(edgeCount, total); i++) result.push(i);

    const midStart = Math.max(edgeCount + 1, current - 1);
    const midEnd = Math.min(total - edgeCount, current + 1);

    if (midStart > edgeCount + 1) result.push('ellipsis');
    for (let i = midStart; i <= midEnd; i++) {
      if (i >= 1 && i <= total) result.push(i);
    }
    if (midEnd < total - edgeCount) result.push('ellipsis');

    // Últimas 3 (ex: 148, 149, 150)
    for (let i = Math.max(1, total - edgeCount + 1); i <= total; i++) {
      if (!result.includes(i)) result.push(i);
    }

    return result;
  };

  const pageItems = buildPageItems();

  const perPageOptions = [
    { label: '10', value: '10' },
    { label: '20', value: '20' },
    { label: '50', value: '50' },
    { label: '100', value: '100' },
  ];

  return (
    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="flex items-center gap-2 flex-wrap">
        {pagination.totalPages > 1 && (
          <>
            <button
              onClick={() => onPageChange(Math.max(1, current - 1))}
              disabled={current <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Página anterior"
            >
              ‹
            </button>
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs px-1">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all ${
                    current === item ? 'text-white' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  style={current === item ? { backgroundColor: 'var(--store-color)' } : undefined}
                >
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(Math.min(total, current + 1))}
              disabled={current >= total}
              className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Próxima página"
            >
              ›
            </button>
          </>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {pagination.totalPages > 1 && `Página ${pagination.currentPage} de ${pagination.totalPages} • `}
        {pagination.totalItems} {itemName}
      </p>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; subtitle?: string }> = ({ children, className = "", title, subtitle }) => (
  <div className={`bg-white ${styles.card.default} border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    {(title || subtitle) && (
      <div className="px-5 py-4 lg:px-8 lg:py-6 border-b border-gray-50/50">
        {title && <h3 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs lg:text-sm text-slate-400 font-medium mt-1">{subtitle}</p>}
      </div>
    )}
    <div className="p-5 lg:p-8">
      {children}
    </div>
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' }> = ({ children, className = "", variant = "primary", style, ...props }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--store-color)',
          color: 'white',
          boxShadow: '0 10px 15px -3px var(--store-color-opacity-20), 0 4px 6px -2px var(--store-color-opacity-10)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: 'var(--store-color)',
          color: 'var(--store-color)',
          borderWidth: '2px',
        };
      default:
        return {};
    }
  };

  const baseClassName = variant === 'primary' 
    ? "text-white active:scale-95 shadow-lg hover:opacity-90"
    : variant === 'outline'
    ? "bg-transparent border-2 active:scale-95 hover:bg-[var(--store-color-light)]"
    : variant === 'secondary'
    ? "bg-slate-950 text-white hover:bg-slate-900 active:scale-95"
    : variant === 'ghost'
    ? "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200";

  return (
    <button 
      className={`px-4 py-2 lg:px-6 lg:py-2.5 ${styles.button.default} font-semibold text-xs lg:text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${baseClassName} ${className}`}
      style={{
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = "", style, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  // Renderizar label com asterisco vermelho se houver
  const renderLabel = () => {
    if (!label) return null;
    
    if (label.includes('*')) {
      const parts = label.split('*');
      return (
        <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
          {parts[0]}
          <span className="text-red-500">*</span>
          {parts[1]}
        </label>
      );
    }
    
    return <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>;
  };

  return (
    <div className="space-y-1.5 lg:space-y-2 w-full">
      {renderLabel()}
      <input 
        className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 ${styles.input.default} bg-gray-50 border-2 border-slate-200 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-gray-400 disabled:text-slate-800 disabled:bg-slate-50 ${className}`}
        style={{
          borderColor: error 
            ? 'var(--store-color)' 
            : isFocused 
              ? 'var(--store-color)' 
              : undefined,
          backgroundColor: isFocused ? 'white' : undefined,
          boxShadow: isFocused && !error ? '0 0 0 4px var(--store-color-opacity-5)' : undefined,
          ...style,
        } as React.CSSProperties}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <p className="text-[10px] font-medium ml-1" style={{ color: 'var(--store-color)' }}>{error}</p>}
    </div>
  );
};

// NumberInput - Campo numérico com setas para incrementar/decrementar
export const NumberInput: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  error?: string;
  className?: string;
}> = ({ label, value, onChange, onBlur, min, max, step = 0.25, placeholder, error, className = "" }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir apenas caracteres válidos para números decimais
    let val = e.target.value;
    // Substituir ponto por vírgula para manter formato brasileiro
    val = val.replace('.', ',');
    // Filtrar caracteres inválidos: permitir números, vírgula e sinal no início
    let filtered = '';
    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      if (i === 0 && (char === '-' || char === '+')) {
        filtered += char;
      } else if (/[\d,]/.test(char)) {
        // Só permite uma vírgula
        if (char === ',' && filtered.includes(',')) continue;
        filtered += char;
      }
    }
    onChange(filtered);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      // Passar o valor atual do state (props), não do input
      onBlur(value);
    }
  };

  return (
    <div className={`space-y-1.5 lg:space-y-2 w-full ${className}`}>
      {label && (
        <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 ${styles.input.default} bg-gray-50 border-2 border-slate-200 text-sm font-medium transition-all outline-none`}
        style={{
          borderColor: error 
            ? 'var(--store-color)' 
            : isFocused 
              ? 'var(--store-color)' 
              : '#e2e8f0',
          backgroundColor: isFocused ? 'white' : undefined,
          boxShadow: isFocused && !error ? '0 0 0 4px var(--store-color-opacity-5)' : undefined,
        }}
      />
      {error && <p className="text-[10px] font-medium ml-1" style={{ color: 'var(--store-color)' }}>{error}</p>}
    </div>
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { label: string; value: string }[] }> = ({ label, options, className = "", ...props }) => (
  <div className="space-y-1.5 lg:space-y-2 w-full">
    {label && <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 ${styles.input.default} bg-gray-50 border-2 border-slate-200 text-sm font-medium transition-all outline-none appearance-none ${className}`}
        style={{
          '--focus-border': 'var(--store-color)',
          '--focus-ring': 'var(--store-color-opacity-5)',
        } as React.CSSProperties}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--store-color)';
          e.currentTarget.style.boxShadow = '0 0 0 4px var(--store-color-opacity-5)';
          e.currentTarget.style.backgroundColor = 'white';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.backgroundColor = '';
        }}
        {...props}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
         <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
      </div>
    </div>
  </div>
);

export const StatCard: React.FC<{ title: string; value: string | number; icon: LucideIcon; color?: string; trend?: string }> = ({ title, value, icon: Icon, color = "red", trend }) => (
  <div className={`bg-white p-5 lg:p-8 ${styles.card.default} border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
    
    <div className="flex items-center justify-between mb-4 lg:mb-8">
      <div className={`p-3 lg:p-4 ${styles.button.small} bg-${color}-600/10 text-${color}-600`}>
        <Icon size={20} className="lg:w-6 lg:h-6" strokeWidth={2} />
      </div>
      {trend && (
        <span className={`text-[10px] lg:text-xs font-semibold px-2 py-0.5 lg:px-3 lg:py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
    
    <div>
      <p className="text-[9px] lg:text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info' }> = ({ children, variant = 'primary' }) => {
  const variants = {
    primary: "bg-indigo-100 text-indigo-700",
    danger: "bg-red-100 text-red-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-sky-100 text-sky-700",
  };

  return (
    <span className={`px-2.5 py-1 ${styles.badge.default} text-[10px] font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

export const MultiSelect: React.FC<{
  label?: string;
  options: { label: string; value: string; selectedLabel?: string }[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
}> = ({ label, options, value = [], onChange, placeholder = "Selecione...", searchable = true, disabled = false, disabledMessage, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setSearch('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  const filteredOptions = searchable && search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const dropdownContent = isOpen ? (
    <>
      <div
        className="fixed inset-0 z-[100]"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={dropdownRef}
        className="fixed z-[110] bg-white border border-gray-100 rounded-lg shadow-lg max-h-72 overflow-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 text-center">
            {search ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
          </div>
        ) : (
          filteredOptions.map(option => (
            <div
              key={option.value}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
              style={{
                backgroundColor: value.includes(option.value) ? 'var(--store-color-light)' : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value.includes(option.value) ? 'var(--store-color-light)' : '';
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleOption(option.value);
              }}
            >
              <div 
                className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: value.includes(option.value) ? 'var(--store-color)' : '#d1d5db',
                  backgroundColor: value.includes(option.value) ? 'var(--store-color)' : 'transparent',
                }}
              >
                {value.includes(option.value) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-700">{option.label}</span>
            </div>
          ))
        )}
      </div>
    </>
  ) : null;

  const renderLabel = () => {
    if (!label) return null;
    if (label.includes('*')) {
      const [before, after] = label.split('*');
      return (
        <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
          {before}<span className="text-red-500">*</span>{after}
        </label>
      );
    }
    return <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>;
  };

  return (
    <div className="space-y-1.5 lg:space-y-2 w-full relative">
      {label && renderLabel()}
      <div className="relative">
        <div
          ref={buttonRef}
          onClick={() => !disabled && !isOpen && setIsOpen(true)}
          className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 ${styles.input.default} bg-gray-50 border-2 text-sm font-medium transition-all outline-none text-left flex items-center justify-between min-h-[48px] ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'bg-white ring-2' : ''} ${error ? 'border-red-500' : 'border-slate-200'}`}
          style={{
            borderColor: error ? '#ef4444' : (isOpen ? 'var(--store-color)' : undefined),
            '--tw-ring-color': 'var(--store-color-opacity-20)',
          } as React.CSSProperties}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 items-center">
            {disabled && disabledMessage ? (
              <span className="text-gray-400 italic">{disabledMessage}</span>
            ) : isOpen && searchable ? (
              <>
                {value.map(val => {
                  const option = options.find(opt => opt.value === val);
                  return option ? (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--store-color-light)',
                        color: 'var(--store-color-dark)',
                      }}
                    >
                      {option.selectedLabel ?? option.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(val);
                        }}
                        className="hover:opacity-80"
                        style={{ color: 'var(--store-color-dark)' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : null;
                })}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={value.length === 0 ? "Buscar..." : ""}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-slate-700 placeholder-gray-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            ) : value.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              value.map(val => {
                const option = options.find(opt => opt.value === val);
                return option ? (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--store-color-light)',
                      color: 'var(--store-color-dark)',
                    }}
                  >
                    {option.selectedLabel ?? option.label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(val);
                        }}
                        className="hover:opacity-80"
                        style={{ color: 'var(--store-color-dark)' }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ) : null;
              })
            )}
          </div>
          {!disabled && (
            <ChevronDownIcon 
              size={16} 
              className={`text-gray-400 transition-transform flex-shrink-0 cursor-pointer ${isOpen ? 'rotate-180' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            />
          )}
        </div>
        
        {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
      </div>
      {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
};

/**
 * SingleSelect - Baseado no MultiSelect mas permite apenas 1 seleção
 * Usa as cores do sistema (var(--store-color))
 */
export const SingleSelect: React.FC<{
  label?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  /** Chamado quando o usuário digita na busca (para busca remota na API) */
  onSearch?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}> = ({ label, options, value = '', onChange, placeholder = "Selecione...", searchable = false, onSearch, error, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectOption = (optionValue: string) => {
    onChange(value === optionValue ? '' : optionValue);
    setIsOpen(false);
    setSearch('');
  };
 
  const removeOption = () => {
    onChange('');
  };

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setSearch('');
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const dropdownContent = isOpen ? (
    <>
      <div
        className="fixed inset-0 z-[100]"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={dropdownRef}
        className="fixed z-[110] bg-white border border-gray-100 rounded-lg shadow-lg max-h-72 overflow-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 text-center">
            {search ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
          </div>
        ) : (
          filteredOptions.map(option => (
            <div
              key={option.value}
              className="px-4 py-2.5 cursor-pointer transition-colors"
              style={{
                backgroundColor: value === option.value ? 'var(--store-color-light)' : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value === option.value ? 'var(--store-color-light)' : '';
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                selectOption(option.value);
              }}
            >
              <span className="text-sm text-slate-700">{option.label}</span>
            </div>
          ))
        )}
      </div>
    </>
  ) : null;

  const renderLabel = () => {
    if (!label) return null;
    if (label.includes('*')) {
      const [before, after] = label.split('*');
      return (
        <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
          {before}<span className="text-red-500">*</span>{after}
        </label>
      );
    }
    return <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>;
  };

  return (
    <div className="space-y-1.5 lg:space-y-2 w-full relative">
      {label && renderLabel()}
      <div className="relative">
        <div
          ref={buttonRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 ${styles.input.default} bg-gray-50 border-2 text-sm font-medium transition-all outline-none text-left flex items-center justify-between min-h-[48px] ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'bg-white ring-2' : ''} ${error ? 'border-red-500' : 'border-slate-200'}`}
          style={{
            borderColor: error ? '#ef4444' : (isOpen ? 'var(--store-color)' : undefined),
            '--tw-ring-color': 'var(--store-color-opacity-20)',
          } as React.CSSProperties}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 items-center">
            {isOpen && searchable ? (
              <>
                {selectedOption && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--store-color-light)',
                      color: 'var(--store-color-dark)',
                    }}
                  >
                    {selectedOption.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption();
                      }}
                      className="hover:opacity-80"
                      style={{ color: 'var(--store-color-dark)' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={!selectedOption ? "Buscar..." : ""}
                  value={search}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearch(v);
                    onSearch?.(v);
                  }}
                  className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-slate-700 placeholder-gray-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            ) : !value || !selectedOption ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${disabled ? 'bg-slate-100 text-slate-900' : ''}`}
                style={disabled ? undefined : {
                  backgroundColor: 'var(--store-color-light)',
                  color: 'var(--store-color-dark)',
                }}
              >
                {selectedOption.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption();
                    }}
                    className="hover:opacity-80"
                    style={{ color: 'var(--store-color-dark)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            )}
          </div>
          {!disabled && (
            <ChevronDownIcon 
              size={16} 
              className={`text-gray-400 transition-transform flex-shrink-0 cursor-pointer ${isOpen ? 'rotate-180' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            />
          )}
        </div>
        
        {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
      </div>
      {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'confirm' | 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  confirmVariant?: 'primary' | 'danger' | 'success';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  showCancel = true,
  icon,
  children,
  size = 'md',
  confirmVariant = 'primary',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const typeConfig = {
    confirm: {
      icon: icon || <AlertTriangle className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-50',
      defaultTitle: 'Confirmar ação',
    },
    info: {
      icon: icon || <Info className="w-6 h-6 text-blue-600" />,
      iconBg: 'bg-blue-50',
      defaultTitle: 'Informação',
    },
    success: {
      icon: icon || <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      defaultTitle: 'Sucesso',
    },
    warning: {
      icon: icon || <AlertTriangle className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-50',
      defaultTitle: 'Atenção',
    },
    danger: {
      icon: icon || <Trash2 className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-red-50',
      defaultTitle: 'Confirmar exclusão',
    },
  };

  const config = typeConfig[type];
  const modalTitle = title || config.defaultTitle;

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error('Error confirming:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const confirmButtonVariants = {
    primary: {
      backgroundColor: 'var(--store-color)',
      color: 'white',
    },
    danger: {
      backgroundColor: 'var(--store-color)',
      color: 'white',
    },
    success: {
      backgroundColor: 'rgb(16 185 129)',
      color: 'white',
    },
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 min-h-screen max-h-[100dvh] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      {/* Backdrop - cobre toda a viewport incluindo header */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />
      
      {/* Modal - em mobile ocupa a base da tela (estilo bottom sheet), em desktop centralizado */}
      <div 
        className={`relative z-[101] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-h-[90vh] max-h-[85dvh] flex flex-col ${sizeClasses[size]} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start gap-3 sm:gap-4 shrink-0">
          <div className={`${config.iconBg} p-3 rounded-xl shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
              {modalTitle}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - scrollável em mobile quando longo */}
        {children && (
          <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>
        )}

        {/* Footer - só mostra se houver onConfirm ou se não houver children */}
        {(onConfirm || (!children && confirmText)) && (
          <div className="px-4 sm:px-6 py-4 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
            {showCancel && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${confirmButtonVariants[confirmVariant]}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export const FilterSection: React.FC<{ children: React.ReactNode; onApply?: () => void; onClear?: () => void }> = ({ children, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-6 py-3 ${styles.button.default} font-bold text-[10px] uppercase tracking-widest transition-all border ${
          isOpen ? 'text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
        }`}
        style={isOpen ? {
          backgroundColor: 'var(--store-color)',
          borderColor: 'var(--store-color)',
          boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
        } : undefined}
      >
        <Filter size={14} />
        {isOpen ? 'Fechar Filtros' : 'Filtros Avançados'}
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`bg-slate-50/50 border border-slate-100 ${styles.card.large} p-6 lg:p-8 animate-in slide-in-from-top-4 duration-300`}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {React.Children.toArray(children).slice(0, 4)}
            </div>
            {React.Children.count(children) > 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {React.Children.toArray(children).slice(4)}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={onClear}
              className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors border-2 rounded-xl"
              style={{
                borderColor: 'var(--store-color)',
              }}
            >
              Limpar Filtros
            </button>
            <Button onClick={onApply} className="px-10">
              <Search size={16} /> Aplicar Filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
