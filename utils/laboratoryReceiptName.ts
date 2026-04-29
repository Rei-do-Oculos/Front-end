import type { ServiceOrder } from '../services/api/serviceOrders';

/** Nome do laboratório para recibo (apenas texto identificador, sem valores). */
export function laboratoryNameForReceipt(order: ServiceOrder): string | null {
  const direct = order.laboratory?.name?.trim();
  if (direct) return direct;
  const raw = order.laboratory_lenses;
  if (!raw) return null;
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  for (const lens of list) {
    const n = lens?.laboratory?.name?.trim();
    if (n) return n;
  }
  return null;
}

/** Nome do laboratório na pré-visualização do formulário (primeiro laboratório selecionado). */
export function laboratoryNameFromFormSelection(
  laboratoryIds: string[],
  laboratoriesList: Array<{ id: number; name: string }>,
): string | null {
  if (!laboratoryIds.length || !laboratoriesList.length) return null;
  const firstId = laboratoryIds[0];
  const lab = laboratoriesList.find((l) => String(l.id) === String(firstId));
  return lab?.name?.trim() || null;
}
