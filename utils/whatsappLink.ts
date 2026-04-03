/** URL do WhatsApp Web/App a partir do telefone (Brasil: DDD + número, com ou sem 55). */
export function whatsappHrefFromPhone(phone: string | null | undefined): string | null {
  if (phone == null || String(phone).trim() === '') return null;
  let d = String(phone).replace(/\D/g, '');
  if (d.length < 10) return null;
  if (d.startsWith('55') && d.length >= 12) {
    return `https://wa.me/${d}`;
  }
  if (d.length === 10 || d.length === 11) {
    return `https://wa.me/55${d}`;
  }
  return `https://wa.me/${d}`;
}
