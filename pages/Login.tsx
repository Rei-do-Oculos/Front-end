import React, { useState } from 'react';
import { Eye, EyeOff, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAuth } from '../services/hooks/useAuth';
import { apiClient } from '../services/api/client';

interface LoginProps {
  onLogin: () => void;
}

type ConnectionTest = 'idle' | 'checking' | 'ok' | 'error';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTest>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const { login, isLoading } = useAuth();

  const testConnection = async () => {
    setConnectionTest('checking');
    setConnectionMessage('');
    try {
      // POST no login: 401 = API respondeu (credenciais erradas) = conexão OK
      await apiClient.post('/v1/auth/login', { email: 'teste@conexao.com', password: 'teste' });
      setConnectionTest('ok');
      setConnectionMessage('Conectado ao servidor.');
    } catch (err: unknown) {
      try {
        const status = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        if (status === 401) {
          setConnectionTest('ok');
          setConnectionMessage('Conectado ao servidor.');
        } else if (status !== undefined) {
          setConnectionTest('error');
          setConnectionMessage(`Servidor respondeu com erro ${status}.`);
        } else {
          setConnectionTest('error');
          const msg = err instanceof Error ? err.message : 'Sem conexão. Verifique a rede e a URL da API.';
          setConnectionMessage(msg);
        }
      } catch {
        setConnectionTest('error');
        setConnectionMessage('Erro inesperado ao testar conexão.');
      }
    }
  };

  const getLoginErrorMessage = (err: any): string => {
    // Erro de rede/CORS
    if (!err.response) {
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        return 'Erro de conexão. Verifique se o servidor está rodando.';
      }
      if (err.message?.includes('CORS')) {
        return 'Erro de CORS. Verifique a configuração do servidor.';
      }
      return err.message || 'Erro ao conectar com o servidor.';
    }

    // Erro da API
    const apiMessage = err?.response?.data?.message;
    const emailErrors = err?.response?.data?.data?.errors?.email;
    const passwordErrors = err?.response?.data?.data?.errors?.password;

    if (Array.isArray(emailErrors) && emailErrors.length > 0) {
      return emailErrors[0];
    }

    if (Array.isArray(passwordErrors) && passwordErrors.length > 0) {
      return passwordErrors[0];
    }

    if (apiMessage) {
      if (apiMessage === 'The provided credentials are incorrect.') {
        return 'E-mail ou senha inválidos.';
      }
      return apiMessage;
    }

    return 'E-mail ou senha inválidos.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      await login({ email, password });
      onLogin();
    } catch (err: any) {
      setError(getLoginErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
               ERP <span className="text-red-600">ÓTICA</span>
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: email@dousuario.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>

            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={testConnection}
                disabled={connectionTest === 'checking' || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectionTest === 'checking' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : connectionTest === 'ok' ? (
                  <Wifi size={18} className="text-green-600" />
                ) : connectionTest === 'error' ? (
                  <WifiOff size={18} className="text-red-500" />
                ) : (
                  <Wifi size={18} className="text-gray-400" />
                )}
                <span>
                  {connectionTest === 'checking'
                    ? 'Testando conexão...'
                    : connectionTest === 'idle'
                    ? 'Testar conexão com o servidor'
                    : connectionMessage}
                </span>
              </button>
            </div>

            <div className="mt-6 text-center space-y-1">
              <p className="text-xs text-gray-400">Desenvolvido por TecWeb Digital</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
