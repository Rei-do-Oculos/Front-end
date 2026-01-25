# 📋 Padrões de Front-End - Rei do Óculos

Este documento estabelece os padrões e melhores práticas para desenvolvimento front-end no projeto, garantindo código limpo, reutilizável e manutenível.

---

## 📑 Índice

1. [Componentização e Reutilização](#componentização-e-reutilização)
2. [Integração com API](#integração-com-api)
3. [Segurança](#segurança)
4. [Clean Code](#clean-code)
5. [Comentários](#comentários)
6. [Estrutura de Arquivos](#estrutura-de-arquivos)
7. [TypeScript e Tipagem](#typescript-e-tipagem)
8. [Estilização](#estilização)
9. [Gerenciamento de Estado](#gerenciamento-de-estado)
10. [Tratamento de Erros](#tratamento-de-erros)
11. [Performance](#performance)

---

## 🧩 Componentização e Reutilização

### Princípios Fundamentais

#### 1. **DRY (Don't Repeat Yourself)**
- **Nunca duplique código**. Se você precisa usar o mesmo código em mais de um lugar, crie um componente reutilizável.
- Componentes devem ser pequenos e focados em uma única responsabilidade.

#### 2. **Componentes Atômicos**
Siga a hierarquia de componentes:

```
Átomos → Moléculas → Organismos → Páginas
```

- **Átomos**: Componentes básicos e indivisíveis (`Button`, `Input`, `Badge`)
- **Moléculas**: Combinações de átomos (`FilterSection`, `StatCard`)
- **Organismos**: Componentes complexos (`Header`, `Sidebar`, `DataTable`)
- **Páginas**: Composição final (`ClientList`, `Dashboard`)

### Regras de Componentização

#### ✅ **FAÇA:**

```tsx
// ✅ Componente reutilizável e bem tipado
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  ...props 
}) => {
  return (
    <button 
      className={getButtonClasses(variant)}
      {...props}
    >
      {children}
    </button>
  );
};

// ✅ Uso do componente
<Button variant="primary" onClick={handleClick}>
  Salvar
</Button>
```

#### ❌ **NÃO FAÇA:**

```tsx
// ❌ Duplicação de código
<button className="px-4 py-2 bg-red-600 text-white rounded-lg">
  Salvar Cliente
</button>
<button className="px-4 py-2 bg-red-600 text-white rounded-lg">
  Salvar Pedido
</button>

// ❌ Componente muito grande com múltiplas responsabilidades
export const ClientManagement = () => {
  // 500 linhas de código misturando listagem, formulário, validação...
}
```

### Quando Criar um Componente?

Crie um componente quando:

1. **Repetição**: O código aparece em 2+ lugares
2. **Complexidade**: A lógica é complexa o suficiente para ser isolada
3. **Testabilidade**: Precisa ser testado independentemente
4. **Manutenibilidade**: Mudanças futuras serão facilitadas

### Estrutura de Componentes

```tsx
// ✅ Estrutura padrão de componente
import React from 'react';
import { ComponentProps } from './types';

interface ComponentNameProps {
  // Props bem definidas
  title: string;
  onAction?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onAction,
}) => {
  // Hooks no topo
  const [state, setState] = React.useState();

  // Handlers
  const handleClick = () => {
    onAction?.();
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Ação</button>
    </div>
  );
};
```

---

## 🔌 Integração com API

### Padrão Centralizado (Recomendado)

**Sempre use o padrão centralizado** para manter consistência e reduzir duplicação de código.

### Estrutura de Serviços

```
frontend/
  services/
    api/
      client.ts          # Configuração base do cliente HTTP
      base.service.ts    # Serviço base genérico (CRUD padrão)
      clients.ts         # Serviço de clientes (estende base)
      orders.ts          # Serviço de pedidos (estende base)
      index.ts           # Exportações centralizadas
      ...
    hooks/
      useApi.ts          # Hook genérico centralizado (CRUD padrão)
      useClients.ts      # Hook específico de clientes (usa useApi)
      useOrders.ts       # Hook específico de pedidos (usa useApi)
      index.ts           # Exportações centralizadas
      ...
```

### Serviço Base Genérico

O `BaseService` fornece todas as operações CRUD padrão:

```typescript
// services/api/base.service.ts
export class BaseService<T extends BaseEntity, CreateDto, UpdateDto, QueryParams = {}> {
  protected endpoint: string;

  constructor(config: { endpoint: string }) {
    this.endpoint = config.endpoint;
  }

  async getAll(params?: QueryParams & { page?: number }): Promise<PaginatedResponse<T>> { }
  async getById(id: string): Promise<T> { }
  async create(payload: CreateDto): Promise<T> { }
  async update(id: string, payload: UpdateDto): Promise<T> { }
  async delete(id: string): Promise<void> { }
}
```

### Criando um Novo Serviço

#### ✅ **FAÇA (Padrão Centralizado):**

```typescript
// services/api/clients.ts
import { BaseService } from './base.service';
import { Client } from '../../types';

export interface CreateClientDto {
  name: string;
  cpf: string;
  phone1: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface ClientsQueryParams {
  page?: number;
  search?: string;
  cpf?: string;
}

// Estende BaseService - herda todos os métodos CRUD
class ClientsService extends BaseService<Client, CreateClientDto, UpdateClientDto, ClientsQueryParams> {
  constructor() {
    super({ endpoint: '/clients' });
  }

  // Métodos customizados podem ser adicionados aqui
  // async getByCpf(cpf: string): Promise<Client> {
  //   const { data } = await apiClient.get<Client>(`${this.endpoint}/cpf/${cpf}`);
  //   return data;
  // }
}

export const clientsService = new ClientsService();
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Não crie serviços do zero - sempre estenda BaseService
export const clientsService = {
  getAll: async () => { /* código duplicado */ },
  getById: async () => { /* código duplicado */ },
  // ...
};
```

### Hook Genérico Centralizado

O `useApi` fornece toda a lógica padrão de gerenciamento de estado:

```typescript
// services/hooks/useApi.ts
export const useApi = <T, CreateDto, UpdateDto, QueryParams>(
  options: {
    service: BaseService<T, CreateDto, UpdateDto, QueryParams>;
    autoFetch?: boolean;
    initialPage?: number;
    initialParams?: QueryParams;
  }
) => {
  // Retorna: data, loading, error, pagination, fetch, getById, create, update, delete, reset
};
```

### Criando um Novo Hook

#### ✅ **FAÇA (Padrão Centralizado):**

```typescript
// services/hooks/useClients.ts
import { useApi } from './useApi';
import { clientsService, CreateClientDto, UpdateClientDto, ClientsQueryParams } from '../api/clients';
import { Client } from '../../types';

interface UseClientsOptions {
  autoFetch?: boolean;
  initialPage?: number;
  initialParams?: ClientsQueryParams;
}

export const useClients = (options: UseClientsOptions = {}) => {
  const { autoFetch = false, initialPage = 1, initialParams = {} } = options;

  // Usa o hook genérico centralizado
  const api = useApi<Client, CreateClientDto, UpdateClientDto, ClientsQueryParams>({
    service: clientsService,
    autoFetch,
    initialPage,
    initialParams,
  });

  // Expõe com nomes específicos do domínio
  return {
    clients: api.data,
    loading: api.loading,
    error: api.error,
    pagination: api.pagination,
    fetchClients: api.fetch,
    getClient: api.getById,
    createClient: api.create,
    updateClient: api.update,
    deleteClient: api.delete,
    reset: api.reset,
  };
};
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Não recrie a lógica - sempre use useApi
export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... código duplicado
};
```

### Cliente HTTP Base

```typescript
// services/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.hash = '#/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

### Vantagens do Padrão Centralizado

1. **Zero Duplicação**: Toda lógica CRUD está em um único lugar
2. **Consistência**: Todos os serviços seguem o mesmo padrão
3. **Manutenibilidade**: Mudanças em um lugar afetam todos os serviços
4. **Type-Safety**: TypeScript garante tipos corretos em toda a cadeia
5. **Produtividade**: Criar novo serviço/hook leva menos de 5 minutos

### Exemplo Completo: Criando um Novo Recurso

#### 1. Criar o Serviço

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

#### 2. Criar o Hook

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

#### 3. Usar no Componente

```typescript
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

### Métodos Customizados

Se precisar de métodos específicos além do CRUD padrão:

```typescript
// services/api/clients.ts
class ClientsService extends BaseService<Client, CreateClientDto, UpdateClientDto, ClientsQueryParams> {
  constructor() {
    super({ endpoint: '/clients' });
  }

  // Método customizado específico de clientes
  async getByCpf(cpf: string): Promise<Client> {
    const { data } = await apiClient.get<Client>(`${this.endpoint}/cpf/${cpf}`);
    return data;
  }

  async getHistory(id: string): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>(`${this.endpoint}/${id}/history`);
    return data;
  }
}
```

### Uso Direto do Hook Genérico (Avançado)

Para casos especiais, você pode usar `useApi` diretamente:

```tsx
import { useApi } from '../../services/hooks/useApi';
import { clientsService } from '../../services/api/clients';

export const CustomComponent: React.FC = () => {
  const {
    data: clients,
    loading,
    fetch,
    create,
  } = useApi({
    service: clientsService,
    autoFetch: true,
  });

  // ...
};
```

**Recomendação**: Use hooks específicos (`useClients`, `useOrders`) na maioria dos casos para melhor legibilidade.

---

## 🔒 Segurança

### Princípios Fundamentais

**IMPORTANTE**: A segurança no front-end é apenas uma camada de proteção. A segurança real está sempre no backend. Nunca confie apenas no front-end para proteger dados sensíveis.

### Regras de Ouro

1. **Nunca exponha informações sensíveis** no código front-end
2. **Sempre valide e sanitize** dados antes de enviar para a API
3. **Nunca confie em dados** vindos do cliente
4. **Use HTTPS** sempre em produção
5. **Proteja tokens** e credenciais adequadamente

### Abstração da API

#### ✅ **FAÇA:**

```typescript
// ✅ Use sempre os serviços centralizados - API nunca exposta
import { useClients } from '../../services/hooks/useClients';

export const ClientList: React.FC = () => {
  const { clients, createClient } = useClients();
  
  // API está abstraída - não sabemos qual endpoint é usado
  const handleCreate = async () => {
    await createClient({ name: 'João', cpf: '123.456.789-00' });
  };
};
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ NUNCA exponha URLs ou endpoints diretamente nos componentes
import axios from 'axios';

export const ClientList: React.FC = () => {
  const fetchClients = async () => {
    // ❌ URL exposta - vulnerável a mudanças e inseguro
    const response = await axios.get('http://api.example.com/clients');
  };
};

// ❌ NUNCA hardcode URLs ou endpoints
const API_URL = 'http://localhost:8000/api/clients'; // ❌ ERRADO
```

### Sanitização de Dados

#### ✅ **FAÇA:**

```typescript
// ✅ Sempre sanitize dados de entrada
import { sanitizeInput, sanitizeObject } from '../../utils/security';

const handleSubmit = async (formData: CreateClientDto) => {
  // Sanitiza antes de enviar
  const sanitized = sanitizeObject(formData);
  
  await createClient(sanitized);
};

// ✅ Sanitize inputs do usuário
<input 
  value={name}
  onChange={(e) => {
    const sanitized = sanitizeInput(e.target.value);
    setName(sanitized);
  }}
/>
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Nunca confie em dados do usuário sem sanitizar
const handleSubmit = async (formData: CreateClientDto) => {
  // ❌ Dados podem conter XSS, SQL injection, etc.
  await createClient(formData);
};
```

### Validação de Entrada

#### ✅ **FAÇA:**

```typescript
// ✅ Valide sempre antes de enviar
import { validateCpf, validateEmail, validateStringLength } from '../../utils/security';

const handleSubmit = async (data: CreateClientDto) => {
  // Validações no front-end (UX)
  if (!validateStringLength(data.name, 3, 100)) {
    setError('Nome deve ter entre 3 e 100 caracteres');
    return;
  }
  
  if (!validateCpf(data.cpf)) {
    setError('CPF inválido');
    return;
  }
  
  // Backend também deve validar (segurança real)
  await createClient(data);
};
```

### Proteção contra XSS

#### ✅ **FAÇA:**

```tsx
// ✅ React já escapa HTML por padrão
<div>{userInput}</div>

// ✅ Para HTML permitido, use dangerouslySetInnerHTML com sanitização
import { escapeHtml } from '../../utils/security';

<div dangerouslySetInnerHTML={{ 
  __html: escapeHtml(userInput) 
}} />
```

#### ❌ **NÃO FAÇA:**

```tsx
// ❌ Nunca injete HTML não sanitizado
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ Nunca use innerHTML diretamente
element.innerHTML = userInput; // ❌ PERIGOSO
```

### Gerenciamento de Tokens

#### ✅ **FAÇA:**

```typescript
// ✅ Tokens gerenciados pelo cliente HTTP centralizado
// services/api/client.ts já gerencia tokens automaticamente

// ✅ Limpe tokens ao fazer logout
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isLoggedIn');
  sessionStorage.clear();
  window.location.hash = '#/login';
};
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Nunca exponha tokens no código
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ❌ ERRADO

// ❌ Nunca armazene tokens em variáveis globais
window.token = getToken(); // ❌ ERRADO

// ❌ Nunca envie tokens em URLs
fetch(`/api/data?token=${token}`); // ❌ ERRADO
```

### Validação de IDs e Parâmetros

#### ✅ **FAÇA:**

```typescript
// ✅ Valide IDs antes de usar
import { validateId } from '../../utils/security';

const handleView = (id: string) => {
  if (!validateId(id)) {
    setError('ID inválido');
    return;
  }
  
  getClient(id);
};

// ✅ O cliente HTTP já valida automaticamente
// Mas valide também nos componentes para melhor UX
```

### Proteção contra CSRF

#### ✅ **FAÇA:**

```typescript
// ✅ Cliente HTTP já inclui headers de proteção
// X-Requested-With: XMLHttpRequest
// withCredentials: true

// ✅ Backend deve validar CSRF tokens
// Front-end apenas envia o token fornecido pelo backend
```

### Rate Limiting e Retry

#### ✅ **FAÇA:**

```typescript
// ✅ Cliente HTTP já implementa retry automático para erros 5xx
// ✅ Rate limiting é tratado automaticamente (erro 429)

// ✅ Implemente debounce em ações do usuário
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    fetchClients({ search: query });
  }, 300),
  []
);
```

### Logs e Monitoramento

#### ✅ **FAÇA:**

```typescript
// ✅ Log eventos de segurança apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.warn('[Security] Tentativa de acesso negado', { url });
}

// ✅ Nunca logue dados sensíveis
// ❌ console.log('Token:', token); // NUNCA FAÇA ISSO
```

### Headers de Segurança

O cliente HTTP já configura automaticamente:

```typescript
// ✅ Headers já configurados
headers: {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest', // Proteção CSRF
}
withCredentials: true, // Cookies seguros
```

### Checklist de Segurança

Antes de fazer commit, verifique:

- [ ] Nenhuma URL de API está exposta nos componentes
- [ ] Todos os inputs do usuário são sanitizados
- [ ] Validações estão implementadas (front-end e backend)
- [ ] Tokens não estão expostos no código
- [ ] Dados sensíveis não estão em logs
- [ ] IDs são validados antes de usar
- [ ] HTML não sanitizado não é injetado
- [ ] Erros não expõem informações sensíveis

### Utilitários de Segurança

Use sempre os utilitários centralizados:

```typescript
// utils/security.ts
import {
  sanitizeInput,        // Sanitiza strings
  sanitizeObject,       // Sanitiza objetos
  validateId,           // Valida IDs
  validateCpf,          // Valida CPF
  validateEmail,        // Valida email
  validatePhone,        // Valida telefone
  escapeHtml,           // Escapa HTML
  detectXssAttempt,     // Detecta tentativas XSS
  validateStringLength, // Valida tamanho de string
  validateNumberRange,  // Valida range numérico
} from '../../utils/security';
```

### Exemplo Completo Seguro

```tsx
import { useClients } from '../../services/hooks/useClients';
import { sanitizeObject, validateCpf, validateStringLength } from '../../utils/security';
import { useState } from 'react';

export const ClientForm: React.FC = () => {
  const { createClient } = useClients();
  const [formData, setFormData] = useState({ name: '', cpf: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação front-end (UX)
    if (!validateStringLength(formData.name, 3, 100)) {
      setError('Nome deve ter entre 3 e 100 caracteres');
      return;
    }

    if (!validateCpf(formData.cpf)) {
      setError('CPF inválido');
      return;
    }

    try {
      // Sanitização antes de enviar
      const sanitized = sanitizeObject(formData);
      
      // API abstraída - não sabemos qual endpoint é usado
      await createClient(sanitized);
      
      // Sucesso
      alert('Cliente criado com sucesso!');
    } catch (err) {
      // Erro não expõe detalhes sensíveis
      setError('Erro ao criar cliente. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => {
          // Sanitiza input em tempo real
          const sanitized = sanitizeInput(e.target.value);
          setFormData(prev => ({ ...prev, name: sanitized }));
        }}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Salvar</button>
    </form>
  );
};
```

---

## 🧹 Clean Code

### Nomenclatura

#### ✅ **FAÇA:**

```typescript
// ✅ Nomes descritivos e claros
const clientList = [];
const isFormValid = true;
const handleSubmit = () => {};
const fetchUserData = async () => {};

// ✅ Componentes com PascalCase
export const ClientForm: React.FC = () => {};

// ✅ Hooks com prefixo "use"
const useClients = () => {};

// ✅ Constantes com UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Nomes genéricos ou abreviados
const data = [];
const flag = true;
const fn = () => {};
const x = 10;

// ❌ Componentes com camelCase
export const clientForm = () => {};

// ❌ Variáveis com abreviações confusas
const usr = user;
const clt = client;
```

### Funções

#### ✅ **FAÇA:**

```typescript
// ✅ Funções pequenas e focadas
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// ✅ Uma responsabilidade por função
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Funções puras quando possível
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Função fazendo muitas coisas
const processOrder = (order: Order) => {
  // Validação
  if (!order.client) throw new Error('Cliente obrigatório');
  // Cálculo
  const total = order.items.reduce(...);
  // Formatação
  const formatted = formatCurrency(total);
  // API call
  api.post('/orders', order);
  // Notificação
  showNotification('Pedido criado!');
  // Redirecionamento
  navigate('/orders');
};

// ❌ Função muito longa
const handleComplexLogic = () => {
  // 100+ linhas de código...
};
```

### Estrutura de Arquivos

```
✅ Organização clara
component/
  ComponentName.tsx
  ComponentName.test.tsx
  ComponentName.types.ts
  index.ts

❌ Arquivos soltos sem organização
ComponentName.tsx
ComponentName.test.tsx
types.ts
```

### Evite Código Duplicado

#### ✅ **FAÇA:**

```typescript
// ✅ Função reutilizável
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
};

// Uso
formatDate(client.createdAt);
formatDate(order.createdAt);
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Código duplicado
const clientDate = new Intl.DateTimeFormat('pt-BR').format(new Date(client.createdAt));
const orderDate = new Intl.DateTimeFormat('pt-BR').format(new Date(order.createdAt));
```

---

## 💬 Comentários

### Regra de Ouro: **Comentários somente quando necessário**

O código deve ser autoexplicativo. Se você precisa de um comentário para explicar o que o código faz, considere refatorar.

#### ✅ **FAÇA:**

```typescript
// ✅ Comentário explicando "POR QUÊ", não "O QUÊ"
// Usamos debounce para evitar muitas requisições durante a digitação
const debouncedSearch = useMemo(
  () => debounce((query: string) => fetchClients(query), 300),
  []
);

// ✅ Comentário para lógica complexa ou não óbvia
// Algoritmo de ordenação customizado para priorizar clientes VIP
const sortedClients = clients.sort((a, b) => {
  if (a.isVip && !b.isVip) return -1;
  if (!a.isVip && b.isVip) return 1;
  return a.name.localeCompare(b.name);
});

// ✅ Comentário para workarounds temporários
// TODO: Remover quando a API retornar o campo correto
const clientName = client.fullName || `${client.firstName} ${client.lastName}`;

// ✅ Comentário para documentação de API complexa
/**
 * Calcula o desconto progressivo baseado no volume de compras
 * @param totalPurchases - Valor total de compras do cliente
 * @returns Percentual de desconto (0-20)
 */
const calculateDiscount = (totalPurchases: number): number => {
  if (totalPurchases > 10000) return 20;
  if (totalPurchases > 5000) return 15;
  if (totalPurchases > 1000) return 10;
  return 0;
};
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Comentário óbvio que repete o código
// Incrementa o contador
counter++;

// ❌ Comentário explicando código ruim ao invés de melhorar
// Verifica se o cliente existe e se tem nome
if (client && client.name) {
  // Faz alguma coisa
}

// ❌ Comentários desatualizados
// Remove o cliente (mas o código agora apenas marca como inativo)
await deleteClient(id);

// ❌ Comentários excessivos
// Inicia o estado de loading
const [loading, setLoading] = useState(false);
// Define a função de busca
const search = async () => {
  // Define loading como true
  setLoading(true);
  // Chama a API
  const data = await api.get('/clients');
  // Define loading como false
  setLoading(false);
};
```

### Quando Usar Comentários

1. **Explicar "por quê"**, não "o quê"
2. **Documentar APIs públicas** complexas
3. **Workarounds temporários** com TODO/FIXME
4. **Algoritmos complexos** que não são óbvios
5. **Decisões de arquitetura** importantes

---

## 📁 Estrutura de Arquivos

### Organização Padrão

```
frontend/
├── components/          # Componentes reutilizáveis
│   ├── Common.tsx      # Componentes básicos (Button, Input, etc)
│   ├── Layout.tsx      # Layout principal
│   └── ...
├── pages/              # Páginas/rotas
│   ├── Clients/
│   │   ├── ClientList.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientHistory.tsx
│   └── ...
├── services/           # Lógica de negócio e API
│   ├── api/           # Clientes HTTP e serviços
│   │   ├── client.ts
│   │   ├── clients.ts
│   │   └── orders.ts
│   └── hooks/         # Custom hooks
│       ├── useClients.ts
│       └── useOrders.ts
├── types/              # Definições de tipos TypeScript
│   └── index.ts
├── config/             # Configurações
│   └── styles.ts
├── utils/              # Funções utilitárias
│   ├── formatters.ts
│   └── validators.ts
└── App.tsx
```

### Convenções de Nomenclatura

- **Componentes**: PascalCase (`ClientForm.tsx`)
- **Hooks**: camelCase com prefixo "use" (`useClients.ts`)
- **Serviços**: camelCase (`clients.ts`)
- **Utilitários**: camelCase (`formatters.ts`)
- **Tipos**: PascalCase (`Client.ts`, `Order.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

---

## 🔷 TypeScript e Tipagem

### Tipagem Forte

#### ✅ **FAÇA:**

```typescript
// ✅ Interfaces bem definidas
interface Client {
  id: string;
  name: string;
  cpf: string;
  phone1: string;
  phone2?: string;
  createdAt: string;
}

// ✅ Props tipadas
interface ClientFormProps {
  clientId?: string;
  onSubmit: (data: CreateClientDto) => Promise<void>;
  onCancel: () => void;
}

// ✅ Tipos para funções
type Formatter = (value: number) => string;
type EventHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// ✅ Generics quando apropriado
interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta;
}
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Uso excessivo de any
const handleSubmit = (data: any) => {
  api.post('/clients', data);
};

// ❌ Tipos muito genéricos
interface Data {
  [key: string]: any;
}

// ❌ Evitar tipos quando possível
const client = {
  id: '123',
  name: 'João',
};
```

### Evite `any`

```typescript
// ✅ Use unknown quando o tipo é realmente desconhecido
const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  }
};

// ✅ Use tipos específicos
const clients: Client[] = [];

// ❌ Evite any
const clients: any[] = [];
```

---

## 🎨 Estilização

### Use o Sistema de Design

```typescript
// ✅ Use os estilos centralizados
import { styles } from '../config/styles';

<button className={styles.button.default}>
  Clique aqui
</button>
```

### Tailwind CSS

#### ✅ **FAÇA:**

```tsx
// ✅ Classes organizadas e legíveis
<div className="flex items-center justify-between gap-4 p-6 bg-white rounded-lg shadow-sm">
  <h2 className="text-xl font-bold text-slate-900">Título</h2>
  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
    Ação
  </button>
</div>

// ✅ Use componentes reutilizáveis
<Button variant="primary">Salvar</Button>
```

#### ❌ **NÃO FAÇA:**

```tsx
// ❌ Classes muito longas e difíceis de ler
<div className="flex items-center justify-between gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
  {/* ... */}
</div>

// ❌ Estilos inline (exceto quando realmente necessário)
<div style={{ display: 'flex', padding: '24px' }}>
  {/* ... */}
</div>
```

### Responsividade

```tsx
// ✅ Mobile-first com breakpoints
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {/* ... */}
</div>
```

---

## 🔄 Gerenciamento de Estado

### Estado Local vs Global

#### ✅ **FAÇA:**

```typescript
// ✅ Estado local para dados do componente
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '' });

// ✅ Estado compartilhado via hooks customizados
const { clients, loading, fetchClients } = useClients();

// ✅ Context API para estado global (autenticação, tema, etc)
const { user, isAuthenticated } = useAuth();
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Estado global para tudo
const [everything, setEverything] = useState(/* ... */);

// ❌ Props drilling excessivo
<ComponentA>
  <ComponentB data={data}>
    <ComponentC data={data}>
      <ComponentD data={data} />
    </ComponentC>
  </ComponentB>
</ComponentA>
```

### Hooks Customizados

```typescript
// ✅ Hook customizado para lógica reutilizável
const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = (key: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return { values, errors, setValue, reset };
};
```

---

## ⚠️ Tratamento de Erros

### Estratégia de Erros

```typescript
// ✅ Tratamento consistente de erros
try {
  await createClient(data);
  showSuccess('Cliente criado com sucesso!');
} catch (error) {
  if (error instanceof Error) {
    showError(error.message);
  } else {
    showError('Erro desconhecido ao criar cliente');
  }
}

// ✅ Error boundaries para erros de renderização
class ErrorBoundary extends React.Component {
  // ...
}
```

### Mensagens de Erro

```typescript
// ✅ Mensagens claras e acionáveis
if (!client.name) {
  setError('Nome do cliente é obrigatório');
  return;
}

// ❌ Mensagens genéricas
if (!client.name) {
  setError('Erro');
  return;
}
```

---

## ⚡ Performance

### Otimizações

#### ✅ **FAÇA:**

```typescript
// ✅ useMemo para cálculos pesados
const total = useMemo(
  () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  [items]
);

// ✅ useCallback para funções passadas como props
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// ✅ React.memo para componentes pesados
export const ExpensiveComponent = React.memo(({ data }) => {
  // ...
});

// ✅ Lazy loading de rotas
const ClientList = React.lazy(() => import('./pages/Clients/ClientList'));
```

#### ❌ **NÃO FAÇA:**

```typescript
// ❌ Otimização prematura sem necessidade
const simpleValue = useMemo(() => 1 + 1, []);

// ❌ useCallback sem dependências corretas
const handleClick = useCallback(() => {
  doSomething(value);
}, []); // ❌ value não está nas dependências
```

---

## 📝 Checklist de Code Review

Antes de fazer commit, verifique:

### Código e Estrutura
- [ ] Código não está duplicado
- [ ] Componentes são reutilizáveis e bem tipados
- [ ] API calls estão na camada de serviços (nunca expostas diretamente)
- [ ] Nomes são descritivos e claros
- [ ] Funções são pequenas e focadas
- [ ] Comentários explicam "por quê", não "o quê"
- [ ] Tipos TypeScript estão definidos
- [ ] Erros são tratados adequadamente
- [ ] Código segue a estrutura de arquivos padrão
- [ ] Performance foi considerada (quando necessário)

### Segurança 🔒
- [ ] Nenhuma URL de API está exposta nos componentes
- [ ] Todos os inputs do usuário são sanitizados
- [ ] Validações estão implementadas (front-end para UX)
- [ ] Tokens não estão expostos no código
- [ ] Dados sensíveis não estão em logs ou console
- [ ] IDs são validados antes de usar
- [ ] HTML não sanitizado não é injetado (dangerouslySetInnerHTML)
- [ ] Erros não expõem informações sensíveis
- [ ] Requisições usam o cliente HTTP centralizado
- [ ] Dados são sanitizados antes de enviar para API

---

## 🎯 Resumo dos Princípios

1. **DRY**: Não repita código
2. **KISS**: Mantenha simples
3. **SOLID**: Aplique princípios de design
4. **Composição**: Prefira composição sobre herança
5. **Tipagem**: Use TypeScript de forma efetiva
6. **Testabilidade**: Escreva código testável
7. **Manutenibilidade**: Código deve ser fácil de manter
8. **Segurança**: Sempre sanitize, valide e abstraia APIs
9. **Abstração**: Nunca exponha detalhes de implementação (URLs, endpoints)
10. **Defesa em Profundidade**: Múltiplas camadas de validação

---

**Última atualização**: Janeiro 2026
