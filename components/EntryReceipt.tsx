import React, { forwardRef } from 'react';

export interface EntryReceiptStore {
  name: string;
  fancy_name: string;
  logradouro: string;
  numero: string;
  telefone?: string | null;
}

export interface EntryReceiptClient {
  name: string;
  telefone?: string | null;
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
  paymentMethod?: string | null;
}

interface EntryReceiptProps {
  data: EntryReceiptData;
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
  ({ data }, ref) => {
    const { osNumber, date, expectedPickupDate, store, client, items, total, paymentMethod } = data;

    return (
      <div
        ref={ref}
        className="entry-receipt"
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
            {'>> '}{store.fancy_name || store.name}{' <<'}
          </div>
          <div style={{ fontSize: '10px' }}>
            {store.logradouro}, {store.numero}
          </div>
          {store.telefone && (
            <div style={{ fontSize: '10px' }}>
              WhatsApp: {store.telefone}
            </div>
          )}
        </div>

        {/* Data e Hora */}
        <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '11px' }}>
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
        <div style={{ marginBottom: '8px' }}>
          <div>Cliente: {client.name}</div>
          {client.telefone && (
            <div>Telefone: {client.telefone}</div>
          )}
        </div>

        {/* Itens/Serviços */}
        {items.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ marginBottom: '4px' }}>Produtos:</div>
            {items.map((item, index) => (
              <div key={`${item.description}-${index}`}>
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
          <div>Valor em produtos: R$ {formatCurrency(total)}</div>
          <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
            Total: R$ {formatCurrency(total)}
          </div>
        </div>

        {/* Forma de Pagamento */}
        {paymentMethod && (
          <div style={{ marginBottom: '8px' }}>
            <div>Pagamento: {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}</div>
          </div>
        )}

        {/* Previsão de Entrega */}
        {expectedPickupDate && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>
              Previsão de entrega: {new Date(expectedPickupDate).toLocaleDateString('pt-BR')}
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
