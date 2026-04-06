/**
 * Monta a lista de itens do recibo a partir de uma OS.
 *
 * Regras:
 * - Lentes de laboratório (`laboratory_lenses`) aparecem individualmente com nome e quantidade.
 * - Armações (`frames`) aparecem individualmente com descrição.
 * - "Aro de uso" aparece quando não há armação mas há laboratório (rim_use está preenchido).
 * - Se não houver nenhum item, cai no genérico "Serviço Óptico".
 *
 * O total da OS é distribuído por linha em `price` (unitário) para compatibilidade com NFC-e;
 * o recibo térmico mostra só produto e quantidade por linha, não valor unitário.
 */
export interface ReceiptLineItem {
  description: string;
  quantity: number;
  price: number;
}

export function buildReceiptItemsFromOrder(
  order: {
    price?: number | string | null;
    frames?: any[] | Record<string, any> | null;
    laboratory_lenses?: any[] | Record<string, any> | null;
    rim_use?: any;
  }
): ReceiptLineItem[] {
  const totalPrice =
    typeof order.price === 'number'
      ? order.price
      : parseFloat(String(order.price ?? '0')) || 0;

  const frames: any[] = Array.isArray(order.frames)
    ? order.frames
    : order.frames && typeof order.frames === 'object'
    ? Object.values(order.frames)
    : [];

  const labLenses: any[] = Array.isArray(order.laboratory_lenses)
    ? order.laboratory_lenses
    : order.laboratory_lenses && typeof order.laboratory_lenses === 'object'
    ? Object.values(order.laboratory_lenses)
    : [];

  const lines: ReceiptLineItem[] = [];

  const parseLensQty = (lens: any): number => {
    const raw = lens?.quantity ?? lens?.pivot?.quantity;
    const n = typeof raw === 'string' ? parseInt(raw.trim(), 10) : Number(raw);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(999, Math.floor(n));
  };

  // Lentes de laboratório (ex.: Filtro Azul 1.56 x2)
  labLenses.forEach((lens: any) => {
    const name = lens.name || lens.description || 'Lente';
    lines.push({ description: name, quantity: parseLensQty(lens), price: 0 });
  });

  // Armações do cadastro
  frames.forEach((frame: any) => {
    const desc = frame.description || (frame.code ? `Armação ${frame.code}` : 'Armação');
    lines.push({ description: desc, quantity: 1, price: 0 });
  });

  // Aro de uso: quando não há armação cadastrada mas há laboratório e campo preenchido
  if (frames.length === 0 && labLenses.length > 0 && order.rim_use) {
    lines.push({ description: 'Aro de uso', quantity: 1, price: 0 });
  }

  // Nenhum item → genérico
  if (lines.length === 0) {
    return [{ description: 'Serviço Óptico', quantity: 1, price: totalPrice }];
  }

  // Distribuir o total proporcionalmente ao count de itens (cada linha = 1 unidade de peso)
  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
  const pricePerUnit = totalUnits > 0 ? totalPrice / totalUnits : 0;

  return lines.map((l) => ({
    ...l,
    price: parseFloat((pricePerUnit * l.quantity).toFixed(2)),
  }));
}
