/**
 * Utilitário para gerar header padrão de PDFs
 */

import { storeReceiptHeader } from './storeReceiptHeader';

export interface StoreData {
  name?: string;
  fancy_name?: string;
  receipt_header?: string | null;
  color?: string;
  logo?: string | null;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  telefone?: string | null;
  cnpj?: string;
}

export interface PdfHeaderOptions {
  storeData?: StoreData | null;
  storeColor?: string;
  storeLogo?: string | null;
  title?: string;
  /** Quando definido, mostra este texto centralizado no lugar do nome da loja */
  centerTitle?: string;
  /** Quando definido, mostra nome da loja + este título centralizados (título abaixo do nome) */
  titleBelowStore?: string;
  logoUrlBuilder?: (logoPath: string | null | undefined) => string | null;
}

/**
 * Converte URL de imagem para data URL (para incluir no PDF)
 */
export const imageToDataUrl = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
};

/**
 * Gera o HTML do header padrão para PDFs
 */
export const generatePdfHeader = async (options: PdfHeaderOptions): Promise<string> => {
  const {
    storeData,
    storeColor = '#dc2626',
    storeLogo,
    title = 'Relatório',
    centerTitle,
    titleBelowStore,
    logoUrlBuilder,
  } = options;

  const color = storeData?.color ?? storeColor ?? '#dc2626';
  const storeName = storeData?.name ?? 'Sistema';
  const storeFancy = storeReceiptHeader({
    receipt_header: storeData?.receipt_header,
    fancy_name: storeData?.fancy_name,
    name: storeData?.name ?? storeName,
  });
  const logradouro = storeData?.logradouro ?? '';
  const numero = storeData?.numero ?? '';
  const bairro = storeData?.bairro ?? '';
  const municipio = storeData?.municipio ?? '';
  const uf = storeData?.uf ?? '';
  const telefone = storeData?.telefone ?? null;
  const cnpj = storeData?.cnpj ?? '00.000.000/0000-00';

  // Buscar logo
  let logoDataUrl = '';
  const logoPath = storeData?.logo ?? storeLogo ?? null;
  if (logoPath && logoUrlBuilder) {
    const logoUrl = logoUrlBuilder(logoPath);
    if (logoUrl) {
      logoDataUrl = await imageToDataUrl(logoUrl);
    }
  }

  const headerLogoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="Logo" style="max-height: 90px; max-width: 220px; object-fit: contain;" />`
    : `<div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 20px; font-weight: 700; color: ${color}; letter-spacing: 1px;">ÓTICA</span><span style="font-size: 16px; font-weight: 500; color: #374151;">${storeName}</span></div>`;

  const centerContent = centerTitle
    ? `<div style="font-weight: 700; font-size: 16px; color: ${color}; text-align: center;">${centerTitle}</div>`
    : `
      <div style="font-weight: 700; font-size: 13px; color: #111827; margin-bottom: 6px;">${storeFancy}</div>
      ${(logradouro || municipio) ? `<div style="font-size: 11px; color: #6b7280; line-height: 1.5;">${[logradouro, numero].filter(Boolean).join(', ')}${bairro ? ` — ${bairro}` : ''}${(municipio || uf) ? ` — ${[municipio, uf].filter(Boolean).join(' - ')}` : ''}</div>` : ''}
      ${telefone ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Tel: ${telefone}</div>` : ''}
      ${cnpj && cnpj !== '00.000.000/0000-00' ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">CNPJ: ${cnpj}</div>` : ''}
    `;

  if (centerTitle) {
    return `
      <div style="width: 100%; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid ${color};">
        <div style="text-align: center; width: 100%;">
          <div style="font-weight: 700; font-size: 18px; color: ${color}; line-height: 1.4; letter-spacing: 0.3px;">${centerTitle}</div>
        </div>
      </div>
    `;
  }

  if (titleBelowStore) {
    return `
      <div style="width: 100%; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid ${color};">
        <div style="text-align: center; width: 100%;">
          <div style="font-weight: 700; font-size: 16px; color: #111827; line-height: 1.4;">${storeFancy}</div>
          <div style="font-weight: 700; font-size: 14px; color: ${color}; margin-top: 8px; line-height: 1.4;">${titleBelowStore}</div>
        </div>
      </div>
    `;
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border-bottom: 2px solid ${color};">
      <tr>
        <td style="width: 1%; vertical-align: top;">${headerLogoHtml}</td>
        <td style="padding: 0 20px; text-align: center; vertical-align: top;">
          ${centerContent}
        </td>
        <td style="width: 1%; text-align: right; vertical-align: top;">
          <div style="font-weight: 700; font-size: 14px; color: ${color};">${title}</div>
        </td>
      </tr>
    </table>
  `;
};
