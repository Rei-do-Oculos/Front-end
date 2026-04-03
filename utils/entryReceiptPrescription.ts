/**
 * Monta linhas label/valor para o comprovante de entrada (1ª via).
 * Só inclui campos com valor preenchido.
 */

export interface EntryReceiptPrescriptionSource {
  far_od_spherical?: string | null;
  far_od_cylindrical?: string | null;
  far_od_axis?: string | null;
  far_oe_spherical?: string | null;
  far_oe_cylindrical?: string | null;
  far_oe_axis?: string | null;
  near_od_spherical?: string | null;
  near_od_cylindrical?: string | null;
  near_od_axis?: string | null;
  near_oe_spherical?: string | null;
  near_oe_cylindrical?: string | null;
  near_oe_axis?: string | null;
  addition?: string | null;
  far_dnp?: string | null;
  near_dnp?: string | null;
  frame_code?: string | null;
  rim_use?: boolean | number | string | null;
  warranty?: number | string | null;
  single_vision?: boolean;
  bifocal?: boolean;
  multifocal?: boolean;
  anti_reflective?: boolean;
  transitions?: boolean;
  frame_included?: boolean;
  tinting?: boolean;
  notes?: string | null;
  /** Lentes de estoque (nome) */
  lenses?: Array<{ name?: string | null }>;
}

function strVal(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function rimUseTruthy(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'sim';
}

export function buildPrescriptionLinesForEntryReceipt(
  src: EntryReceiptPrescriptionSource
): Array<{ label: string; value: string }> {
  const lines: Array<{ label: string; value: string }> = [];
  const add = (label: string, raw: unknown) => {
    const v = strVal(raw);
    if (v !== null) lines.push({ label, value: v });
  };

  add('Longe OD — Esférico', src.far_od_spherical);
  add('Longe OD — Cilíndrico', src.far_od_cylindrical);
  add('Longe OD — Eixo', src.far_od_axis);
  add('Longe OE — Esférico', src.far_oe_spherical);
  add('Longe OE — Cilíndrico', src.far_oe_cylindrical);
  add('Longe OE — Eixo', src.far_oe_axis);
  add('Perto OD — Esférico', src.near_od_spherical);
  add('Perto OD — Cilíndrico', src.near_od_cylindrical);
  add('Perto OD — Eixo', src.near_od_axis);
  add('Perto OE — Esférico', src.near_oe_spherical);
  add('Perto OE — Cilíndrico', src.near_oe_cylindrical);
  add('Perto OE — Eixo', src.near_oe_axis);
  add('Adição', src.addition);
  add('DNP longe', src.far_dnp);
  add('DNP perto', src.near_dnp);
  add('Código da armação', src.frame_code);

  if (rimUseTruthy(src.rim_use)) {
    lines.push({ label: 'Uso de aro do cliente', value: 'Sim' });
  }

  if (src.warranty != null && src.warranty !== '') {
    const n = typeof src.warranty === 'number' ? src.warranty : parseInt(String(src.warranty), 10);
    if (!Number.isNaN(n) && n > 0) {
      lines.push({ label: 'Garantia', value: String(n) });
    }
  }

  if (src.single_vision) lines.push({ label: 'Visão simples', value: 'Sim' });
  if (src.bifocal) lines.push({ label: 'Bifocal', value: 'Sim' });
  if (src.multifocal) lines.push({ label: 'Multifocal', value: 'Sim' });
  if (src.anti_reflective) lines.push({ label: 'Antirreflexo', value: 'Sim' });
  if (src.transitions) lines.push({ label: 'Transitions', value: 'Sim' });
  if (src.frame_included) lines.push({ label: 'Armação inclusa', value: 'Sim' });
  if (src.tinting) lines.push({ label: 'Coloração', value: 'Sim' });

  if (Array.isArray(src.lenses)) {
    src.lenses.forEach((l, i) => {
      const n = strVal(l?.name);
      if (n) lines.push({ label: `Lente estoque (${i + 1})`, value: n });
    });
  }

  add('Observações', src.notes);

  return lines;
}
