
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-4">
            <span className="text-white font-black text-lg">RÓ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            REI DO <span className="text-red-600">ÓCULOS</span>
          </h1>
          <p className="text-sm text-gray-500">Gestão Inteligente para sua Ótica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@reidooculos.com"
              required
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-gray-600">Lembrar de mim</span>
            </label>
            <a href="#" className="text-red-600 hover:text-red-700 font-medium">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="mt-10 text-center space-y-1">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Rei do Óculos. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-400">
            Desenvolvido por TecWeb Services
          </p>
        </div>
      </div>
    </div>
  );
};
