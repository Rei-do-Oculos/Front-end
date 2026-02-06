import React, { forwardRef } from 'react';
import { ServiceOrder } from '../services/api/serviceOrders';
import { ReceiptStore } from './ThermalReceipt';

interface ServiceOrderSheetProps {
  order: ServiceOrder;
  store: ReceiptStore;
  clientPhone?: string | null;
}

const formatNum = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined || v === '') return '';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '' : n.toFixed(2);
};

const formatDoc = (doc: string | null | undefined): string => {
  if (!doc) return '';
  const c = String(doc).replace(/\D/g, '');
  if (c.length === 11) return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  if (c.length === 14) return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  return doc;
};

const formatOsNumber = (n: number): string => String(n).padStart(4, '0');

export const ServiceOrderSheet = forwardRef<HTMLDivElement, ServiceOrderSheetProps>(
  ({ order, store, clientPhone }, ref) => {
    const client = order.client;
    const lensBrand = order.laboratory_lenses?.[0]?.name || '';

    return (
      <div
        ref={ref}
        className="service-order-sheet"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '16mm',
          fontFamily: "'Times New Roman', serif",
          fontSize: '11px',
          color: '#000',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      >
        {/* Cabeçalho: Logo + Rede + Unidade */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            {store.logo ? (
              <img src={store.logo} alt="Logo" style={{ maxHeight: 48, maxWidth: 120 }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#c00' }}>ÓTICA</span>
                <span style={{ fontFamily: 'cursive', fontSize: 16, marginTop: 2 }}>Rei do Óculos</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
              REDE REI DO ÓCULOS
            </div>
          </div>
          <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 12 }}>
            {store.fancy_name || store.name}
          </div>
        </div>

        {/* Cliente e OS */}
        <div style={{ marginBottom: 16, border: '1px solid #000', padding: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px' }}>
            <span><strong>CLIENTE:</strong> {client?.name || '-'}</span>
            <span><strong>CPF:</strong> {formatDoc(client?.document)}</span>
            <span><strong>TELEFONE:</strong> {clientPhone || '-'}</span>
            <span><strong>N° OS:</strong> {formatOsNumber(order.os_number)}</span>
          </div>
        </div>

        {/* Receita - Longe */}
        <div style={{ marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: 6, width: 50 }}>LONGE</th>
                <th style={{ border: '1px solid #000', padding: 6, width: 40 }}></th>
                <th style={{ border: '1px solid #000', padding: 6 }}>ESFÉRICO</th>
                <th style={{ border: '1px solid #000', padding: 6 }}>CILÍNDRICO</th>
                <th style={{ border: '1px solid #000', padding: 6 }}>EIXO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: 6 }} rowSpan={2}>LONGE</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>O.D</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.far_od_spherical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.far_od_cylindrical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{order.far_od_axis || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: 6 }}>O.E</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.far_oe_spherical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.far_oe_cylindrical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{order.far_oe_axis || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Receita - Perto */}
        <div style={{ marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: 6, width: 50 }}>PERTO</th>
                <th style={{ border: '1px solid #000', padding: 6, width: 40 }}></th>
                <th style={{ border: '1px solid #000', padding: 6 }}>ESFÉRICO</th>
                <th style={{ border: '1px solid #000', padding: 6 }}>CILÍNDRICO</th>
                <th style={{ border: '1px solid #000', padding: 6 }}>EIXO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: 6 }} rowSpan={3}>PERTO</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>O.D</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.near_od_spherical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.near_od_cylindrical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{order.near_od_axis || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: 6 }}>O.E</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.near_oe_spherical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.near_oe_cylindrical)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{order.near_oe_axis || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: 6 }}>ADIÇÃO</td>
                <td style={{ border: '1px solid #000', padding: 6 }}>{formatNum(order.addition)}</td>
                <td style={{ border: '1px solid #000', padding: 6 }}></td>
                <td style={{ border: '1px solid #000', padding: 6 }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DNP */}
        <div style={{ marginBottom: 16 }}>
          <strong>DNP:</strong>
          <table style={{ display: 'inline-table', marginLeft: 8, borderCollapse: 'collapse', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: 4, minWidth: 80 }}>LONGE</td>
                <td style={{ border: '1px solid #000', padding: 4, minWidth: 80 }}>{order.far_dnp || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: 4 }}>PERTO</td>
                <td style={{ border: '1px solid #000', padding: 4 }}>{order.near_dnp || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recomendação de Lentes */}
        <div style={{ marginBottom: 16 }}>
          <strong>RECOMENDA-SE O USO DE LENTES:</strong>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '16px 24px' }}>
            <span>({order.single_vision ? 'X' : ' '}) VISÃO SIMPLES</span>
            <span>({order.bifocal ? 'X' : ' '}) BIFOCAIS</span>
            <span>({order.multifocal ? 'X' : ' '}) MULTIFOCAIS</span>
            <span>({order.anti_reflective ? 'X' : ' '}) ANTI-REFLEXO</span>
            <span>({order.transitions ? 'X' : ' '}) TRANSITIONS</span>
            <span>({order.frame_included ? 'X' : ' '}) ARMAÇÃO</span>
            <span>({order.tinting ? 'X' : ' '}) COLORAÇÃO</span>
          </div>
        </div>

        {/* Marca da Lente */}
        {lensBrand && (
          <div>
            <strong>MARCA</strong>
            <div style={{ marginTop: 4, borderBottom: '1px solid #000', minHeight: 24 }}>
              {lensBrand}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ServiceOrderSheet.displayName = 'ServiceOrderSheet';
