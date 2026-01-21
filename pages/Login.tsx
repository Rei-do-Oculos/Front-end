
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/Common';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-lg shadow-red-200 mb-6 transform -rotate-6">
            <span className="text-white font-black text-2xl">RÓ</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            REI DO <span className="text-red-600 uppercase">Óculos</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gestão Inteligente para sua Ótica</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  label="Usuário" 
                  placeholder="ex: rodrigo.paduin" 
                  className="pl-11"
                  required
                />
                <User className="absolute left-3.5 bottom-3 text-gray-400" size={18} />
              </div>

              <div className="relative">
                <Input 
                  label="Senha" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-11 pr-11"
                  required
                />
                <Lock className="absolute left-3.5 bottom-3 text-gray-400" size={18} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-3 text-gray-400 hover:text-red-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Lembrar de mim</span>
              </label>
              <a href="#" className="text-red-600 font-semibold hover:underline">Esqueceu a senha?</a>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3.5 text-base shadow-lg shadow-red-200 group"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          &copy; {new Date().getFullYear()} Rei do Óculos. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
