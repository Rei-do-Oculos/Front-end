# 🔒 Utilitários de Segurança

Este documento descreve os utilitários de segurança disponíveis e como usá-los.

## 📋 Funções Disponíveis

### Sanitização

#### `sanitizeInput(input: string): string`
Sanitiza uma string removendo caracteres perigosos.

```typescript
import { sanitizeInput } from '../../utils/security';

const userInput = '<script>alert("xss")</script>';
const safe = sanitizeInput(userInput);
// Resultado: 'alert("xss")'
```

#### `sanitizeObject<T>(obj: T): T`
Sanitiza recursivamente um objeto.

```typescript
import { sanitizeObject } from '../../utils/security';

const formData = {
  name: '<script>alert("xss")</script>',
  email: 'user@example.com',
};
const safe = sanitizeObject(formData);
```

#### `escapeHtml(text: string): string`
Escapa caracteres HTML para prevenir XSS.

```typescript
import { escapeHtml } from '../../utils/security';

const html = '<div>Hello</div>';
const escaped = escapeHtml(html);
// Resultado: '&lt;div&gt;Hello&lt;/div&gt;'
```

### Validação

#### `validateId(id: string | undefined | null): boolean`
Valida se um ID é seguro.

```typescript
import { validateId } from '../../utils/security';

validateId('abc123'); // true
validateId('abc<script>'); // false
validateId(''); // false
```

#### `validateEmail(email: string): boolean`
Valida formato de email.

```typescript
import { validateEmail } from '../../utils/security';

validateEmail('user@example.com'); // true
validateEmail('invalid'); // false
```

#### `validateCpf(cpf: string): boolean`
Valida CPF brasileiro com dígitos verificadores.

```typescript
import { validateCpf } from '../../utils/security';

validateCpf('123.456.789-09'); // true (se válido)
validateCpf('111.111.111-11'); // false (sequência inválida)
```

#### `validatePhone(phone: string): boolean`
Valida telefone brasileiro.

```typescript
import { validatePhone } from '../../utils/security';

validatePhone('(44) 99999-9999'); // true
validatePhone('123'); // false
```

#### `validateStringLength(str: string, min: number, max: number): boolean`
Valida comprimento de string.

```typescript
import { validateStringLength } from '../../utils/security';

validateStringLength('Hello', 3, 10); // true
validateStringLength('Hi', 3, 10); // false (muito curto)
```

#### `validateNumberRange(num: number, min: number, max: number): boolean`
Valida se número está em um range.

```typescript
import { validateNumberRange } from '../../utils/security';

validateNumberRange(5, 1, 10); // true
validateNumberRange(15, 1, 10); // false
```

### Detecção de Ameaças

#### `detectXssAttempt(input: string): boolean`
Detecta tentativas de XSS.

```typescript
import { detectXssAttempt } from '../../utils/security';

detectXssAttempt('<script>alert("xss")</script>'); // true
detectXssAttempt('Hello World'); // false
```

### Utilitários

#### `generateRequestId(): string`
Gera um ID único para requisições.

```typescript
import { generateRequestId } from '../../utils/security';

const requestId = generateRequestId();
// Resultado: '1234567890-abc123def'
```

#### `validateUrl(url: string): boolean`
Valida se URL é segura (http/https).

```typescript
import { validateUrl } from '../../utils/security';

validateUrl('https://example.com'); // true
validateUrl('javascript:alert(1)'); // false
```

#### `sanitizeFilename(filename: string): string`
Sanitiza nome de arquivo.

```typescript
import { sanitizeFilename } from '../../utils/security';

sanitizeFilename('arquivo<script>.pdf'); // 'arquivo_script_.pdf'
```

#### `validateRequestPayload<T>(payload: T, schema: Record<string, (value: any) => boolean>): { valid: boolean; errors: string[] }`
Valida payload completo com schema.

```typescript
import { validateRequestPayload, validateStringLength, validateEmail } from '../../utils/security';

const payload = {
  name: 'João',
  email: 'joao@example.com',
};

const schema = {
  name: (v: string) => validateStringLength(v, 3, 100),
  email: validateEmail,
};

const result = validateRequestPayload(payload, schema);
if (!result.valid) {
  console.error(result.errors);
}
```

## 🎯 Boas Práticas

1. **Sempre sanitize** dados do usuário antes de processar
2. **Valide no front-end** para melhor UX, mas **nunca confie** apenas nisso
3. **Use validações** antes de enviar para API
4. **Nunca exponha** detalhes de validação ao usuário (pode ajudar atacantes)
5. **Backend sempre valida** - front-end é apenas para UX

## ⚠️ Importante

**Lembre-se**: Estas validações são apenas para melhorar a experiência do usuário. A segurança real está sempre no backend. Nunca confie apenas no front-end para proteger dados sensíveis.
