import React, { forwardRef } from 'react';
import { formatIsoDatePtBr } from '../utils/dateDisplay';
import { storeReceiptHeader } from '../utils/storeReceiptHeader';

export interface EntryReceiptStore {
  name: string;
  fancy_name: string;
  receipt_header?: string | null;
  logradouro: string;
  numero: string;
  telefone?: string | null;
}

export interface EntryReceiptClient {
  name: string;
  telefone?: string | null;
}

export interface EntryReceiptPaymentLine {
  payment_method: string;
  amount: number;
  installments?: number | null;
}

export interface EntryReceiptData {
  osNumber: number;
  date: string;
  expectedPickupDate?: string | null;
  store: EntryReceiptStore;
  client: EntryReceiptClient;
  items: Array<{
    description: string;
    quantity: number;
  }>;
  total: number;
  /** Pagamento único (quando não há linhas em `payments`) */
  paymentMethod?: string | null;
  installments?: number | null;
  /** Pagamento parcial/misto: forma + valor por linha */
  payments?: EntryReceiptPaymentLine[];
  /** Receita/medidas — impresso só na 1ª via (ver `includePrescriptionDetails` no componente) */
  prescriptionLines?: Array<{ label: string; value: string }>;
  /** Após totais, antes do pagamento — quando nome e CRM preenchidos */
  doctorName?: string | null;
  doctorCrm?: string | null;
  prescriptionDate?: string | null;
}

interface EntryReceiptProps {
  data: EntryReceiptData;
  /** false = 2ª via (sem bloco de receita/lentes) */
  includePrescriptionDetails?: boolean;
}

// Formatar moeda
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Formatar número da OS com zeros à esquerda
const formatOsNumber = (num: number): string => {
  return String(num);
};

const hasText = (value: string | null | undefined): boolean => Boolean(value && String(value).trim());

// Labels para formas de pagamento
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Pagamento na Retirada',
};

export const EntryReceipt = forwardRef<HTMLDivElement, EntryReceiptProps>(
  ({ data, includePrescriptionDetails = true }, ref) => {
    const {
      osNumber,
      date,
      expectedPickupDate,
      store,
      client,
      items,
      total,
      paymentMethod,
      installments,
      payments,
      prescriptionLines = [],
      doctorName,
      doctorCrm,
      prescriptionDate,
    } = data;

    const showPrescriptionLines =
      includePrescriptionDetails && prescriptionLines.length > 0;

    return (
      <div
        ref={ref}
        className="entry-receipt"
        style={{
          width: '80mm',
          maxWidth: '80mm',
          fontFamily: "'Arial Black', Arial, 'Helvetica Neue', sans-serif",
          fontSize: '13px',
          lineHeight: '1.4',
          backgroundColor: 'white',
          color: '#000',
          fontWeight: 800,
          padding: '8px',
          boxSizing: 'border-box',
          letterSpacing: '0.15px',
        }}
      >
        {/* Header - Dados da Empresa */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 900, marginBottom: '4px' }}>
            {'>> '}{storeReceiptHeader(store)}{' <<'}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800 }}>
            {store.logradouro}, {store.numero}
          </div>
          {store.telefone && (
            <div style={{ fontSize: '11px', fontWeight: 800 }}>
              WhatsApp: {store.telefone}
            </div>
          )}
        </div>

        {/* Data e Hora */}
        <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 900 }}>
          Data: {date}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Número do Pedido */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Nº do pedido: {formatOsNumber(osNumber)}
          </div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Dados do Cliente */}
        <div style={{ marginBottom: '8px', fontWeight: 800 }}>
          <div><strong>Cliente:</strong> {client.name}</div>
          {client.telefone && (
            <div><strong>Telefone:</strong> {client.telefone}</div>
          )}
        </div>

        {/* Receita e lentes — somente 1ª via */}
        {showPrescriptionLines ? (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ marginBottom: '8px', fontWeight: 800 }}>
              <div style={{ marginBottom: '6px', fontWeight: 900, fontSize: '12px' }}>
                Receita e lentes:
              </div>
              {prescriptionLines.map((line, index) => (
                <div
                  key={`${line.label}-${index}`}
                  style={{ fontWeight: 700, fontSize: '11px', marginBottom: '3px', lineHeight: 1.35 }}
                >
                  <strong>{line.label}:</strong> {line.value}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* Itens/Serviços */}
        {items.length > 0 && (
          <div style={{ marginBottom: '8px', fontWeight: 800 }}>
            <div style={{ marginBottom: '4px', fontWeight: 700 }}>Produtos:</div>
            {items.map((item, index) => (
              <div key={`${item.description}-${index}`} style={{ fontWeight: 700 }}>
                {item.description}
                {item.description === 'Aro de uso' ? '' : ` x${item.quantity}`}
              </div>
            ))}
          </div>
        )}

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Valor */}
        <div style={{ marginBottom: '8px' }}>
          <div><strong>Valor em produtos:</strong> R$ {formatCurrency(total)}</div>
          <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
            Total: R$ {formatCurrency(total)}
          </div>
        </div>

        {hasText(doctorName) && hasText(doctorCrm) ? (
          <div style={{ marginBottom: '8px', fontWeight: 800 }}>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ fontWeight: 900, marginBottom: '4px', fontSize: '12px' }}>Médico:</div>
            <div style={{ fontWeight: 800, fontSize: '11px' }}>{doctorName}</div>
            <div style={{ fontWeight: 800, fontSize: '11px' }}>CRM-{doctorCrm}</div>
            {hasText(prescriptionDate) ? (
              <div style={{ fontWeight: 800, fontSize: '11px' }}>
                Receita: {new Date(`${prescriptionDate}T00:00:00`).toLocaleDateString('pt-BR')}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Pagamento parcial/misto */}
        {payments && payments.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ marginBottom: '4px', fontWeight: 900 }}>
              {payments.length > 1 ? 'Pagamento parcial:' : 'Pagamento:'}
            </div>
            {payments.map((p, index) => (
              <div key={index} style={{ fontWeight: 800, marginBottom: '2px', fontSize: '12px' }}>
                {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                {p.payment_method === 'credit_card' && p.installments && p.installments > 1
                  ? ` (${p.installments}x)`
                  : ''}
                : R$ {formatCurrency(p.amount)}
              </div>
            ))}
          </div>
        )}

        {/* Pagamento único */}
        {!payments?.length && paymentMethod && (
          <div style={{ marginBottom: '8px' }}>
            <div>
              <strong>Pagamento:</strong> {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
              {paymentMethod === 'credit_card' && installments && installments > 1
                ? ` (${installments}x)`
                : ''}
            </div>
          </div>
        )}

        {/* Previsão de Entrega */}
        {expectedPickupDate && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>
              Previsão de entrega: {formatIsoDatePtBr(expectedPickupDate)}
            </div>
          </div>
        )}

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />

        {/* Assinatura */}
        <div style={{ marginTop: '24px', marginBottom: '8px' }}>
          <div style={{ 
            borderBottom: '1px solid #000', 
            width: '100%', 
            height: '30px' 
          }} />
          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px' }}>
            Assinatura do cliente
          </div>
        </div>
      </div>
    );
  }
);

EntryReceipt.displayName = 'EntryReceipt';

export default EntryReceipt;
