import React, { useState, useEffect } from 'react';
import { Store, Check } from 'lucide-react';
import { Card, Button } from './Common';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../services/hooks/useAuth';
import { isSuperAdmin } from '../utils/menuPermissions';

interface StoreSelectorProps {
  onStoreSelected?: () => void;
}

/**
 * Componente de seleção de loja após login
 * Aparece quando o usuário tem mais de uma loja vinculada
 * Superadmin pode escolher "Acesso Geral" ou uma loja específica
 */
export const StoreSelector: React.FC<StoreSelectorProps> = ({ onStoreSelected }) => {
  const { user } = useAuth();
  const { availableStores, setSelectedStore } = useStore();
  const [selectedStoreId, setSelectedStoreId] = useState<number | 'general' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user ? isSuperAdmin(user) : false;
  const hasMultipleStores = availableStores.length > 1;

  // Se não há múltiplas lojas e não é admin, selecionar automaticamente
  useEffect(() => {
    if (!hasMultipleStores && !isAdmin && availableStores.length === 1) {
      setSelectedStore(availableStores[0]);
      if (onStoreSelected) {
        onStoreSelected();
      }
    }
  }, [hasMultipleStores, isAdmin, availableStores, setSelectedStore, onStoreSelected]);

  // Se não há lojas e não é admin, permitir acesso mesmo assim
  useEffect(() => {
    if (!hasMultipleStores && !isAdmin && availableStores.length === 0) {
      if (onStoreSelected) {
        onStoreSelected();
      }
    }
  }, [hasMultipleStores, isAdmin, availableStores, onStoreSelected]);

  const handleSelectStore = async (storeId: number | 'general') => {
    setIsLoading(true);
    try {
      if (storeId === 'general') {
        // Acesso geral (apenas para superadmin)
        setSelectedStore(null);
        localStorage.removeItem('selectedStoreId');
      } else {
        const store = availableStores.find(s => s.id === storeId);
        if (store) {
          setSelectedStore(store);
        }
      }
      setSelectedStoreId(storeId);
      
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        if (onStoreSelected) {
          onStoreSelected();
        }
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error('Erro ao selecionar loja:', error);
      setIsLoading(false);
    }
  };

  // Não mostrar se não há múltiplas lojas e não é admin
  if (!hasMultipleStores && !isAdmin) {
    return null;
  }

  // Se é admin mas não tem lojas, permitir acesso geral
  if (isAdmin && availableStores.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
                <Store size={32} style={{ color: 'var(--store-color)' }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Selecione uma Loja
            </h2>
            <p className="text-slate-600">
              {isAdmin 
                ? 'Escolha uma loja para acessar ou selecione "Acesso Geral" para ver todas.'
                : 'Você tem acesso a múltiplas lojas. Selecione qual deseja acessar.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin && (
              <button
                onClick={() => handleSelectStore('general')}
                disabled={isLoading}
                className={`
                  p-6 rounded-xl border-2 transition-all text-left
                  ${selectedStoreId === 'general'
                    ? ''
                    : 'border-slate-200 bg-white hover:border-slate-300'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={selectedStoreId === 'general' ? {
                  borderColor: 'var(--store-color)',
                  backgroundColor: 'var(--store-color-light)',
                } : undefined}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={selectedStoreId === 'general' ? {
                      backgroundColor: 'var(--store-color)',
                    } : {
                      backgroundColor: 'rgb(241 245 249)',
                    }}
                  >
                    <Store size={24} className={selectedStoreId === 'general' ? 'text-white' : 'text-slate-600'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Acesso Geral
                    </h3>
                    <p className="text-sm text-slate-600">
                      Visualizar e gerenciar todas as lojas
                    </p>
                  </div>
                  {selectedStoreId === 'general' && (
                    <Check size={20} className="text-red-600 shrink-0" />
                  )}
                </div>
              </button>
            )}

            {availableStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSelectStore(store.id)}
                disabled={isLoading}
                className={`
                  p-6 rounded-xl border-2 transition-all text-left
                  ${selectedStoreId === store.id
                    ? ''
                    : 'border-slate-200 bg-white hover:border-slate-300'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={selectedStoreId === store.id ? {
                  borderColor: 'var(--store-color)',
                  backgroundColor: 'var(--store-color-light)',
                } : undefined}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: store.color || '#dc2626' }}
                  >
                    {store.logo ? (
                      <img 
                        src={store.logo} 
                        alt={store.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Store size={24} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {store.fancy_name || store.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {store.name}
                    </p>
                  </div>
                  {selectedStoreId === store.id && (
                    <Check size={20} className="shrink-0" style={{ color: 'var(--store-color)' }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedStoreId && (
            <div className="flex justify-center pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  if (onStoreSelected) {
                    onStoreSelected();
                  }
                }}
                disabled={isLoading}
                className="min-w-[200px]"
              >
                {isLoading ? 'Carregando...' : 'Continuar'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
