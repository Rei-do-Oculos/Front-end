import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../services/hooks/useAuth';
import { extractLoginFailureMessage } from '../utils/loginApiError';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading, error: contextError } = useAuth();

  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      onLogin();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : extractLoginFailureMessage(err);
      setError(msg);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 sm:p-8">
      <h1 className="sr-only">Login — Rei do Óculos</h1>

      {/* Fundo em tela cheia */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20"
        style={{ backgroundImage: "url('/imagemfundo.jpg')" }}
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(145deg, rgba(15, 23, 42, 0.68) 0%, rgba(15, 23, 42, 0.52) 50%, rgba(30, 41, 59, 0.48) 100%)',
        }}
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/55 backdrop-blur-lg rounded-2xl shadow-[0_25px_50px_-12px_rgba(15,23,42,0.28)] border border-white/45 ring-1 ring-white/15 p-8 sm:p-9">
          <div className="flex justify-center mb-8">
            <img
              src="/LOGO.png"
              alt="Rei do Óculos"
              className="w-[min(130px,52vw)] sm:w-32 h-auto object-contain"
              decoding="async"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-label="Acesso à conta">
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  id="login-error"
                  className="flex gap-3 rounded-xl border border-red-200/80 bg-red-50/75 backdrop-blur-sm px-4 py-3 text-sm text-red-800"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" aria-hidden />
                  <span className="leading-snug font-medium">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-black"
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu e-mail"
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/40 bg-white/35 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600/80 focus:bg-white/45 disabled:opacity-60 disabled:cursor-not-allowed transition-[box-shadow,background-color]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-black"
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/40 bg-white/35 backdrop-blur-sm text-slate-900 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600/80 focus:bg-white/45 disabled:opacity-60 disabled:cursor-not-allowed transition-[box-shadow,background-color]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-black hover:bg-white/40 transition-colors disabled:opacity-50"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.5} className="text-black" />
                    ) : (
                      <Eye size={18} strokeWidth={1.5} className="text-black" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-red-600/95 text-white text-sm font-semibold shadow-lg shadow-red-600/25 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando…
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
        </div>
      </div>

      <p className="fixed bottom-0 inset-x-0 z-10 pb-5 pt-2 text-center text-[11px] sm:text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        © {new Date().getFullYear()} Tec Web Digital
      </p>
    </div>
  );
};
