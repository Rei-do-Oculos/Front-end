import React, { forwardRef } from 'react';
import { ServiceOrder } from '../services/api/serviceOrders';
import { ReceiptStore } from './ThermalReceipt';
import { storeReceiptHeader } from '../utils/storeReceiptHeader';
import {
  receiptPaymentLinesFromOrder,
  serviceOrderPaymentMethodLabel,
} from '../utils/receiptPaymentsFromOrder';

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
    const storeColor = store.color || '#dc2626';
    const payLines = receiptPaymentLinesFromOrder(order);
    const totalOs = Number(order.price) || 0;

    return (
      <div
        ref={ref}
        className="service-order-sheet"
        style={{
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          padding: '15mm 18mm',
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '12px',
          color: '#1f2937',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      >
        {/* Cabeçalho: Logo à esquerda | Dados da loja ao centro | Unidade à direita */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          paddingBottom: 16,
          borderBottom: `2px solid ${storeColor}`,
        }}>
          <div style={{ flex: '0 0 auto', minWidth: 0 }}>
            {store.logo ? (
              <img src={store.logo} alt="Logo" style={{ maxHeight: 90, maxWidth: 220, objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: storeColor, letterSpacing: 1 }}>ÓTICA</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>{store.name}</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1, padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 6 }}>
              {storeReceiptHeader(store)}
            </div>
            {(store.logradouro || store.municipio) && (
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                {[store.logradouro, store.numero].filter(Boolean).join(', ')}
                {store.bairro && ` — ${store.bairro}`}
                {(store.municipio || store.uf) && (
                  <span> — {[store.municipio, store.uf].filter(Boolean).join(' - ')}</span>
                )}
              </div>
            )}
            {store.telefone && (
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Tel: {store.telefone}
              </div>
            )}
            {store.cnpj && store.cnpj !== '00.000.000/0000-00' && (
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                CNPJ: {store.cnpj}
              </div>
            )}
          </div>
          <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: 80 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: storeColor }}>
              Nº OS: {formatOsNumber(order.os_number)}
            </div>
          </div>
        </div>

        {/* Dados do cliente */}
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          borderLeft: `4px solid ${storeColor}`,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 32px', alignItems: 'center' }}>
            <span><strong>Cliente:</strong> {client?.name || '-'}</span>
            <span><strong>CPF:</strong> {formatDoc(client?.document)}</span>
            <span><strong>Telefone:</strong> {clientPhone || '-'}</span>
          </div>
        </div>

        {/* Receita Óptica - Longe */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Visão para longe</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, width: 60, textAlign: 'left', fontSize: 11 }}></th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, width: 50, textAlign: 'center', fontSize: 11 }}>O.D</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontSize: 11 }}>Esférico</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontSize: 11 }}>Cilíndrico</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontSize: 11 }}>Eixo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={2} style={{ border: '1px solid #e5e7eb', padding: 10, fontWeight: 600, verticalAlign: 'middle' }}>Longe</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>O.D</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.far_od_spherical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.far_od_cylindrical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{order.far_od_axis || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>O.E</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.far_oe_spherical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.far_oe_cylindrical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{order.far_oe_axis || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Receita Óptica - Perto */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Visão para perto</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, width: 60, textAlign: 'left', fontSize: 11 }}></th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, width: 50, textAlign: 'center', fontSize: 11 }}>O.D</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontSize: 11 }}>Esférico</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontSize: 11 }}>Cilíndrico</th>
                <th style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontSize: 11 }}>Eixo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={3} style={{ border: '1px solid #e5e7eb', padding: 10, fontWeight: 600, verticalAlign: 'middle' }}>Perto</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>O.D</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.near_od_spherical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.near_od_cylindrical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{order.near_od_axis || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>O.E</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.near_oe_spherical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.near_oe_cylindrical)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{order.near_oe_axis || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center', fontWeight: 500 }}>Adição</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10, textAlign: 'center' }}>{formatNum(order.addition)}</td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10 }}></td>
                <td style={{ border: '1px solid #e5e7eb', padding: 10 }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bloco: DNP + Recomendações + Marca */}
        <div style={{
          marginTop: 20,
          padding: 20,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          borderLeft: `4px solid ${storeColor}`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* DNP e Altura */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>DNP e Altura</div>
              <table style={{ width: 'auto', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 20px 4px 0', color: '#6b7280', fontSize: 12 }}>DNP Longe</td>
                    <td style={{ padding: '4px 0', fontWeight: 500 }}>{order.far_dnp || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 20px 4px 0', color: '#6b7280', fontSize: 12 }}>DNP Perto</td>
                    <td style={{ padding: '4px 0', fontWeight: 500 }}>{order.near_dnp || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 20px 4px 0', color: '#6b7280', fontSize: 12 }}>Altura OD</td>
                    <td style={{ padding: '4px 0', fontWeight: 500 }}>{order.od_height || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 20px 4px 0', color: '#6b7280', fontSize: 12 }}>Altura OE</td>
                    <td style={{ padding: '4px 0', fontWeight: 500 }}>{order.oe_height || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recomendação de Lentes - [X] texto puro para renderizar bem no PDF */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Recomenda-se o uso de lentes</div>
              <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {[
                    [
                      { label: 'Visão simples', checked: order.single_vision },
                      { label: 'Bifocais', checked: order.bifocal },
                    ],
                    [
                      { label: 'Multifocais', checked: order.multifocal },
                      { label: 'Anti-reflexo', checked: order.anti_reflective },
                    ],
                    [
                      { label: 'Transitions', checked: order.transitions },
                      { label: 'Armação', checked: order.frame_included },
                    ],
                    [
                      { label: 'Coloração', checked: order.tinting },
                      null,
                    ],
                  ].map((row, i) => (
                    <tr key={i}>
                      {row.map((item, j) => (
                        <React.Fragment key={j}>
                          {item ? (
                            <>
                              <td style={{ padding: '3px 10px 3px 0', verticalAlign: 'middle', width: 28 }}>
                                <span style={{ fontWeight: 700, color: storeColor }}>{item.checked ? '[X]' : '[ ]'}</span>
                              </td>
                              <td style={{ padding: '3px 24px 3px 0', verticalAlign: 'middle', color: '#374151' }}>{item.label}</td>
                            </>
                          ) : (
                            <td colSpan={2} style={{ padding: 0 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Marca da Lente */}
            {lensBrand && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Marca</div>
                <div style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>{lensBrand}</div>
              </div>
            )}

            {/* Total e formas de pagamento (inclui parcial/misto quando salvo na OS) */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Valores e pagamento</div>
              <div style={{ fontSize: 13, color: '#111827', marginBottom: payLines.length > 0 ? 10 : 0 }}>
                <strong>Total:</strong>{' '}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOs)}
              </div>
              {payLines.length > 0 && (
                <table style={{ width: '100%', maxWidth: 420, borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {payLines.map((line, i) => (
                      <tr key={i}>
                        <td style={{ padding: '5px 12px 5px 0', color: '#374151', verticalAlign: 'top' }}>
                          {serviceOrderPaymentMethodLabel(line.payment_method)}
                          {line.payment_method === 'credit_card' && line.installments && line.installments > 1
                            ? ` (${line.installments}x)`
                            : ''}
                        </td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ServiceOrderSheet.displayName = 'ServiceOrderSheet';
