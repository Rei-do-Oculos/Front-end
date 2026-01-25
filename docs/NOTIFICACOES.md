# Sistema de Notificações

Sistema padronizado de notificações toast para exibir mensagens de sucesso, erro, aviso e informação.

## Uso Básico

```typescript
import { useNotification } from '../hooks/useNotification';

const MeuComponente = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleSave = async () => {
    try {
      await salvarDados();
      showSuccess('Salvo com sucesso!', 'Os dados foram salvos corretamente.');
    } catch (error) {
      showError('Erro ao salvar', error.message);
    }
  };

  return (
    <button onClick={handleSave}>Salvar</button>
  );
};
```

## Métodos Disponíveis

### `showSuccess(title, message?, duration?)`
Exibe uma notificação de sucesso (verde).

```typescript
showSuccess('Operação concluída!');
showSuccess('Usuário criado', 'O usuário foi criado com sucesso.', 3000);
```

### `showError(title, message?, duration?)`
Exibe uma notificação de erro (vermelho). Duração padrão: 7000ms.

```typescript
showError('Erro ao processar');
showError('Falha na conexão', 'Não foi possível conectar ao servidor.');
```

### `showWarning(title, message?, duration?)`
Exibe uma notificação de aviso (amarelo).

```typescript
showWarning('Atenção', 'Esta ação não pode ser desfeita.');
```

### `showInfo(title, message?, duration?)`
Exibe uma notificação informativa (azul).

```typescript
showInfo('Informação', 'Sistema será atualizado em breve.');
```

### `showNotification(type, title, message?, duration?)`
Método genérico para exibir qualquer tipo de notificação.

```typescript
showNotification('success', 'Título', 'Mensagem', 5000);
```

## Parâmetros

- **title** (string, obrigatório): Título da notificação
- **message** (string, opcional): Mensagem detalhada
- **duration** (number, opcional): Duração em milissegundos. Padrão: 5000ms (erros: 7000ms). Use 0 para não fechar automaticamente.

## Exemplos de Uso

### Em formulários

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await createUser(formData);
    showSuccess('Usuário criado!', 'O usuário foi criado com sucesso.');
    handleCancel();
  } catch (err: any) {
    showError('Erro ao criar usuário', err.message);
  }
};
```

### Em operações assíncronas

```typescript
const handleDelete = async () => {
  try {
    await deleteItem(id);
    showSuccess('Item excluído');
  } catch (error) {
    showError('Erro ao excluir', 'Não foi possível excluir o item.');
  }
};
```

### Com tratamento de erros da API

```typescript
try {
  await apiCall();
  showSuccess('Operação realizada com sucesso!');
} catch (err: any) {
  const errorMessage = err.response?.data?.message 
    || err.response?.data?.data?.errors 
    || err.message 
    || 'Erro desconhecido';
  
  showError('Erro na operação', errorMessage);
}
```

## Características

- ✅ Notificações aparecem no canto superior direito
- ✅ Fecham automaticamente após a duração especificada
- ✅ Podem ser fechadas manualmente clicando no X
- ✅ Múltiplas notificações são empilhadas verticalmente
- ✅ Animações suaves de entrada e saída
- ✅ Design responsivo e acessível
- ✅ Tipos visuais distintos (sucesso, erro, aviso, info)
