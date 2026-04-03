/**
 * Título exibido no cabeçalho de recibos/cupons: opcional por loja (`receipt_header`),
 * senão nome fantasia / razão social (`fancy_name`), senão nome curto da loja.
 */
export function storeReceiptHeader(store: {
  receipt_header?: string | null;
  fancy_name?: string | null;
  name?: string | null;
}): string {
  const h = store.receipt_header?.trim();
  if (h) return h;
  const f = store.fancy_name?.trim();
  if (f) return f;
  return store.name?.trim() || 'Loja';
}

function normReceiptLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Linha opcional abaixo do título do recibo (ex.: cidade "SARANDI" quando o título é a marca).
 * Evita repetir o mesmo texto (ex.: "99 Ótica" duas vezes quando name = título).
 */
export function storeReceiptSubtitleLine(store: {
  receipt_header?: string | null;
  fancy_name?: string | null;
  name?: string | null;
}): string | null {
  const title = storeReceiptHeader(store);
  const name = store.name?.trim() || '';
  if (!name || normReceiptLabel(name) === normReceiptLabel(title)) {
    return null;
  }
  return name;
}
