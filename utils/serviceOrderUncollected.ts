import { ServiceOrder } from '../services/api/serviceOrders';

/** OS com laboratório em fluxo ativo pode ser registrada como não retirada. */
export function canArchiveNotPickedUp(order: Pick<ServiceOrder, 'status' | 'laboratory_id'> | null | undefined): boolean {
  if (!order) return false;
  if (order.status === 'completed' || order.status === 'not_picked_up') return false;
  if (!order.laboratory_id) return false;
  return ['pending', 'sent_to_lab', 'ready_for_pickup', 'overdue'].includes(order.status);
}

export interface DeleteServiceOrderOptions {
  register_uncollected?: boolean;
  uncollected_notes?: string;
  block_pickup_payment?: boolean;
}

/** @deprecated Exclusão não registra mais pendência — use canArchiveNotPickedUp. */
export function willCreateUncollectedOnDelete(): boolean {
  return false;
}

/** @deprecated */
export function defaultBlockPickupOnDelete(): boolean {
  return true;
}
