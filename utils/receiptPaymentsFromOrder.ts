import type { ServiceOrder } from '../services/api/serviceOrders';

export type ReceiptPaymentLine = {
  payment_method: string;
  amount: number;
  installments?: number | null;
};

function toArray<T>(val: T[] | Record<string, T> | null | undefined): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return Object.values(val);
}

/** Linhas salvas em `service_order_payments` (parcial/misto). Normaliza objeto JSON vs array. */
export type PersistedServiceOrderPaymentRow = {
  id?: number;
  payment_method: string;
  amount: number;
  installments: number | null;
};

export function persistedPaymentsFromServiceOrder(order: ServiceOrder): PersistedServiceOrderPaymentRow[] {
  const raw = toArray(order.payments) as Array<{
    id?: number;
    payment_method?: string;
    amount?: number | string;
    installments?: number | null;
  }>;
  return raw
    .filter((p) => p && p.payment_method)
    .map((p) => ({
      id: p.id,
      payment_method: String(p.payment_method),
      amount: Number(p.amount) || 0,
      installments: p.installments != null ? Number(p.installments) : null,
    }));
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Pagamento na Retirada',
};

export function serviceOrderPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

/**
 * Monta linhas de pagamento para o recibo térmico.
 * Prioriza `receipt_payments` (API: pivot ou fallback payment_method + price), depois `payments`.
 */
export function receiptPaymentLinesFromOrder(order: ServiceOrder): ReceiptPaymentLine[] {
  const rp = toArray(
    (order as ServiceOrder & { receipt_payments?: unknown }).receipt_payments
  ) as Array<{
    payment_method: string;
    amount: number | string;
    installments?: number | null;
  }>;
  if (rp.length > 0) {
    return rp.map((p) => ({
      payment_method: p.payment_method,
      amount: Number(p.amount) || 0,
      installments: p.installments ?? null,
    }));
  }

  const legacy = toArray(order.payments);
  if (legacy.length > 0) {
    return legacy.map((p) => ({
      payment_method: p.payment_method,
      amount: Number(p.amount) || 0,
      installments: p.installments ?? null,
    }));
  }

  return [];
}
