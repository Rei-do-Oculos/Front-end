
import React, { useState } from 'react';
import { LucideIcon, Filter, ChevronDown, X, Search } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; subtitle?: string }> = ({ children, className = "", title, subtitle }) => (
  <div className={`bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden ${className}`}>
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

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' }> = ({ children, className = "", variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg shadow-red-200",
    secondary: "bg-slate-950 text-white hover:bg-slate-900 active:scale-95",
    outline: "bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-50",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200"
  };

  return (
    <button 
      className={`px-4 py-2 lg:px-6 lg:py-2.5 rounded-xl lg:rounded-2xl font-semibold text-xs lg:text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1.5 lg:space-y-2 w-full">
    {label && <label className="text-[10px] lg:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all outline-none placeholder:text-gray-400 ${error ? 'border-red-300' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>}
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { label: string; value: string }[] }> = ({ label, options, className = "", ...props }) => (
  <div className="space-y-1.5 lg:space-y-2 w-full">
    {label && <label className="text-[10px] lg:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full px-4 py-3 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all outline-none appearance-none ${className}`}
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
  <div className="bg-white p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
    
    <div className="flex items-center justify-between mb-4 lg:mb-8">
      <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-${color}-600/10 text-${color}-600`}>
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
    primary: "bg-blue-50 text-blue-600",
    danger: "bg-red-50 text-red-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-slate-50 text-slate-600",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

export const FilterSection: React.FC<{ children: React.ReactNode; onApply?: () => void; onClear?: () => void }> = ({ children, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${
          isOpen ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Filter size={14} />
        {isOpen ? 'Fechar Filtros' : 'Filtros Avançados'}
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 lg:p-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {children}
          </div>
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={onClear}
              className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
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
