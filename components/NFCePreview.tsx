import React, { forwardRef } from 'react';

export interface NFCeStore {
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

    return (
      <div
        ref={ref}
        className="nfce-preview"
        style={{
          width: '80mm',
          maxWidth: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '11px',
          lineHeight: '1.3',
          backgroundColor: 'white',
          color: 'black',
          padding: '8px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header - Dados da Empresa */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
            {store.fancy_name || store.name}
          </div>
          <div style={{ fontSize: '10px' }}>
            {store.name}
          </div>
          <div style={{ fontSize: '10px' }}>
            CNPJ: {formatCNPJ(store.cnpj)}
            {store.ie && ` IE: ${store.ie}`}
          </div>
          <div style={{ fontSize: '9px' }}>
            {store.logradouro}, {store.numero} - {store.bairro}
          </div>
          <div style={{ fontSize: '9px' }}>
            {store.municipio}, {store.uf}
            {store.telefone && ` - Fone: ${store.telefone}`}
          </div>
          <div style={{ fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>
            Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
          </div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Cabeçalho dos Itens */}
        <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '2px' }}>
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

        {/* Separador */}
        <div style={{ borderTop: '1px solid #000', margin: '2px 0' }} />

        {/* Itens */}
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: '4px', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{String(index + 1).padStart(3, '0')} {item.code}</span>
              <span style={{ flex: 1, marginLeft: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.description}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '20px' }}>
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        ))}

        {/* Separador */}
        <div style={{ borderTop: '1px solid #000', margin: '6px 0' }} />

        {/* Totais */}
        <div style={{ fontSize: '10px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Valor a Pagar R$</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Forma de Pagamento */}
        <div style={{ fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>FORMA DE PAGAMENTO</span>
            <span>VALOR PAGO R$</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{paymentMethod}</span>
            <span>{formatCurrency(amountPaid)}</span>
          </div>
          {change > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Troco R$</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Consulta */}
        <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold' }}>Consulte pela chave de acesso em</div>
          <div>http://www.fazenda.pr.gov.br/nfce/consulta</div>
        </div>

        {/* Chave de Acesso */}
        <div style={{ textAlign: 'center', fontSize: '8px', marginBottom: '6px', wordBreak: 'break-all' }}>
          {formatAccessKey(accessKey)}
        </div>

        {/* Cliente */}
        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
          {client?.name ? (
            <>
              <div>{client.name}</div>
              {client.document && <div>CPF: {formatCPF(client.document)}</div>}
            </>
          ) : (
            <div>CONSUMIDOR NÃO IDENTIFICADO</div>
          )}
        </div>

        {/* QR Code */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          margin: '8px auto',
        }}>
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code NFC-e" width={80} height={80} style={{ display: 'block' }} />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
            }}>
              [QR CODE]<br/>
              NFC-e
            </div>
          )}
        </div>

        {/* Dados da NFC-e */}
        <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold' }}>
            NFC-e nº {String(nfceNumber).padStart(6, '0')}
          </div>
          <div>Série {String(series).padStart(3, '0')}</div>
          <div>{dateStr}</div>
          <div>Via Consumidor</div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Protocolo de Autorização */}
        <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold' }}>Protocolo de autorização:</div>
          <div>{authProtocol}</div>
          <div>Data de autorização: {dateStr}</div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Tributos */}
        <div style={{ textAlign: 'center', fontSize: '8px' }}>
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
