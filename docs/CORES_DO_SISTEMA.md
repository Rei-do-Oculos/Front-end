# Sistema de Cores Dinâmicas

O sistema agora usa cores dinâmicas baseadas na loja selecionada. Todas as cores vermelhas foram substituídas por variáveis CSS que se adaptam à cor da loja.

## Variáveis CSS Disponíveis

As seguintes variáveis CSS são definidas automaticamente no `Layout.tsx` baseadas na cor da loja selecionada:

- `--store-color`: Cor principal da loja
- `--store-color-light`: Versão clara (90% mais clara) - para backgrounds
- `--store-color-lighter`: Versão muito clara (95% mais clara) - para backgrounds suaves
- `--store-color-dark`: Versão escura (20% mais escura) - para hover states
- `--store-color-darker`: Versão mais escura (30% mais escura) - para estados ativos
- `--store-color-opacity-5`: Cor com 5% de opacidade
- `--store-color-opacity-10`: Cor com 10% de opacidade
- `--store-color-opacity-20`: Cor com 20% de opacidade
- `--store-color-opacity-50`: Cor com 50% de opacidade

## Como Usar

### Em Componentes React (Inline Styles)

```tsx
// Background
<div style={{ backgroundColor: 'var(--store-color)' }}>

// Texto
<span style={{ color: 'var(--store-color)' }}>

// Borda
<div style={{ borderColor: 'var(--store-color)' }}>

// Hover
<button
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--store-color)';
  }}
>
```

### Em Classes Tailwind (usando valores arbitrários)

```tsx
// Background
<div className="bg-[var(--store-color)]">

// Texto
<span className="text-[var(--store-color)]">

// Borda
<div className="border-[var(--store-color)]">
```

### Substituições Comuns

| Antes (Vermelho Fixo) | Depois (Cor do Sistema) |
|----------------------|------------------------|
| `bg-red-600` | `style={{ backgroundColor: 'var(--store-color)' }}` |
| `text-red-600` | `style={{ color: 'var(--store-color)' }}` |
| `border-red-600` | `style={{ borderColor: 'var(--store-color)' }}` |
| `bg-red-50` | `style={{ backgroundColor: 'var(--store-color-light)' }}` |
| `text-red-500` | `style={{ color: 'var(--store-color-dark)' }}` |
| `hover:bg-red-600` | `onMouseEnter` com `var(--store-color)` |
| `shadow-red-200` | `boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)'` |

## Componentes Já Atualizados

✅ **Layout.tsx** - Sidebar, menu, badges de notificação
✅ **Common.tsx** - Button, Input, Badge, Modal, FilterSection
✅ **StoreSelector.tsx** - Seleção de loja
✅ **ProtectedRoute.tsx** - Página de acesso negado
✅ **ErrorBoundary.tsx** - Página de erro
✅ **NotificationContext.tsx** - Notificações de erro

## Componentes que Ainda Precisam Atualização

Os seguintes componentes ainda têm cores vermelhas fixas e precisam ser atualizados:

- `pages/Permissions/UsersPermissions.tsx`
- `pages/Permissions/Profiles.tsx`
- `pages/Clients/ClientList.tsx`
- `pages/Clients/ClientForm.tsx`
- `pages/Audit/AuditList.tsx`
- `pages/Dashboard.tsx`
- `pages/Login.tsx`
- `pages/Users/Users.tsx`
- `pages/Permissions/Permissions.tsx`

## Padrão de Migração

1. **Identificar cores vermelhas**: Procure por `bg-red-`, `text-red-`, `border-red-`, `#dc2626`, `#ef4444`, etc.

2. **Substituir por variáveis CSS**:
   - Backgrounds: `style={{ backgroundColor: 'var(--store-color)' }}`
   - Textos: `style={{ color: 'var(--store-color)' }}`
   - Bordas: `style={{ borderColor: 'var(--store-color)' }}`
   - Backgrounds claros: `var(--store-color-light)`
   - Hover states: usar `onMouseEnter`/`onMouseLeave` com variáveis

3. **Manter funcionalidade**: Garantir que hover states e transições continuem funcionando

## Exemplo Completo

### Antes:
```tsx
<button className="bg-red-600 text-white hover:bg-red-700">
  Salvar
</button>
```

### Depois:
```tsx
<button 
  className="text-white hover:opacity-90 transition-all"
  style={{ 
    backgroundColor: 'var(--store-color)',
    boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--store-color-dark)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--store-color)';
  }}
>
  Salvar
</button>
```

## Utilitários Disponíveis

O arquivo `utils/colorUtils.ts` fornece funções para manipular cores:

- `darkenColor(hex, percent)`: Escurece uma cor
- `lightenColor(hex, percent)`: Clareia uma cor
- `addOpacity(hex, opacity)`: Adiciona transparência
- `generateColorVariables(baseColor)`: Gera todas as variáveis CSS
