import type { EntryReceiptPrescriptionSource } from './entryReceiptPrescription';
import type { ServiceOrder } from '../services/api/serviceOrders';

function S(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

const GRID_KEYS: (keyof EntryReceiptPrescriptionSource)[] = [
  'far_od_spherical',
  'far_od_cylindrical',
  'far_od_axis',
  'far_oe_spherical',
  'far_oe_cylindrical',
  'far_oe_axis',
  'near_od_spherical',
  'near_od_cylindrical',
  'near_od_axis',
  'near_oe_spherical',
  'near_oe_cylindrical',
  'near_oe_axis',
  'far_dnp',
  'near_dnp',
  'addition',
];

/** Pelo menos um campo de grau, DNP ou adição — exibe tabela RECEITA no recibo. */
export function hasReceiptPrescriptionGridData(
  src: Partial<EntryReceiptPrescriptionSource> | null | undefined
): boolean {
  if (!src) return false;
  return GRID_KEYS.some((k) => S((src as Record<string, unknown>)[k as string]) !== null);
}

/** Subconjunto usado só na grade (evita payload enorme no recibo). */
export function pickPrescriptionGridSource(
  p: Partial<EntryReceiptPrescriptionSource>
): EntryReceiptPrescriptionSource {
  return {
    far_od_spherical: p.far_od_spherical,
    far_od_cylindrical: p.far_od_cylindrical,
    far_od_axis: p.far_od_axis,
    far_oe_spherical: p.far_oe_spherical,
    far_oe_cylindrical: p.far_oe_cylindrical,
    far_oe_axis: p.far_oe_axis,
    near_od_spherical: p.near_od_spherical,
    near_od_cylindrical: p.near_od_cylindrical,
    near_od_axis: p.near_od_axis,
    near_oe_spherical: p.near_oe_spherical,
    near_oe_cylindrical: p.near_oe_cylindrical,
    near_oe_axis: p.near_oe_axis,
    addition: p.addition,
    far_dnp: p.far_dnp,
    near_dnp: p.near_dnp,
  };
}

export function prescriptionGridFromServiceOrder(order: ServiceOrder): EntryReceiptPrescriptionSource {
  return pickPrescriptionGridSource({
    far_od_spherical: order.far_od_spherical,
    far_od_cylindrical: order.far_od_cylindrical,
    far_od_axis: order.far_od_axis,
    far_oe_spherical: order.far_oe_spherical,
    far_oe_cylindrical: order.far_oe_cylindrical,
    far_oe_axis: order.far_oe_axis,
    near_od_spherical: order.near_od_spherical,
    near_od_cylindrical: order.near_od_cylindrical,
    near_od_axis: order.near_od_axis,
    near_oe_spherical: order.near_oe_spherical,
    near_oe_cylindrical: order.near_oe_cylindrical,
    near_oe_axis: order.near_oe_axis,
    addition: order.addition,
    far_dnp: order.far_dnp,
    near_dnp: order.near_dnp,
  });
}
