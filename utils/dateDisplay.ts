/**
 * Formata YYYY-MM-DD para dd/mm/aaaa sem usar timezone (evita dia errado no recibo).
 */
export function formatIsoDatePtBr(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = String(iso).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}
