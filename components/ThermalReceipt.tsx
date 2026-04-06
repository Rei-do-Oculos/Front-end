import React, { forwardRef } from 'react';
import { formatIsoDatePtBr } from '../utils/dateDisplay';
import { storeReceiptHeader, storeReceiptSubtitleLine } from '../utils/storeReceiptHeader';

export interface ReceiptStore {
  name: string;
  fancy_name: string;
  /** Cabeçalho do recibo (opcional); se vazio, usa fancy_name. */
  receipt_header?: string | null;
  cnpj: string;
  ie?: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  telefone?: string | null;
  unity?: string | null;
  logo?: string | null;
  color?: string | null;
}

export interface ReceiptClient {
  name: string;
  document?: string | null;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  /** Preço unitário (uso em NFC-e / totais; não exibido linha a linha no recibo térmico). */
  price: number;
}

export interface ReceiptPayment {
  payment_method: string;
  amount: number;
  installments?: number | null;
}

export interface ReceiptData {
  osNumber: number;
  date: string;
  expectedPickupDate?: string | null;
  seller: string;
  store: ReceiptStore;
  client: ReceiptClient;
  /** Exibidos no recibo quando nome e CRM estão preenchidos */
  doctorName?: string | null;
  doctorCrm?: string | null;
  prescriptionDate?: string | null;
  items: ReceiptItem[];
  total: number;
  paymentMethod?: string | null;
  installments?: number | null;
  payments?: ReceiptPayment[];
}

// Labels para formas de pagamento
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Pagamento na Retirada',
};

interface ThermalReceiptProps {
  data: ReceiptData;
}

// Formatar CNPJ
const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

// Formatar CPF/CNPJ
const formatDocument = (doc: string): string => {
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (cleaned.length === 14) {
    return formatCNPJ(cleaned);
  }
  return doc;
};

// Formatar moeda
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const hasText = (value: string | null | undefined): boolean => Boolean(value && String(value).trim());

// Exibir número da OS exatamente como salvo
const formatOsNumber = (num: number): string => {
  return String(num);
};

/** Texto de uma linha de pagamento (parcial / misto). Sem calcular valor por parcela — só Nx e o total da linha. */
function formatPartialPaymentLine(payment: ReceiptPayment): string {
  const label = PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method;
  const amount = payment.amount;
  if (payment.payment_method === 'credit_card' && payment.installments && payment.installments > 1) {
    return `${label}: ${payment.installments}x, R$ ${formatCurrency(amount)}`;
  }
  return `${label}: R$ ${formatCurrency(amount)}`;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ data }, ref) => {
    const {
      osNumber,
      date,
      expectedPickupDate,
      store,
      client,
      doctorName,
      doctorCrm,
      prescriptionDate,
      items,
      total,
      paymentMethod,
      installments,
      payments,
    } = data;
    const cnpjDigits = (store.cnpj || '').replace(/\D/g, '');
    const addressLine = [store.logradouro, store.numero]
      .filter((part) => hasText(part))
      .join(', ');
    const neighborhood = hasText(store.bairro) ? store.bairro : '';
    const cityUf = [store.municipio, store.uf].filter((part) => hasText(part)).join(' - ');
    const contactLine = [cityUf, hasText(store.telefone) ? store.telefone : '']
      .filter((part) => hasText(part))
      .join(' | ');

    const headerTitle = storeReceiptHeader(store);
    const receiptSubtitle = storeReceiptSubtitleLine(store);

    const heavy = 800 as const;
    const black = '#000';

    const totalUnits = items.reduce((sum, item) => {
      const q = Number(item.quantity);
      return sum + (Number.isFinite(q) && q > 0 ? q : 0);
    }, 0);

    return (
      <div
        ref={ref}
        className="thermal-receipt"
        style={{
          width: '80mm',
          maxWidth: '80mm',
          fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '12px',
          lineHeight: '1.4',
          backgroundColor: 'white',
          color: black,
          fontWeight: heavy,
          padding: '8px',
          boxSizing: 'border-box',
          letterSpacing: '0.02px',
        }}
      >
        {/* Header - Dados da Empresa (tudo em peso alto para impressão térmica legível) */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 900, marginBottom: '4px' }}>
            {headerTitle}
          </div>
          {receiptSubtitle ? (
            <div style={{ fontSize: '11px', fontWeight: heavy }}>{receiptSubtitle}</div>
          ) : null}
          <div style={{ fontSize: '11px', fontWeight: heavy }}>
            CNPJ: {cnpjDigits.length === 14 ? formatCNPJ(cnpjDigits) : (store.cnpj || 'N/I')}
          </div>
          {hasText(addressLine) || hasText(neighborhood) ? (
            <div style={{ fontSize: '11px', fontWeight: heavy }}>
              {addressLine}
              {hasText(addressLine) && hasText(neighborhood) ? ` - ${neighborhood}` : neighborhood}
            </div>
          ) : null}
          {hasText(contactLine) ? (
            <div style={{ fontSize: '11px', fontWeight: heavy }}>
              {contactLine}
            </div>
          ) : null}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Título */}
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '14px', margin: '8px 0' }}>
          RECIBO
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Dados da OS */}
        <div style={{ marginBottom: '8px', fontWeight: heavy }}>
          <div>
            <strong>OS Nº:</strong> {formatOsNumber(osNumber)}
          </div>
          <div>
            <strong>Data:</strong> {date}
          </div>
          {expectedPickupDate && (
            <div style={{ fontWeight: 900 }}>Retirada prevista: {formatIsoDatePtBr(expectedPickupDate)}</div>
          )}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Dados do Cliente */}
        <div style={{ marginBottom: '8px', fontWeight: heavy }}>
          <div style={{ fontWeight: 900, marginBottom: '4px' }}>CONSUMIDOR</div>
          <div style={{ fontWeight: 900 }}>{client.name}</div>
          {client.document && (
            <div style={{ fontWeight: heavy }}>CPF: {formatDocument(client.document)}</div>
          )}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Cabeçalho dos Itens */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginBottom: '4px' }}>
          <span>DESCRIÇÃO</span>
          <span>QTDE</span>
        </div>
        <div style={{ borderTop: '1px solid #000', marginBottom: '4px' }} />

        {/* Itens */}
        {items.length > 0 ? (
          items.map((item, index) => {
            const q = Number(item.quantity);
            const qtyDisplay = Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
            return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2px',
                fontWeight: heavy,
              }}
            >
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingRight: '8px',
                }}
              >
                {item.description}
              </span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: heavy, minWidth: '2.5em', textAlign: 'right' }}>
                {qtyDisplay}
              </span>
            </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', fontWeight: heavy, color: black }}>
            Nenhum item
          </div>
        )}

        {/* Separador */}
        <div style={{ borderTop: '1px solid #000', margin: '8px 0' }} />

        {/* Totais */}
        <div style={{ marginBottom: '8px', fontWeight: heavy }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 900 }}>Qtde. Itens:</span>
            <span style={{ fontWeight: heavy }}>{totalUnits > 0 ? totalUnits : items.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px' }}>
            <span>TOTAL R$:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {hasText(doctorName) && hasText(doctorCrm) ? (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ marginBottom: '8px', fontWeight: heavy }}>
              <div style={{ fontWeight: 900, marginBottom: '4px' }}>Médico:</div>
              <div style={{ fontWeight: 900 }}>{doctorName}</div>
              <div style={{ fontWeight: heavy }}>CRM-{doctorCrm}</div>
              {hasText(prescriptionDate) ? (
                <div style={{ fontWeight: heavy }}>
                  Receita: {new Date(`${prescriptionDate}T00:00:00`).toLocaleDateString('pt-BR')}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {/* Forma de Pagamento */}
        {(payments && payments.length > 0) || paymentMethod ? (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ marginBottom: '8px' }}>
              {payments && payments.length > 0 ? (
                <>
                  <div style={{ fontWeight: 900, marginBottom: '6px' }}>
                    {payments.length > 1 ? 'Pagamento parcial:' : 'PAGAMENTO'}
                  </div>
                  {payments.map((payment, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '11px',
                        fontWeight: heavy,
                        marginBottom: index < payments.length - 1 ? '6px' : '0',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                      }}
                    >
                      {formatPartialPaymentLine(payment)}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 900, marginBottom: '4px' }}>PAGAMENTO</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: heavy }}>
                    <span>{PAYMENT_METHOD_LABELS[paymentMethod!] || paymentMethod}</span>
                    <span>
                      {paymentMethod === 'credit_card' && installments && installments > 1
                        ? `${installments}x, R$ ${formatCurrency(total)}`
                        : `R$ ${formatCurrency(total)}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Rodapé */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ fontWeight: 900, marginBottom: '4px' }}>
            Obrigado pela preferência!
          </div>
          <div style={{ fontSize: '10px', fontWeight: heavy, color: black }}>
            Este documento não tem valor fiscal
          </div>
        </div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
