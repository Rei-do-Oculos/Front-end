# 🔌 Serviços e Integração com API

Este diretório contém toda a lógica de integração com a API backend, seguindo o **padrão centralizado** estabelecido no projeto.

## 📁 Estrutura

```
services/
├── api/                  # Clientes HTTP e serviços específicos
│   ├── client.ts         # Cliente HTTP base (axios configurado)
│   ├── base.service.ts   # Serviço base genérico (CRUD padrão)
│   ├── clients.ts        # Serviço de clientes (estende base)
│   ├── orders.ts         # Serviço de pedidos (estende base)
│   └── index.ts          # Exportações centralizadas
└── hooks/                # Custom hooks React
    ├── useApi.ts         # Hook genérico centralizado (CRUD padrão)
    ├── useClients.ts     # Hook específico (usa useApi)
    ├── useOrders.ts      # Hook específico (usa useApi)
    └── index.ts          # Exportações centralizadas
```

## 🎯 Padrão Centralizado

**Sempre use o padrão centralizado** para manter consistência e evitar duplicação:

1. **BaseService**: Fornece todos os métodos CRUD padrão
2. **useApi**: Fornece toda a lógica de estado padrão
3. **Serviços específicos**: Estendem BaseService (apenas configuração)
4. **Hooks específicos**: Usam useApi (apenas mapeamento de nomes)

## 🚀 Como Criar um Novo Recurso

### Passo 1: Criar o Serviço (2 minutos)

```typescript
// services/api/brands.ts
import { BaseService } from './base.service';
import { Brand } from '../../types';

export interface CreateBrandDto {
  name: string;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {}

export interface BrandsQueryParams {
  page?: number;
  search?: string;
}

class BrandsService extends BaseService<Brand, CreateBrandDto, UpdateBrandDto, BrandsQueryParams> {
  constructor() {
    super({ endpoint: '/brands' });
  }
}

export const brandsService = new BrandsService();
```

### Passo 2: Criar o Hook (2 minutos)

```typescript
// services/hooks/useBrands.ts
import { useApi } from './useApi';
import { brandsService, CreateBrandDto, UpdateBrandDto, BrandsQueryParams } from '../api/brands';
import { Brand } from '../../types';

interface UseBrandsOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: BrandsQueryParams;
}

export const useBrands = (options: UseBrandsOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  const api = useApi<Brand, CreateBrandDto, UpdateBrandDto, BrandsQueryParams>({
    service: brandsService,
    autoFetch,
    initialPage,
    initialParams,
  });

  return {
    brands: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchBrands: api.fetch,
    getBrand: api.getById,
    createBrand: api.create,
    updateBrand: api.update,
    deleteBrand: api.delete,
    reset: api.reset,
  };
};
```

### Passo 3: Usar no Componente

```tsx
// pages/Brands/BrandList.tsx
import { useBrands } from '../../services/hooks/useBrands';

export const BrandList: React.FC = () => {
  const {
    brands,
    loading,
    error,
    pagination,
    fetchBrands,
    deleteBrand,
  } = useBrands({ autoFetch: true });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await deleteBrand(id);
      } catch (err) {
        alert('Erro ao excluir');
      }
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      {brands.map((brand) => (
        <div key={brand.id}>
          {brand.name}
          <button onClick={() => handleDelete(brand.id)}>Excluir</button>
        </div>
      ))}
    </div>
  );
};
```

## 📋 Usando Plucks para Selects/Multiselects

Para selects e multiselects, use o método `plucks()` que retorna apenas `id` e `name` de forma mais leve:

### Hook `usePlucks`

```typescript
// services/hooks/usePlucks.ts
import { usePlucks } from '../../services/hooks/usePlucks';
import { usersService } from '../../services/api/users';

export const MyComponent: React.FC = () => {
  const { plucks: usersPlucks, loading, error } = usePlucks({
    service: usersService,
    autoFetch: true,
  });

  return (
    <MultiSelect
      label="Usuário"
      options={usersPlucks.map(user => ({
        label: user.name,
        value: String(user.id),
      }))}
    />
  );
};
```

### Padrão de Uso

1. **Importar o hook**: `import { usePlucks } from '../../services/hooks/usePlucks';`
2. **Importar o serviço**: `import { usersService } from '../../services/api/users';`
3. **Usar no componente**: `const { plucks } = usePlucks({ service: usersService, autoFetch: true });`
4. **Mapear para options**: `options={plucks.map(item => ({ label: item.name, value: String(item.id) }))}`

**Vantagens:**
- ✅ Dados mais leves (apenas id e name)
- ✅ Carregamento mais rápido
- ✅ Padrão consistente em todo o projeto
- ✅ Reutilizável para qualquer serviço que tenha `plucks()`

## ✨ Vantagens do Padrão Centralizado

1. **Zero Duplicação**: Toda lógica CRUD em um único lugar
2. **Consistência**: Todos seguem o mesmo padrão
3. **Manutenibilidade**: Mudanças em um lugar afetam todos
4. **Produtividade**: Criar novo recurso leva menos de 5 minutos
5. **Type-Safety**: TypeScript garante tipos corretos

## 🔧 Métodos Customizados

Se precisar de métodos além do CRUD padrão:

```typescript
class ClientsService extends BaseService<Client, CreateClientDto, UpdateClientDto> {
  constructor() {
    super({ endpoint: '/clients' });
  }

  // Método customizado
  async getByCpf(cpf: string): Promise<Client> {
    const { data } = await apiClient.get<Client>(`${this.endpoint}/cpf/${cpf}`);
    return data;
  }
}
```

## ⚙️ Configuração

### Variável de Ambiente

Crie um arquivo `.env` na raiz do projeto `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api
```

### Autenticação

O cliente HTTP automaticamente adiciona o token de autenticação do `localStorage`:

```typescript
// O token é obtido automaticamente de:
localStorage.getItem('authToken');
```

## 🔒 Interceptores

O cliente HTTP já possui interceptores configurados:

- **Request**: Adiciona token de autenticação automaticamente
- **Response**: Redireciona para login em caso de erro 401

## 📝 Boas Práticas

1. **Sempre estenda BaseService** ao criar novos serviços
2. **Sempre use useApi** ao criar novos hooks
3. **Trate erros** adequadamente nos componentes
4. **Use TypeScript** para tipar todas as requisições e respostas
5. **Mantenha os serviços focados** em uma única entidade/recurso
6. **Exporte tudo** através dos arquivos `index.ts`

## 🎯 Exemplos Completos

- **Serviço**: `services/api/clients.ts` - Estende BaseService
- **Hook**: `services/hooks/useClients.ts` - Usa useApi
- **Uso**: Veja `pages/Clients/ClientList.tsx` para exemplo de uso

## 📚 Documentação Completa

Veja `docs/PADROES_FRONTEND.md` para documentação completa dos padrões.
