import React from 'react';
import type { EntryReceiptPrescriptionSource } from '../utils/entryReceiptPrescription';

export type ReceiptPrescriptionTableVariant = 'thermal' | 'entry';

interface ReceiptPrescriptionTableProps {
  src: EntryReceiptPrescriptionSource;
  variant: ReceiptPrescriptionTableVariant;
}

function strCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/** Alguma célula da grade (grau ou DNP), sem contar adição. */
function hasRxTableCells(src: EntryReceiptPrescriptionSource): boolean {
  return [
    src.far_od_spherical,
    src.far_od_cylindrical,
    src.far_od_axis,
    src.far_oe_spherical,
    src.far_oe_cylindrical,
    src.far_oe_axis,
    src.near_od_spherical,
    src.near_od_cylindrical,
    src.near_od_axis,
    src.near_oe_spherical,
    src.near_oe_cylindrical,
    src.near_oe_axis,
    src.far_dnp,
    src.near_dnp,
  ].some((v) => strCell(v) !== '');
}

/** DNP no formato "od/oe" ou valor único repetido nas duas colunas. */
function splitDnpPair(raw: unknown): [string, string] {
  const s = strCell(raw);
  if (!s) return ['', ''];
  const parts = s.split(/\s*\/\s*/).map((p) => p.trim());
  if (parts.length >= 2 && parts[0] && parts[1]) return [parts[0], parts[1]];
  return [s, s];
}

function fmtAxis(v: unknown): string {
  const s = strCell(v);
  if (!s) return '';
  if (/[°º]/.test(s)) return s;
  return `${s}º`;
}

export const ReceiptPrescriptionTable: React.FC<ReceiptPrescriptionTableProps> = ({
  src,
  variant,
}) => {
  const [farOdDnp, farOeDnp] = splitDnpPair(src.far_dnp);
  const [nearOdDnp, nearOeDnp] = splitDnpPair(src.near_dnp);
  const isThermal = variant === 'thermal';
  const fs = isThermal
    ? { title: 10, cell: 7, add: 8 }
    : { title: 12, cell: 9, add: 10 };

  const th: React.CSSProperties = {
    border: '1px solid #000',
    padding: '2px 1px',
    textAlign: 'center',
    fontWeight: 900,
    fontSize: fs.cell,
    lineHeight: 1.2,
  };
  const td: React.CSSProperties = {
    border: '1px solid #000',
    padding: '2px 2px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: fs.cell,
    lineHeight: 1.25,
  };
  const tdLabel: React.CSSProperties = {
    ...td,
    textAlign: 'left',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  };

  const row = (
    label: string,
    esf: unknown,
    cil: unknown,
    eixo: unknown,
    dnp: string,
    altura = ''
  ) => (
    <tr key={label}>
      <td style={tdLabel}>{label}</td>
      <td style={td}>{strCell(esf)}</td>
      <td style={td}>{strCell(cil)}</td>
      <td style={td}>{fmtAxis(eixo)}</td>
      <td style={td}>{dnp}</td>
      <td style={td}>{altura}</td>
    </tr>
  );

  const add = strCell(src.addition);
  const hasCells = hasRxTableCells(src);

  if (!hasCells && add) {
    return (
      <div style={{ marginBottom: isThermal ? '6px' : '8px', width: '100%' }}>
        <div
          style={{
            textAlign: 'center',
            fontWeight: 900,
            marginBottom: '4px',
            fontSize: fs.title,
            letterSpacing: '0.05em',
          }}
        >
          RECEITA
        </div>
        <div style={{ fontSize: fs.add, fontWeight: 800 }}>Adição: {add}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: isThermal ? '6px' : '8px', width: '100%' }}>
      <div
        style={{
          textAlign: 'center',
          fontWeight: 900,
          marginBottom: '4px',
          fontSize: fs.title,
          letterSpacing: '0.05em',
        }}
      >
        RECEITA
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          fontFamily: 'inherit',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...th, width: isThermal ? '22%' : '20%' }} />
            <th style={th}>Esférico</th>
            <th style={th}>Cilíndrico</th>
            <th style={th}>Eixo</th>
            <th style={th}>DNP *</th>
            <th style={th}>Altura</th>
          </tr>
        </thead>
        <tbody>
          {row('Longe OD', src.far_od_spherical, src.far_od_cylindrical, src.far_od_axis, farOdDnp)}
          {row('Longe OE', src.far_oe_spherical, src.far_oe_cylindrical, src.far_oe_axis, farOeDnp)}
          {row('Perto OD', src.near_od_spherical, src.near_od_cylindrical, src.near_od_axis, nearOdDnp)}
          {row('Perto OE', src.near_oe_spherical, src.near_oe_cylindrical, src.near_oe_axis, nearOeDnp)}
        </tbody>
      </table>
      {add ? (
        <div
          style={{
            marginTop: '6px',
            fontSize: fs.add,
            fontWeight: 800,
            textAlign: 'left',
          }}
        >
          Adição: {add}
        </div>
      ) : null}
    </div>
  );
};
