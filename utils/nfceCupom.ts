/**
 * Utilitário para montar o cupom NFC-e em HTML (DAC - Documento Auxiliar de Consumidor).
 * Usado quando a API Brasil NFe não retorna PDF para NFC-e - montamos o cupom com os dados da nota.
 */

import type { Invoice } from '../services/api/invoices';
import type { NFCeData, NFCeStore, NFCeClient, NFCeItem } from '../components/NFCePreview';

const paymentLabel: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
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

  // QR Code: conteúdo = qr_code_url da API (string para codificar) ou URL de consulta PR. Imagem via api.qrserver.com.
  const qrContent = invoice.qr_code_url
    || (invoice.access_key ? `https://www.fazenda.pr.gov.br/nfce/consulta?chave=${invoice.access_key}` : null);
  const qrCodeUrl = qrContent
    ? (qrContent.startsWith('http') && (qrContent.includes('create-qr-code') || qrContent.includes('.png')))
      ? qrContent
      : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrContent)}`
    : undefined;

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

  // Para NF-e/NFC-e, garante QR Code no recibo mesmo quando a API não retornar qrCodeUrl.
  const resolvedQrCodeUrl = (() => {
    if (qrCodeUrl && qrCodeUrl.trim()) return qrCodeUrl;
    if (!accessKeyDigits) return undefined;
    const consultaComChave = `${consultaUrl}?chave=${accessKeyDigits}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(consultaComChave)}`;
  })();

  const itemsArr = Array.isArray(items) ? items : (items && typeof items === 'object' ? Object.values(items) : []);
  const itemsHtml = itemsArr
    .map(
      (item, i) => `
    <div style="margin-bottom:4px;font-size:10px">
      <div style="display:flex;justify-content:space-between">
        <span>${String(i + 1).padStart(3, '0')} ${item.code}</span>
        <span style="flex:1;margin-left:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(item.description)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding-left:20px">
        <span>${item.quantity}</span>
        <span>${item.unit}</span>
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
    body { font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.3; background: white; color: black; padding: 8px; width: 80mm; max-width: 80mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: auto; margin: 8mm; }
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:6px">
    <div style="font-size:12px;font-weight:bold;margin-bottom:2px">${escapeHtml(store.fancy_name || store.name)}</div>
    <div style="font-size:10px">${escapeHtml(store.name)}</div>
    <div style="font-size:10px">CNPJ: ${formatCNPJ(store.cnpj)}${store.ie ? ` IE: ${store.ie}` : ''}</div>
    <div style="font-size:9px">${escapeHtml(store.logradouro)}, ${store.numero} - ${escapeHtml(store.bairro)}</div>
    <div style="font-size:9px">${escapeHtml(store.municipio)}, ${store.uf}${store.telefone ? ` - Fone: ${store.telefone}` : ''}</div>
    <div style="font-size:9px;margin-top:4px;font-weight:bold">${docAuxLabel}</div>
  </div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="font-size:9px;font-weight:bold;margin-bottom:2px">
    <div style="display:flex;justify-content:space-between"><span>#CODIGO</span><span>DESCRIÇÃO</span></div>
    <div style="display:flex;justify-content:space-between"><span>QTD</span><span>UN</span><span>VL.UNIT</span><span>VL.TOTAL</span></div>
  </div>
  <div style="border-top:1px solid #000;margin:2px 0"></div>
  ${itemsHtml}
  <div style="border-top:1px solid #000;margin:6px 0"></div>
  <div style="font-size:10px">
    <div style="display:flex;justify-content:space-between"><span>Qtde. Total de Itens</span><span>${itemsArr.length}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Valor Total R$</span><span>${formatCurrency(subtotal)}</span></div>
    ${discount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Desconto R$</span><span>-${formatCurrency(discount)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:bold"><span>Valor a Pagar R$</span><span>${formatCurrency(total)}</span></div>
  </div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="font-size:10px">
    <div style="display:flex;justify-content:space-between"><span>FORMA DE PAGAMENTO</span><span>VALOR PAGO R$</span></div>
    <div style="display:flex;justify-content:space-between"><span>${escapeHtml(paymentMethod)}</span><span>${formatCurrency(amountPaid)}</span></div>
    ${change > 0 ? `<div style="display:flex;justify-content:space-between"><span>Troco R$</span><span>${formatCurrency(change)}</span></div>` : ''}
  </div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="text-align:center;font-size:9px;margin-bottom:6px">
    <div style="font-weight:bold">Consulte pela chave de acesso em</div>
    <div>${consultaUrl}</div>
  </div>
  <div style="text-align:center;font-size:8px;margin-bottom:6px;word-break:break-all">${formatAccessKey(accessKey)}</div>
  <div style="text-align:center;font-size:10px;font-weight:bold;margin-bottom:6px">
    ${client?.name ? `<div>${escapeHtml(client.name)}</div>${client.document ? `<div>CPF: ${formatCPF(client.document)}</div>` : ''}` : '<div>CONSUMIDOR NÃO IDENTIFICADO</div>'}
  </div>
  <div style="display:flex;justify-content:center;align-items:center;margin:8px auto">
    ${resolvedQrCodeUrl
      ? `<img src="${escapeHtml(resolvedQrCodeUrl)}" alt="QR Code ${docLabel}" width="80" height="80" style="display:block" />`
      : `<div style="width:80px;height:80px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:8px;text-align:center;background:#f5f5f5">[QR CODE]<br/>${docLabel}</div>`}
  </div>
  <div style="text-align:center;font-size:9px;margin-bottom:4px">
    <div style="font-weight:bold">${nfceNumLabel} ${String(nfceNumber).padStart(6, '0')}</div>
    <div>Série ${String(series).padStart(3, '0')}</div>
    <div>${dateStr}</div>
    <div>Via Consumidor</div>
  </div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="text-align:center;font-size:9px;margin-bottom:6px">
    <div style="font-weight:bold">Protocolo de autorização:</div>
    <div>${authProtocol || '—'}</div>
    <div>Data de autorização: ${dateStr}</div>
  </div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="text-align:center;font-size:8px">
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
