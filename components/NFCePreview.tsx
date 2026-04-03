import React, { forwardRef } from 'react';
import { storeReceiptHeader, storeReceiptSubtitleLine } from '../utils/storeReceiptHeader';

export interface NFCeStore {
  name: string;
  fancy_name: string;
  receipt_header?: string | null;
  cnpj: string;
  ie?: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  telefone?: string | null;
}

export interface NFCeClient {
  name?: string | null;
  document?: string | null;
}

export interface NFCeItem {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface NFCeData {
  store: NFCeStore;
  client?: NFCeClient;
  items: NFCeItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change?: number;
  // Dados fiscais (simulados)
  nfceNumber?: number;
  series?: number;
  accessKey?: string;
  authProtocol?: string;
  authDate?: string;
  qrCodeUrl?: string;
  // Tributos
  federalTax?: number;
  stateTax?: number;
  municipalTax?: number;
}

// Formatar CNPJ
const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

// Formatar CPF
const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return cpf;
};

// Formatar moeda
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Formatar chave de acesso (44 dígitos em grupos de 4)
const formatAccessKey = (key: string): string => {
  const cleaned = key.replace(/\D/g, '');
  return cleaned.match(/.{1,4}/g)?.join(' ') || key;
};

interface NFCePreviewProps {
  data: NFCeData;
}

export const NFCePreview = forwardRef<HTMLDivElement, NFCePreviewProps>(
  ({ data }, ref) => {
    const {
      store,
      client,
      items,
      subtotal,
      discount = 0,
      total,
      paymentMethod,
      amountPaid,
      change = 0,
      nfceNumber = 10420,
      series = 1,
      accessKey = '41260130060044001786500100001042012449824 76',
      authProtocol = '141260113979101',
      authDate,
      qrCodeUrl,
      federalTax = 0,
      stateTax = 0,
      municipalTax = 0,
    } = data;

    const now = new Date();
    const dateStr = authDate || now.toLocaleString('pt-BR');
    const nfceSubtitle = storeReceiptSubtitleLine(store);

    return (
      <div
        ref={ref}
        className="nfce-preview"
        style={{
          width: '80mm',
          maxWidth: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          lineHeight: '1.4',
          backgroundColor: 'white',
          color: '#000',
          fontWeight: 600,
          padding: '8px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header - Dados da Empresa (alinhado ao recibo térmico) */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
            {storeReceiptHeader(store)}
          </div>
          {nfceSubtitle ? (
            <div style={{ fontSize: '11px', fontWeight: 600 }}>{nfceSubtitle}</div>
          ) : null}
          <div style={{ fontSize: '11px', fontWeight: 600 }}>
            CNPJ: {formatCNPJ(store.cnpj)}
            {store.ie && ` IE: ${store.ie}`}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600 }}>
            {store.logradouro}, {store.numero} - {store.bairro}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600 }}>
            {store.municipio}, {store.uf}
            {store.telefone && ` - Fone: ${store.telefone}`}
          </div>
          <div style={{ fontSize: '11px', marginTop: '6px', fontWeight: 700 }}>
            Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>#CODIGO</span>
            <span>DESCRIÇÃO</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>QTD</span>
            <span>UN</span>
            <span>VL.UNIT</span>
            <span>VL.TOTAL</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: '6px', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{String(index + 1).padStart(3, '0')} {item.code}</span>
              <span style={{ flex: 1, marginLeft: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.description}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '20px', marginTop: '2px' }}>
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #000', margin: '8px 0' }} />

        <div style={{ fontSize: '12px', fontWeight: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Qtde. Total de Itens</span>
            <span>{items.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Valor Total R$</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Desconto R$</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
            <span>Valor a Pagar R$</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>FORMA DE PAGAMENTO</span>
              <span>VALOR PAGO R$</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{paymentMethod}</span>
              <span>{formatCurrency(amountPaid)}</span>
            </div>
          </div>
          {change > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
              <span>Troco R$</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Consulte pela chave de acesso em</div>
          <div style={{ fontSize: '10px', fontWeight: 600 }}>http://www.fazenda.pr.gov.br/nfce/consulta</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, margin: '8px 0', wordBreak: 'break-all', letterSpacing: '0.02em' }}>
          {formatAccessKey(accessKey)}
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
          {client?.name ? (
            <>
              <div>{client.name}</div>
              {client.document && <div>CPF: {formatCPF(client.document)}</div>}
            </>
          ) : (
            <div>CONSUMIDOR NÃO IDENTIFICADO</div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '8px auto',
        }}>
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code NFC-e"
              width={96}
              height={96}
              style={{ display: 'block', imageRendering: 'pixelated' }}
            />
          ) : (
            <div style={{
              width: '96px',
              height: '96px',
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              textAlign: 'center',
            }}>
              [QR CODE]<br />
              NFC-e
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
          <div style={{ fontWeight: 700, fontSize: '12px' }}>
            NFC-e nº {String(nfceNumber).padStart(6, '0')}
          </div>
          <div>Série {String(series).padStart(3, '0')}</div>
          <div>{dateStr}</div>
          <div>Via Consumidor</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Protocolo de autorização:</div>
          <div>{authProtocol}</div>
          <div>Data de autorização: {dateStr}</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, lineHeight: 1.35 }}>
          <div>
            Trib Aprox R$ {formatCurrency(federalTax)} Fed. e R$ {formatCurrency(stateTax)} Est. e R$ {formatCurrency(municipalTax)} Mun.
          </div>
          <div>Fonte: IBPT</div>
        </div>
      </div>
    );
  }
);

NFCePreview.displayName = 'NFCePreview';

export default NFCePreview;
