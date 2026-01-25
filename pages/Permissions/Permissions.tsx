
import React, { ErrorInfo, ReactNode } from 'react';
import { Profiles } from './Profiles';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6">
          <div className="border rounded-xl p-6" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
            <h3 className="text-lg font-black mb-2" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar componente</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--store-color)' }}>{this.state.error?.message || 'Erro desconhecido'}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--store-color)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--store-color-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--store-color)';
              }}
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const Permissions: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Permissões</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Gestão de Perfis</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8">
          <ErrorBoundary>
            <Profiles />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};
