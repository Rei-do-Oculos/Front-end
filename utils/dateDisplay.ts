/**
 * Formata data da receita / ISO para dd/mm/aaaa sem usar `Date` nem fuso
 * (evita "Invalid Date" quando a API envia `2026-04-12T00:00:00.000000Z` e
 * o código antigo fazia `${iso}T00:00:00`).
 */
export function formatIsoDatePtBr(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = String(iso).trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (brMatch) {
    return s;
  }
  return '';
}

/**
 * Valor para `<input type="date" />`: só aceita `YYYY-MM-DD`.
 * API Laravel costuma enviar `2026-04-12T00:00:00.000000Z` — sem isso o campo fica vazio (placeholder).
 */
export function toHtmlDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = String(iso).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}
