/**
 * Utilitário para montar o cupom NFC-e em HTML (DAC - Documento Auxiliar de Consumidor).
 * Usado quando a API Brasil NFe não retorna PDF para NFC-e - montamos o cupom com os dados da nota.
 */

import type { Invoice } from '../services/api/invoices';
import type { NFCeData, NFCeStore, NFCeClient, NFCeItem } from '../components/NFCePreview';
import { storeReceiptHeader, storeReceiptSubtitleLine } from './storeReceiptHeader';

const paymentLabel: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Pagamento na Retirada',
};

const formatCNPJ = (cnpj: string): string => {
  const c = (cnpj || '').replace(/\D/g, '');
  return c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : cnpj || '';
};

const formatCPF = (cpf: string): string => {
  const c = (cpf || '').replace(/\D/g, '');
  return c.length === 11 ? c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : cpf || '';
};

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatAccessKey = (key: string): string => {
  const c = (key || '').replace(/\D/g, '');
  return c.match(/.{1,4}/g)?.join(' ') || key || '';
};

function toArray<T>(val: T[] | Record<string, T> | null | undefined): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

/** Gera URL de imagem do QR a partir do conteúdo oficial (qr_code_url /nfce/qrcode?p=...). */
export function buildQrCodeImageUrl(qrContent: string | null | undefined, size = 120): string | null {
  const content = qrContent?.trim();
  if (!content) return null;
  if (content.startsWith('http') && (content.includes('create-qr-code') || content.includes('.png'))) {
    return content;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}`;
}

export function invoiceToNFCeData(invoice: Invoice): NFCeData | null {
  const store = invoice.store;
  if (!store || !store.cnpj) return null;

  const client = invoice.service_order?.client;
  const rawItems = toArray(invoice.items);
  const items: NFCeItem[] = rawItems.map((item: any, idx) => ({
    code: String(idx + 1).padStart(6, '0'),
    description: item.description,
    quantity: item.quantity,
    unit: 'UND',
    unitPrice: Number(item.unit_value) || 0,
    totalPrice: Number(item.unit_value || 0) * (item.quantity || 1),
  }));

  const total = Number(invoice.total_value) || 0;
  const paymentsArr = toArray(invoice.payments);
  const firstPayment = paymentsArr[0];
  const paymentMethod = firstPayment ? (paymentLabel[firstPayment.payment_method] || firstPayment.payment_method) : 'À Vista';

  const storeData: NFCeStore = {
    name: store.name || '',
    fancy_name: store.fancy_name || store.name || '',
    receipt_header: store.receipt_header ?? null,
    cnpj: store.cnpj || '',
    ie: store.ie ?? null,
    logradouro: store.logradouro || '',
    numero: store.numero || '',
    bairro: store.bairro || '',
    municipio: store.municipio || '',
    uf: store.uf || 'PR',
    telefone: store.telefone ?? null,
  };

  const clientData: NFCeClient | undefined = client?.name ? {
    name: client.name,
    document: client.document ?? null,
  } : undefined;

  // QR Code: usa qr_code_url oficial (URL /nfce/qrcode?p=...). Sem fallback inventado.
  const qrCodeUrl = buildQrCodeImageUrl(invoice.qr_code_url, 120) ?? undefined;

  return {
    store: storeData,
    client: clientData,
    items,
    subtotal: total,
    total,
    paymentMethod,
    amountPaid: total,
    nfceNumber: parseInt(invoice.invoice_number, 10) || 0,
    series: parseInt(invoice.series, 10) || 1,
    accessKey: invoice.access_key || '',
    authProtocol: invoice.protocol || '',
    authDate: invoice.authorization_date ? new Date(invoice.authorization_date).toLocaleString('pt-BR') : undefined,
    qrCodeUrl,
    federalTax: total * 0.1343,
    stateTax: total * 0.18,
    municipalTax: 0,
  };
}

/** Tipo de documento para o recibo (NF-e ou NFC-e - mesmo layout, labels diferentes). */
export type ReciboTipo = 'NF-e' | 'NFC-e';

/** Monta o HTML do recibo (cupom térmico) para NF-e ou NFC-e. Padrão único para ambos. */
export function buildReciboHtml(data: NFCeData, tipo: ReciboTipo = 'NFC-e'): string {
  const docLabel = tipo === 'NFC-e' ? 'NFC-e' : 'NF-e';
  const docAuxLabel = tipo === 'NFC-e'
    ? 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica'
    : 'Documento Auxiliar da Nota Fiscal Eletrônica';
  const consultaUrl = tipo === 'NFC-e'
    ? 'http://www.fazenda.pr.gov.br/nfce/consulta'
    : 'http://www.fazenda.pr.gov.br/nfe/consulta';
  const nfceNumLabel = tipo === 'NFC-e' ? 'NFC-e nº' : 'NF-e nº';

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
    nfceNumber = 0,
    series = 1,
    accessKey = '',
    authProtocol = '',
    authDate,
    qrCodeUrl,
    federalTax = 0,
    stateTax = 0,
    municipalTax = 0,
  } = data;

  const dateStr = authDate || new Date().toLocaleString('pt-BR');
  const accessKeyDigits = (accessKey || '').replace(/\D/g, '');
  const reciboSubtitle = storeReceiptSubtitleLine(store);

  // NFC-e: só QR oficial. NF-e: fallback de consulta por chave (portal NFe).
  const resolvedQrCodeUrl = (() => {
    if (qrCodeUrl && qrCodeUrl.trim()) return qrCodeUrl;
    if (tipo === 'NFC-e' || !accessKeyDigits) return undefined;
    const consultaComChave = `${consultaUrl}?chave=${accessKeyDigits}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(consultaComChave)}`;
  })();

  const itemsArr = Array.isArray(items) ? items : (items && typeof items === 'object' ? Object.values(items) : []);
  const itemsHtml = itemsArr
    .map(
      (item, i) => `
    <div class="th-item">
      <div class="th-item-row">
        <span>${String(i + 1).padStart(3, '0')} ${escapeHtml(item.code)}</span>
        <span class="th-item-desc">${escapeHtml(item.description)}</span>
      </div>
      <div class="th-item-row th-item-sub">
        <span>${item.quantity}</span>
        <span>${escapeHtml(item.unit)}</span>
        <span>${formatCurrency(item.unitPrice)}</span>
        <span>${formatCurrency(item.totalPrice)}</span>
      </div>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      background: #fff;
      color: #000;
      font-weight: 600;
      padding: 8px;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
    }
    .th-center { text-align: center; }
    .th-head-store { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .th-head-sub { font-size: 11px; font-weight: 600; }
    .th-head-line { font-size: 11px; font-weight: 600; }
    .th-head-addr { font-size: 10px; font-weight: 600; }
    .th-doc-title { font-size: 11px; font-weight: 700; margin-top: 6px; }
    .th-sep-dash { border-top: 1px dashed #000; margin: 8px 0; }
    .th-sep-solid { border-top: 1px solid #000; margin: 4px 0; }
    .th-cols-head { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
    .th-cols-head .th-row { display: flex; justify-content: space-between; }
    .th-item { margin-bottom: 6px; font-size: 11px; font-weight: 600; }
    .th-item-row { display: flex; justify-content: space-between; }
    .th-item-desc { flex: 1; margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .th-item-sub { padding-left: 20px; margin-top: 2px; }
    .th-totals { font-size: 12px; font-weight: 600; }
    .th-totals .th-row { display: flex; justify-content: space-between; }
    .th-totals-big { font-size: 14px; font-weight: 700; margin-top: 4px; }
    .th-pay-head { font-size: 11px; font-weight: 700; }
    .th-pay-head .th-row { display: flex; justify-content: space-between; }
    .th-pay-body { font-size: 12px; font-weight: 600; margin-top: 4px; }
    .th-pay-body .th-row { display: flex; justify-content: space-between; }
    .th-key-title { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
    .th-key-url { font-size: 10px; font-weight: 600; }
    .th-key-digits { font-size: 10px; font-weight: 600; margin: 8px 0; word-break: break-all; letter-spacing: 0.02em; }
    .th-client { font-size: 12px; font-weight: 700; margin-bottom: 8px; }
    .th-nfe-num { font-size: 12px; font-weight: 700; }
    .th-nfe-meta { font-size: 11px; font-weight: 600; }
    .th-protocol { font-size: 11px; font-weight: 600; }
    .th-protocol-title { font-weight: 700; margin-bottom: 4px; }
    .th-trib { font-size: 10px; font-weight: 600; line-height: 1.35; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: auto; margin: 5mm 6mm; }
    }
  </style>
</head>
<body>
  <div class="th-center" style="margin-bottom:8px">
    <div class="th-head-store">${escapeHtml(storeReceiptHeader(store))}</div>
    ${reciboSubtitle ? `<div class="th-head-sub">${escapeHtml(reciboSubtitle)}</div>` : ''}
    <div class="th-head-line">CNPJ: ${formatCNPJ(store.cnpj)}${store.ie ? ` IE: ${escapeHtml(String(store.ie))}` : ''}</div>
    <div class="th-head-addr">${escapeHtml(store.logradouro)}, ${escapeHtml(store.numero)} - ${escapeHtml(store.bairro)}</div>
    <div class="th-head-addr">${escapeHtml(store.municipio)}, ${escapeHtml(store.uf)}${store.telefone ? ` - Fone: ${escapeHtml(store.telefone)}` : ''}</div>
    <div class="th-doc-title">${docAuxLabel}</div>
  </div>
  <div class="th-sep-dash"></div>
  <div class="th-cols-head">
    <div class="th-row"><span>#CODIGO</span><span>DESCRIÇÃO</span></div>
    <div class="th-row"><span>QTD</span><span>UN</span><span>VL.UNIT</span><span>VL.TOTAL</span></div>
  </div>
  <div class="th-sep-solid"></div>
  ${itemsHtml}
  <div class="th-sep-solid" style="margin-top:8px"></div>
  <div class="th-totals">
    <div class="th-row"><span>Qtde. Total de Itens</span><span>${itemsArr.length}</span></div>
    <div class="th-row"><span>Valor Total R$</span><span>${formatCurrency(subtotal)}</span></div>
    ${discount > 0 ? `<div class="th-row"><span>Desconto R$</span><span>-${formatCurrency(discount)}</span></div>` : ''}
    <div class="th-row th-totals-big"><span>Valor a Pagar R$</span><span>${formatCurrency(total)}</span></div>
  </div>
  <div class="th-sep-dash"></div>
  <div>
    <div class="th-pay-head"><div class="th-row"><span>FORMA DE PAGAMENTO</span><span>VALOR PAGO R$</span></div></div>
    <div class="th-pay-body"><div class="th-row"><span>${escapeHtml(paymentMethod)}</span><span>${formatCurrency(amountPaid)}</span></div></div>
    ${change > 0 ? `<div class="th-pay-body"><div class="th-row"><span>Troco R$</span><span>${formatCurrency(change)}</span></div></div>` : ''}
  </div>
  <div class="th-sep-dash"></div>
  <div class="th-center" style="margin-bottom:8px">
    <div class="th-key-title">Consulte pela chave de acesso em</div>
    <div class="th-key-url">${consultaUrl}</div>
  </div>
  <div class="th-center th-key-digits">${formatAccessKey(accessKey)}</div>
  <div class="th-center th-client">
    ${client?.name ? `<div>${escapeHtml(client.name)}</div>${client.document ? `<div>CPF: ${formatCPF(client.document)}</div>` : ''}` : '<div>CONSUMIDOR NÃO IDENTIFICADO</div>'}
  </div>
  <div style="display:flex;justify-content:center;align-items:center;margin:8px auto">
    ${resolvedQrCodeUrl
      ? `<img src="${escapeHtml(resolvedQrCodeUrl)}" alt="QR Code ${docLabel}" width="96" height="96" style="display:block;image-rendering:pixelated" />`
      : `<div style="width:96px;height:96px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;text-align:center">[QR CODE]<br/>${docLabel}</div>`}
  </div>
  <div class="th-center th-nfe-meta" style="margin-bottom:6px">
    <div class="th-nfe-num">${nfceNumLabel} ${String(nfceNumber).padStart(6, '0')}</div>
    <div>Série ${String(series).padStart(3, '0')}</div>
    <div>${escapeHtml(dateStr)}</div>
    <div>Via Consumidor</div>
  </div>
  <div class="th-sep-dash"></div>
  <div class="th-center th-protocol" style="margin-bottom:8px">
    <div class="th-protocol-title">Protocolo de autorização:</div>
    <div>${escapeHtml(authProtocol || '—')}</div>
    <div>Data de autorização: ${escapeHtml(dateStr)}</div>
  </div>
  <div class="th-sep-dash"></div>
  <div class="th-center th-trib">
    <div>Trib Aprox R$ ${formatCurrency(federalTax)} Fed. e R$ ${formatCurrency(stateTax)} Est. e R$ ${formatCurrency(municipalTax)} Mun.</div>
    <div>Fonte: IBPT</div>
  </div>
</body>
</html>`;
}

/** @deprecated Use buildReciboHtml(data, 'NFC-e'). Mantido para compatibilidade. */
export function buildNFCeCupomHtml(data: NFCeData): string {
  return buildReciboHtml(data, 'NFC-e');
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
