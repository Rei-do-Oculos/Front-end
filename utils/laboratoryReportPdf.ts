/**
 * Utilitário para gerar PDF de relatório de laboratório
 */

import html2pdf from 'html2pdf.js';
import { generatePdfHeader, StoreData, PdfHeaderOptions } from './pdfHeader';
import { formatCurrency } from './formatters';

export interface LaboratoryReportData {
  total_os: number;
  total_cost: number;
  top_lenses: Array<{
    id: number;
    name: string;
    count: number;
    quantity_sold?: number;
    os_count?: number;
    total_cost: number;
  }>;
  laboratory: {
    id: number;
    name: string;
  };
  date_from: string | null;
  date_to: string | null;
}

export interface GenerateLaboratoryReportPdfOptions {
  report: LaboratoryReportData;
  storeData?: StoreData | null;
  storeColor?: string;
  storeLogo?: string | null;
  logoUrlBuilder?: (logoPath: string | null | undefined) => string | null;
}

/**
 * Gera o HTML do conteúdo do relatório (sem header)
 */
const generateReportContent = (
  report: LaboratoryReportData,
  color: string
): string => {
  const dateRange = (report.date_from || report.date_to)
    ? `Período: ${report.date_from ? new Date(report.date_from).toLocaleDateString('pt-BR') : '...'} até ${report.date_to ? new Date(report.date_to).toLocaleDateString('pt-BR') : '...'}`
    : 'Todo o histórico';

  // Converter para array se vier como objeto indexado numericamente
  let topLenses: Array<{ id: number; name: string; count: number; quantity_sold?: number; total_cost: number }> = [];
  
  if (Array.isArray(report.top_lenses)) {
    topLenses = report.top_lenses;
  } else if (report.top_lenses && typeof report.top_lenses === 'object') {
    // Se for um objeto, converter para array usando Object.values
    topLenses = Object.values(report.top_lenses);
  }

  // Debug: verificar dados antes de gerar HTML
  console.log('🔍 [laboratoryReportPdf] generateReportContent:', {
    top_lenses_original: report.top_lenses,
    top_lenses_original_type: typeof report.top_lenses,
    top_lenses_is_array: Array.isArray(report.top_lenses),
    top_lenses_processed: topLenses,
    top_lenses_length: topLenses.length,
    top_lenses_first_item: topLenses[0],
  });

  // Variável para usar no template (precisa estar no escopo correto)
  const topLensesForTemplate = topLenses;

  return `
    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${report.laboratory.name} — ${dateRange}</div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${color}; width: 50%;">
          <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Total de OS (com produtos)</div>
          <div style="font-size: 28px; font-weight: 700; color: ${color};">${report.total_os}</div>
        </td>
        <td style="padding: 16px; width: 2%;"></td>
        <td style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${color}; width: 48%;">
          <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Custo pelo filtro</div>
          <div style="font-size: 28px; font-weight: 700; color: ${color};">${formatCurrency(report.total_cost)}</div>
        </td>
      </tr>
    </table>

    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Produtos que foram vendidos</div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background: #f3f4f6; border-left: 4px solid ${color};">
          <th style="padding: 10px; text-align: left; font-size: 11px; color: #374151;">Produto</th>
          <th style="padding: 10px; text-align: center; font-size: 11px; color: #374151;">Qtd. vendida</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #374151;">Custo Total</th>
        </tr>
      </thead>
      <tbody>
        ${topLensesForTemplate.length > 0 ? topLensesForTemplate.map((l, i) => `
          <tr style="${i % 2 ? 'background: #f9fafb;' : ''}">
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${l.name || ''}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${l.quantity_sold ?? l.count ?? 0}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(l.total_cost || 0)}</td>
          </tr>
        `).join('') : `
          <tr><td colspan="3" style="padding: 16px; text-align: center; color: #6b7280; border: 1px solid #e5e7eb;">Nenhum produto no período</td></tr>
        `}
      </tbody>
    </table>
  `;
};

/**
 * Gera e baixa o PDF do relatório de laboratório
 */
export const generateLaboratoryReportPdf = async (
  options: GenerateLaboratoryReportPdfOptions
): Promise<void> => {
  const {
    report,
    storeData,
    storeColor,
    storeLogo,
    logoUrlBuilder,
  } = options;

  const color = storeData?.color ?? storeColor ?? '#dc2626';

  // Gerar header padrão
  const headerHtml = await generatePdfHeader({
    storeData,
    storeColor,
    storeLogo,
    title: 'Relatório',
    logoUrlBuilder,
  });

  // Debug: verificar dados recebidos
  console.log('🔍 [laboratoryReportPdf] generateLaboratoryReportPdf - Input:', {
    report,
    top_lenses: report.top_lenses,
    top_lenses_count: report.top_lenses?.length || 0,
    top_lenses_is_array: Array.isArray(report.top_lenses),
  });

  // Gerar conteúdo do relatório
  const contentHtml = generateReportContent(report, color);

  // Debug: verificar HTML gerado
  let topLensesArray: Array<{ id: number; name: string; count: number; total_cost: number }> = [];
  if (Array.isArray(report.top_lenses)) {
    topLensesArray = report.top_lenses;
  } else if (report.top_lenses && typeof report.top_lenses === 'object') {
    topLensesArray = Object.values(report.top_lenses);
  }
  
  console.log('🔍 [laboratoryReportPdf] Generated HTML length:', contentHtml.length);
  console.log('🔍 [laboratoryReportPdf] HTML contains "Nenhum produto":', contentHtml.includes('Nenhum produto no período'));
  console.log('🔍 [laboratoryReportPdf] HTML contains product rows:', contentHtml.includes('<tr style='));
  if (topLensesArray.length > 0) {
    console.log('🔍 [laboratoryReportPdf] First product name:', topLensesArray[0]?.name);
    console.log('🔍 [laboratoryReportPdf] HTML should contain:', topLensesArray[0]?.name);
    console.log('🔍 [laboratoryReportPdf] HTML actually contains name:', contentHtml.includes(topLensesArray[0]?.name || ''));
  } else {
    console.log('⚠️ [laboratoryReportPdf] topLensesArray está vazio!');
  }

  // HTML completo
  const reportHtml = `
    <div id="laboratory-report-pdf" style="width: 210mm; max-width: 100%; margin: 0 auto; padding: 15mm 18mm; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; background-color: #fff; box-sizing: border-box;">
      ${headerHtml}
      ${contentHtml}
    </div>
  `;

  // Criar container temporário
  const container = document.createElement('div');
  container.innerHTML = reportHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    // Gerar PDF
    await html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `relatorio-laboratorio-${report.laboratory.name.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['tr', 'table'] },
      })
      .from(container.querySelector('#laboratory-report-pdf')!)
      .save();
  } finally {
    // Remover container
    document.body.removeChild(container);
  }
};
