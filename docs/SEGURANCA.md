# 🔒 Guia de Segurança - Front-End

Este documento resume as práticas de segurança implementadas no front-end do projeto.

## 🎯 Princípios Fundamentais

1. **API nunca exposta**: Todas as requisições passam pela camada de serviços centralizada
2. **Sanitização obrigatória**: Todos os dados do usuário são sanitizados antes de processar
3. **Validação em camadas**: Validação no front-end (UX) + backend (segurança real)
4. **Abstração total**: Componentes nunca sabem qual endpoint é usado
5. **Defesa em profundidade**: Múltiplas camadas de proteção

## 🛡️ Proteções Implementadas

### 1. Cliente HTTP Seguro (`services/api/client.ts`)

✅ **Sanitização automática** de todos os dados de entrada
✅ **Validação de IDs** antes de fazer requisições
✅ **Detecção de XSS** em dados de entrada
✅ **Retry automático** para erros 5xx
✅ **Rate limiting** tratado (erro 429)
✅ **Headers de segurança** configurados automaticamente
✅ **Request ID** único para rastreamento
✅ **Logs de segurança** em desenvolvimento

### 2. Utilitários de Segurança (`utils/security.ts`)

✅ `sanitizeInput()` - Sanitiza strings
✅ `sanitizeObject()` - Sanitiza objetos recursivamente
✅ `validateId()` - Valida IDs seguros
✅ `validateCpf()` - Valida CPF brasileiro
✅ `validateEmail()` - Valida email
✅ `validatePhone()` - Valida telefone
✅ `escapeHtml()` - Escapa HTML
✅ `detectXssAttempt()` - Detecta tentativas XSS
✅ `validateStringLength()` - Valida tamanho
✅ `validateNumberRange()` - Valida range numérico

### 3. BaseService Seguro (`services/api/base.service.ts`)

✅ **Validação de endpoint** no construtor
✅ **Validação de IDs** em todos os métodos
✅ **Validação de payload** antes de enviar
✅ **Erros descritivos** sem expor detalhes sensíveis

## 📋 Checklist de Segurança

### Antes de Criar um Componente

- [ ] Usar hooks centralizados (`useClients`, `useOrders`, etc.)
- [ ] Nunca importar `apiClient` diretamente nos componentes
- [ ] Nunca hardcodar URLs ou endpoints

### Antes de Processar Dados do Usuário

- [ ] Sanitizar inputs com `sanitizeInput()` ou `sanitizeObject()`
- [ ] Validar formato com funções de validação
- [ ] Validar IDs com `validateId()` antes de usar

### Antes de Renderizar Dados

- [ ] React já escapa HTML automaticamente (seguro por padrão)
- [ ] Se usar `dangerouslySetInnerHTML`, sempre usar `escapeHtml()`
- [ ] Nunca injetar HTML não sanitizado

### Antes de Fazer Commit

- [ ] Nenhuma URL de API exposta
- [ ] Todos os inputs sanitizados
- [ ] Validações implementadas
- [ ] Tokens não expostos
- [ ] Dados sensíveis não em logs

## 🚫 O Que NUNCA Fazer

### ❌ Expor URLs ou Endpoints

```typescript
// ❌ ERRADO
const API_URL = 'http://api.example.com/clients';
fetch(API_URL);

// ✅ CORRETO
import { useClients } from '../../services/hooks/useClients';
const { fetchClients } = useClients();
```

### ❌ Confiar em Dados do Usuário

```typescript
// ❌ ERRADO
const handleSubmit = (data) => {
  createClient(data); // Sem sanitização
};

// ✅ CORRETO
const handleSubmit = (data) => {
  const sanitized = sanitizeObject(data);
  createClient(sanitized);
};
```

### ❌ Expor Tokens

```typescript
// ❌ ERRADO
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
console.log('Token:', token);

// ✅ CORRETO
// Token gerenciado automaticamente pelo cliente HTTP
// Nunca exposto no código
```

### ❌ Injetar HTML Não Sanitizado

```tsx
// ❌ ERRADO
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ CORRETO
<div>{userInput}</div> // React escapa automaticamente

// Ou se realmente precisar de HTML:
<div dangerouslySetInnerHTML={{ __html: escapeHtml(userInput) }} />
```

## ✅ Exemplo de Código Seguro

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
      setError('Nome inválido');
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
    } catch (err) {
      // Erro não expõe detalhes sensíveis
      setError('Erro ao criar cliente');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => {
          // Sanitiza em tempo real
          const sanitized = sanitizeInput(e.target.value);
          setFormData(prev => ({ ...prev, name: sanitized }));
        }}
      />
      {error && <div>{error}</div>}
      <button type="submit">Salvar</button>
    </form>
  );
};
```

## 📚 Documentação Relacionada

- `docs/PADROES_FRONTEND.md` - Seção completa de Segurança
- `docs/UTILITARIOS_SEGURANCA.md` - Documentação dos utilitários de segurança
- `docs/SERVICES.md` - Como usar serviços de forma segura

## 🔐 Lembrete Importante

**A segurança no front-end é apenas uma camada de proteção.**

A segurança real está sempre no backend. O front-end:
- Melhora a experiência do usuário (validações rápidas)
- Previne alguns ataques básicos (XSS, sanitização)
- Mas **NUNCA** deve ser a única linha de defesa

Sempre valide e sanitize também no backend!
