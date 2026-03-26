import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../services/hooks/useAuth';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const normalizeLoginMessage = (msg: string): string => {
    const t = msg.trim();
    if (t === 'The provided credentials are incorrect.') return 'E-mail ou senha inválidos.';
    return t;
  };

  /** Lê primeiro texto útil de um objeto errors (Laravel ou ResponseHelper). */
  const pickFromErrorsObject = (errors: unknown): string | null => {
    if (!errors || typeof errors !== 'object') return null;
    const o = errors as Record<string, unknown>;
    const msg = o.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
    for (const key of ['email', 'password']) {
      const v = o[key];
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
      if (typeof v === 'string' && v.trim()) return v;
    }
    for (const v of Object.values(o)) {
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return null;
  };

  const getLoginErrorMessage = (err: any): string => {
    if (!err.response) {
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        return 'Erro de conexão. Verifique se o servidor está rodando.';
      }
      if (err.message?.includes('CORS')) {
        return 'Erro de CORS. Verifique a configuração do servidor.';
      }
      return err.message || 'Erro ao conectar com o servidor.';
    }

    const d = err.response?.data;
    if (!d || typeof d !== 'object') {
      return 'E-mail ou senha inválidos.';
    }

    // 1) Laravel validação (422): { message, errors: { email: [...] } }
    const fromFlatErrors = pickFromErrorsObject(d.errors);
    if (fromFlatErrors) return normalizeLoginMessage(fromFlatErrors);

    if (typeof d.message === 'string' && d.message.trim()) {
      return normalizeLoginMessage(d.message);
    }

    // 2) Login falho / API padronizada (401): { success, data: { errors: { email: [...] } } }
    const fromNested = pickFromErrorsObject(d.data?.errors);
    if (fromNested) return normalizeLoginMessage(fromNested);

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

            <div className="mt-6 text-center space-y-1">
              <p className="text-xs text-gray-400">Desenvolvido por TecWeb Digital</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
