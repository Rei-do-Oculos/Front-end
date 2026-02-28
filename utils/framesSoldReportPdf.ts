/**
 * Utilitário para gerar PDF do relatório de armações vendidas nas OS
 */

import html2pdf from 'html2pdf.js';
import { generatePdfHeader, StoreData, PdfHeaderOptions } from './pdfHeader';
import { formatDate } from './formatters';
import type { FrameSoldItem } from '../services/api/stockReports';

export interface FramesSoldReportPdfOptions {
  items: FrameSoldItem[];
  totalQty: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  storeData?: StoreData | null;
  storeColor?: string;
  storeLogo?: string | null;
  logoUrlBuilder?: (logoPath: string | null | undefined) => string | null;
}

const genderLabels: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  unissex: 'Unissex',
};

const buildContentHtml = (items: FrameSoldItem[], color: string): string => {
  const rows = items.length > 0
    ? items.map((row, i) => `
        <tr style="${i % 2 ? 'background: #f9fafb;' : ''}">
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${row.frame_code || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${(row.frame_description || '-').substring(0, 40)}${(row.frame_description || '').length > 40 ? '...' : ''}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; text-align: center;">${row.frame_type_name || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; text-align: center;">${genderLabels[row.frame_gender] || row.frame_gender || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; text-align: center;">${row.os_number ?? '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px;">${row.store_name || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; white-space: nowrap;">${row.completed_at ? formatDate(row.completed_at) : '-'}</td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="7" style="padding: 16px; text-align: center; color: #6b7280; border: 1px solid #e5e7eb;">Nenhuma armação vendida no período</td>
      </tr>
    `;

  return `
    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Relatório de Armações Vendidas nas OS</div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 10px;">
      <thead>
        <tr style="background: #f3f4f6; border-left: 4px solid ${color};">
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Código</th>
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Descrição</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Tipo</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Gênero</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">OS</th>
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Loja</th>
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Data</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

export const generateFramesSoldReportPdf = async (
  options: FramesSoldReportPdfOptions
): Promise<void> => {
  const { items, totalQty, dateFrom, dateTo, storeData, storeColor, storeLogo, logoUrlBuilder } = options;
  const color = storeData?.color ?? storeColor ?? '#dc2626';

  const dateRange =
    dateFrom || dateTo
      ? `Período: ${dateFrom ? formatDate(dateFrom) : '...'} até ${dateTo ? formatDate(dateTo) : '...'}`
      : 'Todo o histórico';

  const headerHtml = await generatePdfHeader({
    storeData,
    storeColor,
    storeLogo,
    titleBelowStore: 'Relatório de Armações Vendidas',
    logoUrlBuilder,
  });

  const totalLabel = totalQty === 1 ? '1 armação vendida' : `${totalQty.toLocaleString('pt-BR')} armações vendidas`;

  const contentHtml = `
    <div style="font-size: 10px; color: #6b7280; margin-bottom: 12px;">${dateRange}</div>
    <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${color}; margin-bottom: 16px;">
      <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Total no período</div>
      <div style="font-size: 24px; font-weight: 700; color: ${color};">${totalLabel}</div>
    </div>
    ${buildContentHtml(items, color)}
  `;

  const reportHtml = `
    <div id="frames-sold-report-pdf" style="width: 210mm; max-width: 100%; margin: 0 auto; padding: 15mm 18mm; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; background: #fff; box-sizing: border-box;">
      ${headerHtml}
      ${contentHtml}
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = reportHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const safeLabel = (dateFrom || dateTo || 'relatorio').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    await html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `armacoes-vendidas-${safeLabel}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['tr', 'table'] },
      })
      .from(container.querySelector('#frames-sold-report-pdf')!)
      .save();
  } finally {
    document.body.removeChild(container);
  }
};
