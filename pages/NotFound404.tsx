import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '../components/Common';

export const NotFound404: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)' }}
        >
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-950 tracking-tight mb-2">Página não encontrada</h1>
        <p className="text-slate-500 mb-8">
          Esta página não existe. O link pode estar incorreto ou a página foi removida.
        </p>
        <Button onClick={() => navigate('/')}>
          <Home size={18} /> Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
};
