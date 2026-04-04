/**
 * Regras alinhadas ao backend (InvoiceService::validateCanGenerateInvoice):
 * pode gerar NF-e nova se não tem nota, valor > 0, can_generate_invoice !== false,
 * e (OS finalizada OU pagamento informado diferente de "na retirada").
 */

import type { ServiceOrder } from '../services/api/serviceOrders';

export type NfeEligibilitySnapshot = {
  status?: string | null;
  price?: number | string | null;
  payment_method?: string | null;
  payments?: Array<{ payment_method?: string | null }> | null;
  can_generate_invoice?: boolean | null;
  invoice_id?: number | null;
  invoice?: unknown;
};

/** API às vezes serializa `payments` como objeto `{ "0": {...} }` em vez de array. */
export function normalizeOrderPayments(
  payments: unknown
): Array<{ payment_method?: string | null }> {
  if (!payments) return [];
  if (Array.isArray(payments)) return payments;
  if (typeof payments === 'object') {
    return Object.values(payments as Record<string, { payment_method?: string | null }>);
  }
  return [];
}

function parsePrice(price: number | string | null | undefined): number {
  if (price === null || price === undefined) return 0;
  if (typeof price === 'number') return Number.isFinite(price) ? price : 0;
  const n = parseFloat(String(price).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function orderHasInvoice(o: Pick<NfeEligibilitySnapshot, 'invoice_id' | 'invoice'>): boolean {
  return !!(o.invoice_id || o.invoice);
}

/** Pelo menos uma forma de pagamento que não seja só "na retirada". */
export function hasNonPickupPayment(snapshot: NfeEligibilitySnapshot): boolean {
  const rows = normalizeOrderPayments(snapshot.payments);
  if (rows.length > 0) {
    return rows.some((p) => (p.payment_method ?? '') !== 'on_pickup');
  }
  const m = snapshot.payment_method ?? '';
  return m !== '' && m !== 'on_pickup';
}

/**
 * Possui alguma parcela pendente de "Pagamento na Retirada".
 * Enquanto existir, a NF-e não pode ser emitida (valor não foi totalmente recebido).
 */
export function hasPickupPaymentPending(snapshot: NfeEligibilitySnapshot): boolean {
  const rows = normalizeOrderPayments(snapshot.payments);
  if (rows.length > 0) {
    return rows.some((p) => (p.payment_method ?? '') === 'on_pickup');
  }
  return (snapshot.payment_method ?? '') === 'on_pickup';
}

/**
 * Pode emitir nova NF-e (ainda sem nota vinculada).
 */
export function isEligibleToEmitNewNfe(snapshot: NfeEligibilitySnapshot): boolean {
  if (orderHasInvoice(snapshot)) return false;
  if (snapshot.can_generate_invoice === false) return false;
  if (parsePrice(snapshot.price) <= 0) return false;
  // OS finalizada (completed) significa que foi retirada e o valor foi recebido integralmente.
  if (snapshot.status === 'completed') return true;
  // Enquanto houver parcela "na retirada" pendente, o valor não foi 100% recebido.
  if (hasPickupPaymentPending(snapshot)) return false;
  return hasNonPickupPayment(snapshot);
}

/**
 * Exibir opção NF-e no modal: imprimir nota existente OU elegível para gerar nova.
 */
export function canShowNfeOptionInReceiptModal(snapshot: NfeEligibilitySnapshot): boolean {
  return orderHasInvoice(snapshot) || isEligibleToEmitNewNfe(snapshot);
}

/** Snapshot a partir da OS retornada pela API (lista, detalhe, impressão). */
export function nfeEligibilitySnapshotFromServiceOrder(o: ServiceOrder): NfeEligibilitySnapshot {
  const paymentRows = normalizeOrderPayments((o as ServiceOrder & { payments?: unknown }).payments);
  return {
    status: o.status,
    price: o.price,
    payment_method: o.payment_method,
    payments: paymentRows.map((p) => ({ payment_method: p.payment_method })),
    invoice_id: o.invoice_id,
    invoice: o.invoice,
    can_generate_invoice: o.can_generate_invoice,
  };
}
