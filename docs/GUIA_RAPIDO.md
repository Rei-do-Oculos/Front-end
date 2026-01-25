# ⚡ Guia Rápido - Criar Novo Recurso

Este guia mostra como criar um novo recurso completo (serviço + hook) em **menos de 5 minutos**.

## 📋 Checklist

- [ ] Criar interface no `types.ts` (se não existir)
- [ ] Criar serviço em `services/api/`
- [ ] Criar hook em `services/hooks/`
- [ ] Exportar nos `index.ts`
- [ ] Usar no componente

## 🎯 Exemplo: Criar Recurso "Stores" (Lojas)

### 1. Verificar/Criar Tipo (30 segundos)

```typescript
// types.ts (já existe Store? Se sim, pule)
export interface Store {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}
```

### 2. Criar Serviço (2 minutos)

```typescript
// services/api/stores.ts
import { BaseService } from './base.service';
import { Store } from '../../types';

export interface CreateStoreDto {
  name: string;
  address: string;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {}

export interface StoresQueryParams {
  page?: number;
  search?: string;
}

class StoresService extends BaseService<Store, CreateStoreDto, UpdateStoreDto, StoresQueryParams> {
  constructor() {
    super({ endpoint: '/stores' });
  }
}

export const storesService = new StoresService();
```

### 3. Criar Hook (2 minutos)

```typescript
// services/hooks/useStores.ts
import { useApi } from './useApi';
import { storesService, CreateStoreDto, UpdateStoreDto, StoresQueryParams } from '../api/stores';
import { Store } from '../../types';

interface UseStoresOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: StoresQueryParams;
}

export const useStores = (options: UseStoresOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Store, CreateStoreDto, UpdateStoreDto, StoresQueryParams>({
    service: storesService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    stores: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchStores: api.fetch,
    getStore: api.getById,
    createStore: api.create,
    updateStore: api.update,
    deleteStore: api.delete,
    reset: api.reset,
  };
};
```

### 4. Exportar (30 segundos)

```typescript
// services/api/index.ts
export * from './stores'; // Adicionar esta linha

// services/hooks/index.ts
export * from './useStores'; // Adicionar esta linha
```

### 5. Usar no Componente (1 minuto)

```tsx
// pages/Stores/StoreList.tsx
import { useStores } from '../../services/hooks/useStores';

export const StoreList: React.FC = () => {
  const {
    stores,
    loading,
    error,
    fetchStores,
    deleteStore,
  } = useStores({ autoFetch: true });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      {stores.map((store) => (
        <div key={store.id}>
          {store.name}
          <button onClick={() => deleteStore(store.id)}>Excluir</button>
        </div>
      ))}
    </div>
  );
};
```

## ✅ Pronto!

Agora você tem:
- ✅ Serviço completo com CRUD
- ✅ Hook com gerenciamento de estado
- ✅ Type-safety completo
- ✅ Tratamento de erros
- ✅ Paginação
- ✅ Loading states

**Tempo total: ~5 minutos**

## 🔧 Métodos Customizados

Se precisar de métodos específicos:

```typescript
class StoresService extends BaseService<Store, CreateStoreDto, UpdateStoreDto> {
  constructor() {
    super({ endpoint: '/stores' });
  }

  // Método customizado
  async getByCity(city: string): Promise<Store[]> {
    const { data } = await apiClient.get<Store[]>(`${this.endpoint}/city/${city}`);
    return data;
  }
}
```

## 📚 Padrão de Nomenclatura

- **Serviço**: `{Resource}Service` → `StoresService`
- **Instância**: `{resource}Service` → `storesService`
- **Hook**: `use{Resource}` → `useStores`
- **DTOs**: `Create{Resource}Dto`, `Update{Resource}Dto`, `{Resource}QueryParams`
- **Props do Hook**: `Use{Resource}Options`

## 🎨 Template Copiar/Colar

Substitua `{Resource}` pelo nome do recurso (ex: `Store`, `Product`, `Supplier`):

```typescript
// services/api/{resource}.ts
import { BaseService } from './base.service';
import { {Resource} } from '../../types';

export interface Create{Resource}Dto {
  // campos aqui
}

export interface Update{Resource}Dto extends Partial<Create{Resource}Dto> {}

export interface {Resource}QueryParams {
  page?: number;
  search?: string;
}

class {Resource}Service extends BaseService<{Resource}, Create{Resource}Dto, Update{Resource}Dto, {Resource}QueryParams> {
  constructor() {
    super({ endpoint: '/{resource}' });
  }
}

export const {resource}Service = new {Resource}Service();
```

```typescript
// services/hooks/use{Resource}.ts
import { useApi } from './useApi';
import { {resource}Service, Create{Resource}Dto, Update{Resource}Dto, {Resource}QueryParams } from '../api/{resource}';
import { {Resource} } from '../../types';

interface Use{Resource}Options {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: {Resource}QueryParams;
}

export const use{Resource} = (options: Use{Resource}Options = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<{Resource}, Create{Resource}Dto, Update{Resource}Dto, {Resource}QueryParams>({
    service: {resource}Service,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    {resource}s: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetch{Resource}s: api.fetch,
    get{Resource}: api.getById,
    create{Resource}: api.create,
    update{Resource}: api.update,
    delete{Resource}: api.delete,
    reset: api.reset,
  };
};
```
