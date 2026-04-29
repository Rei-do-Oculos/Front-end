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

/** Formata grau óptico: garante sinal + em valores positivos. */
function fmtDiopter(v: unknown): string {
  const s = strCell(v);
  if (!s) return '';
  if (s.startsWith('+') || s.startsWith('-')) return s;
  const n = parseFloat(s.replace(',', '.'));
  if (isNaN(n) || n === 0) return s;
  return `+${s}`;
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

  const borderColor = '#000';
  const cellBorder = `1px solid ${borderColor}`;

  const th: React.CSSProperties = {
    border: cellBorder,
    padding: '2px 1px',
    textAlign: 'center',
    fontWeight: 900,
    fontSize: fs.cell,
    lineHeight: 1.2,
  };
  const td: React.CSSProperties = {
    border: cellBorder,
    padding: isThermal ? '3px 2px' : '4px 2px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: fs.cell,
    lineHeight: 1.25,
  };
  const tdLabel: React.CSSProperties = {
    ...td,
    textAlign: 'center',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  };
  const groupCellWidth = isThermal ? '14px' : '16px';
  const groupLetterSize = isThermal ? 7 : 9;

  const GroupCell = ({ label, rows }: { label: string; rows: number }) => (
    <td
      rowSpan={rows}
      style={{
        border: cellBorder,
        textAlign: 'center',
        verticalAlign: 'middle',
        fontWeight: 900,
        fontSize: groupLetterSize,
        lineHeight: 1.6,
        width: groupCellWidth,
        padding: '2px 1px',
      }}
    >
      {label.split('').map((ch, i) => (
        <div key={i} style={{ lineHeight: 1.5 }}>{ch}</div>
      ))}
    </td>
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

  if (!hasCells) return null;

  return (
    <div
      style={{
        marginBottom: isThermal ? '6px' : '8px',
        width: '100%',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    >
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
          border: cellBorder,
          tableLayout: 'fixed',
          fontFamily: 'inherit',
          boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
        }}
      >
        <thead>
          <tr>
            <th style={{ ...th, width: groupCellWidth, padding: '2px 1px' }} />
            <th style={{ ...th, width: isThermal ? '22px' : '26px' }} />
            <th style={th}>Esférico</th>
            <th style={th}>Cilíndrico</th>
            <th style={th}>Eixo</th>
            <th style={th}>DNP</th>
          </tr>
        </thead>
        <tbody>
          {/* LONGE OD */}
          <tr>
            <GroupCell label="LONGE" rows={2} />
            <td style={tdLabel}>OD</td>
            <td style={td}>{fmtDiopter(src.far_od_spherical)}</td>
            <td style={td}>{fmtDiopter(src.far_od_cylindrical)}</td>
            <td style={td}>{fmtAxis(src.far_od_axis)}</td>
            <td style={td}>{farOdDnp}</td>
          </tr>
          {/* LONGE OE */}
          <tr>
            <td style={tdLabel}>OE</td>
            <td style={td}>{fmtDiopter(src.far_oe_spherical)}</td>
            <td style={td}>{fmtDiopter(src.far_oe_cylindrical)}</td>
            <td style={td}>{fmtAxis(src.far_oe_axis)}</td>
            <td style={td}>{farOeDnp}</td>
          </tr>
          {/* PERTO OD */}
          <tr>
            <GroupCell label="PERTO" rows={2} />
            <td style={tdLabel}>OD</td>
            <td style={td}>{fmtDiopter(src.near_od_spherical)}</td>
            <td style={td}>{fmtDiopter(src.near_od_cylindrical)}</td>
            <td style={td}>{fmtAxis(src.near_od_axis)}</td>
            <td style={td}>{nearOdDnp}</td>
          </tr>
          {/* PERTO OE */}
          <tr>
            <td style={tdLabel}>OE</td>
            <td style={td}>{fmtDiopter(src.near_oe_spherical)}</td>
            <td style={td}>{fmtDiopter(src.near_oe_cylindrical)}</td>
            <td style={td}>{fmtAxis(src.near_oe_axis)}</td>
            <td style={td}>{nearOeDnp}</td>
          </tr>
        </tbody>
      </table>
      {add ? (
        <div
          style={{
            marginTop: '4px',
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
