import React, { forwardRef } from 'react';

export interface ReceiptStore {
  name: string;
  fancy_name: string;
  cnpj: string;
  ie?: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  telefone?: string | null;
}

export interface ReceiptClient {
  name: string;
  document?: string | null;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  osNumber: number;
  date: string;
  seller: string;
  store: ReceiptStore;
  client: ReceiptClient;
  items: ReceiptItem[];
  total: number;
  paymentMethod?: string | null;
  installments?: number | null;
}

// Labels para formas de pagamento
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
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

// Formatar número da OS com zeros à esquerda
const formatOsNumber = (num: number): string => {
  return String(num).padStart(4, '0');
};

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ data }, ref) => {
    const { osNumber, date, seller, store, client, items, total, paymentMethod, installments } = data;

    return (
      <div
        ref={ref}
        className="thermal-receipt"
        style={{
          width: '80mm',
          maxWidth: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          lineHeight: '1.4',
          backgroundColor: 'white',
          color: 'black',
          padding: '8px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header - Dados da Empresa */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            {store.fancy_name || store.name}
          </div>
          <div style={{ fontSize: '11px' }}>
            {store.name}
          </div>
          <div style={{ fontSize: '11px' }}>
            CNPJ: {formatCNPJ(store.cnpj)}
            {store.ie && ` IE: ${store.ie}`}
          </div>
          <div style={{ fontSize: '10px' }}>
            {store.logradouro}, {store.numero} - {store.bairro}
          </div>
          <div style={{ fontSize: '10px' }}>
            {store.municipio} - {store.uf}
            {store.telefone && ` | ${store.telefone}`}
          </div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Título */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', margin: '8px 0' }}>
          RECIBO
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Dados da OS */}
        <div style={{ marginBottom: '8px' }}>
          <div>OS Nº: {formatOsNumber(osNumber)}</div>
          <div>Data: {date}</div>
          <div>Vendedor: {seller}</div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Dados do Cliente */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CLIENTE</div>
          <div>Nome: {client.name}</div>
          {client.document && (
            <div>CPF: {formatDocument(client.document)}</div>
          )}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Cabeçalho dos Itens */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
          <span>DESCRIÇÃO</span>
          <span>VALOR</span>
        </div>
        <div style={{ borderTop: '1px solid #000', marginBottom: '4px' }} />

        {/* Itens */}
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {item.quantity}x {item.description}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>
                {formatCurrency(item.price)}
              </span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
            Nenhum item
          </div>
        )}

        {/* Separador */}
        <div style={{ borderTop: '1px solid #000', margin: '8px 0' }} />

        {/* Totais */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Qtde. Itens:</span>
            <span>{items.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
            <span>TOTAL R$:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Forma de Pagamento */}
        {paymentMethod && (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>PAGAMENTO</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}</span>
                <span>
                  {paymentMethod === 'credit_card' && installments && installments > 1
                    ? `${installments}x de ${formatCurrency(total / installments)}`
                    : formatCurrency(total)
                  }
                </span>
              </div>
            </div>
          </>
        )}

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Rodapé */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Obrigado pela preferência!
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Este documento não tem valor fiscal
          </div>
        </div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
