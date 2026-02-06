import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '../services/hooks/useAuth';
import { Store } from '../services/api/auth';

interface StoreContextType {
  selectedStore: Store | null;
  availableStores: Store[];
  setSelectedStore: (store: Store | null) => void;
  storeColor: string;
  storeLogo: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedStoreId';
const STORAGE_COLOR_KEY = 'selectedStoreColor';
const STORAGE_UNITY_KEY = 'selectedStoreUnity';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);

  // Carregar lojas do usuário — não limpar estado enquanto o auth ainda está carregando
  useEffect(() => {
    // Enquanto o auth está carregando, não tocar em estado nem localStorage
    // (evita apagar a loja salva quando a tela atualiza e user ainda é null)
    if (authLoading) return;

    console.log('[StoreContext] 🏪 Carregando lojas:', {
      hasUser: !!user,
      userStores: user?.stores,
      userStoresType: typeof user?.stores,
      userStoresIsArray: Array.isArray(user?.stores),
      userStoresLength: Array.isArray(user?.stores) ? user.stores.length : 
                        (user?.stores && typeof user.stores === 'object' ? Object.keys(user.stores).length : 0),
    });

    try {
      if (user && user.stores) {
        let stores: Store[] = [];
        if (Array.isArray(user.stores)) {
          stores = user.stores;
        } else if (typeof user.stores === 'object' && user.stores !== null) {
          stores = Object.values(user.stores);
        }
        stores = stores.filter(store =>
          store && typeof store === 'object' && 'id' in store && 'name' in store
        );
        
        console.log('[StoreContext] 🏪 Lojas filtradas:', {
          count: stores.length,
          stores: stores.map(s => ({ id: s.id, name: s.name })),
        });
        
        setAvailableStores(stores);

        if (stores.length > 0) {
          const savedStoreId = localStorage.getItem(STORAGE_KEY);
          const savedStore = savedStoreId ? stores.find(s => String(s.id) === savedStoreId) : null;
          // Se 1 loja: sempre setar automaticamente; se várias: usar salva ou primeira
          const storeToSelect = savedStore ?? stores[0];
          setSelectedStoreState(storeToSelect);
          localStorage.setItem(STORAGE_KEY, String(storeToSelect.id));
          if (storeToSelect.color) localStorage.setItem(STORAGE_COLOR_KEY, String(storeToSelect.color));
          if (storeToSelect.unity) localStorage.setItem(STORAGE_UNITY_KEY, String(storeToSelect.unity));
        } else {
          setSelectedStoreState(null);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_COLOR_KEY);
          localStorage.removeItem(STORAGE_UNITY_KEY);
        }
      } else {
        // Só limpar quando temos certeza que não está logado (auth terminou e user é null)
        setAvailableStores([]);
        setSelectedStoreState(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_COLOR_KEY);
        localStorage.removeItem(STORAGE_UNITY_KEY);
      }
    } catch (error) {
      setAvailableStores([]);
      setSelectedStoreState(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_COLOR_KEY);
      localStorage.removeItem(STORAGE_UNITY_KEY);
    }
  }, [user, authLoading]);

  const setSelectedStore = (store: Store | null) => {
    setSelectedStoreState(store);
    if (store) {
      localStorage.setItem(STORAGE_KEY, String(store.id));
      // Salvar também a cor e unity para uso imediato no próximo carregamento
      if (store.color) {
        localStorage.setItem(STORAGE_COLOR_KEY, String(store.color));
      }
      if (store.unity) {
        localStorage.setItem(STORAGE_UNITY_KEY, String(store.unity));
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_COLOR_KEY);
      localStorage.removeItem(STORAGE_UNITY_KEY);
    }
  };

  // Cor da loja selecionada - evita flash vermelho durante carregamento
  const storeColor = useMemo(() => {
    // Se há loja selecionada, usar sua cor
    if (selectedStore && typeof selectedStore === 'object' && 'color' in selectedStore && selectedStore.color) {
      return String(selectedStore.color);
    }
    
    // Se há lojas disponíveis mas ainda não selecionou (durante carregamento)
    // Tentar usar a cor salva no localStorage
    if (availableStores.length > 0) {
      const savedColor = localStorage.getItem(STORAGE_COLOR_KEY);
      if (savedColor) {
        return savedColor; // Usar cor salva imediatamente
      }
      // Se não há cor salva, usar a primeira loja disponível
      if (availableStores[0]?.color) {
        return String(availableStores[0].color);
      }
    }
    
    // Fallback: cor neutra apenas se realmente não houver lojas
    return '#dc2626';
  }, [selectedStore, availableStores]);
    
  const storeLogo = (selectedStore && typeof selectedStore === 'object' && 'logo' in selectedStore) 
    ? selectedStore.logo || null 
    : null;

  // Unity da loja selecionada - usa unity salva durante carregamento para evitar flash
  const storeUnity = useMemo(() => {
    // Se há loja selecionada, usar seu unity
    if (selectedStore && typeof selectedStore === 'object' && 'unity' in selectedStore && selectedStore.unity) {
      return String(selectedStore.unity);
    }
    
    // Se há lojas disponíveis mas ainda não selecionou (durante carregamento)
    // Tentar usar o unity salvo no localStorage
    if (availableStores.length > 0) {
      const savedUnity = localStorage.getItem(STORAGE_UNITY_KEY);
      if (savedUnity) {
        return savedUnity; // Usar unity salvo imediatamente
      }
      // Se não há unity salvo, usar da primeira loja disponível
      if (availableStores[0]?.unity) {
        return String(availableStores[0].unity);
      }
    }
    
    // Fallback: null se não houver unity
    return null;
  }, [selectedStore, availableStores]);

  return (
    <StoreContext.Provider
      value={{
        selectedStore,
        availableStores,
        setSelectedStore,
        storeColor,
        storeLogo,
        storeUnity,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore deve ser usado dentro de StoreProvider');
  }
  return context;
};
