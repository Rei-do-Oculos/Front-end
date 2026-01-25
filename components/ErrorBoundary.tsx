import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, Button } from './Common';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                  <AlertCircle size={40} style={{ color: 'var(--store-color)' }} />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Erro ao Carregar Aplicação
                </h1>
                <p className="text-slate-600">
                  Ocorreu um erro inesperado. Por favor, tente recarregar a página.
                </p>
              </div>

              {this.state.error && (
                <div className="bg-slate-50 rounded-lg p-4 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Detalhes do erro:
                      </p>
                      <p className="text-xs text-slate-600 font-mono break-all">
                        {this.state.error.message}
                      </p>
                      {this.state.errorInfo && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer">
                            Stack trace
                          </summary>
                          <pre className="text-xs text-slate-600 mt-2 overflow-auto max-h-40">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={this.handleReset}
                  style={{ backgroundColor: 'var(--store-color)' }}
                >
                  Recarregar Página
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
