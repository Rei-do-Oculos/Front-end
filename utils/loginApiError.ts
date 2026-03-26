/**
 * Mensagem amigável para falha de login (Axios, Laravel, ResponseHelper).
 */

function normalize(msg: string): string {
  const t = msg.trim();
  if (t === 'The provided credentials are incorrect.') return 'E-mail ou senha inválidos.';
  return t;
}

function pickFromErrorsObject(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object') return null;
  const o = errors as Record<string, unknown>;
  const msg = o.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
  for (const key of ['email', 'password']) {
    const v = o[key];
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    if (typeof v === 'string' && v.trim()) return v;
  }
  for (const v of Object.values(o)) {
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

/**
 * Extrai texto de erro a partir da resposta da API de login ou de um Error já montado.
 */
export function extractLoginFailureMessage(err: unknown): string {
  const e = err as {
    message?: string;
    response?: { data?: unknown; status?: number };
    code?: string;
  };

  if (!e?.response) {
    if (e?.message?.includes('Network Error') || e?.code === 'ERR_NETWORK') {
      return 'Erro de conexão. Verifique se o servidor está acessível.';
    }
    if (e?.message?.includes('CORS')) {
      return 'Erro de CORS. Verifique a configuração do servidor.';
    }
    if (typeof e?.message === 'string' && e.message.trim()) {
      return normalize(e.message);
    }
    return 'Não foi possível entrar. Tente novamente.';
  }

  let d = e.response.data;

  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        d = JSON.parse(trimmed) as object;
      } catch {
        return trimmed.slice(0, 280) || 'Não foi possível entrar.';
      }
    } else {
      return trimmed.slice(0, 280) || 'Não foi possível entrar.';
    }
  }

  if (!d || typeof d !== 'object') {
    return 'E-mail ou senha inválidos.';
  }

  const body = d as Record<string, unknown>;

  const fromFlat = pickFromErrorsObject(body.errors);
  if (fromFlat) return normalize(fromFlat);

  if (typeof body.message === 'string' && body.message.trim()) {
    return normalize(body.message);
  }

  const inner = body.data;
  if (inner && typeof inner === 'object') {
    const innerObj = inner as Record<string, unknown>;
    const fromNested = pickFromErrorsObject(innerObj.errors);
    if (fromNested) return normalize(fromNested);
    if (typeof innerObj.message === 'string' && innerObj.message.trim()) {
      return normalize(innerObj.message);
    }
  }

  return 'E-mail ou senha inválidos.';
}
