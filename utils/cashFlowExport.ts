/**
 * Exportação do Fluxo de Caixa para PDF e Excel (com base nos filtros aplicados).
 */

import html2pdf from 'html2pdf.js';
import ExcelJS from 'exceljs';
import { generatePdfHeader, StoreData } from './pdfHeader';
import { formatCurrency } from './formatters';
import type { FinanceDashboardResponse } from '../services/api/finance';

export interface CashFlowExportFilters {
  dateFrom: string;
  dateTo: string;
  storeId: string;
  storeLabel: string; // "Todas as Lojas" ou nome da loja
  paymentMethods?: string | null; // ex: "Cartão de Crédito, PIX"
}

export interface CashFlowExportPdfOptions {
  data: FinanceDashboardResponse;
  filters: CashFlowExportFilters;
  storeData?: StoreData | null;
  storeColor?: string;
  storeLogo?: string | null;
  logoUrlBuilder?: (logoPath: string | null | undefined) => string | null;
}

export interface CashFlowExportExcelOptions {
  data: FinanceDashboardResponse;
  filters: CashFlowExportFilters;
}

const formatDateBr = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

const pageHeaderBlock = (filters: CashFlowExportFilters, color: string) => `
  <div class="pdf-page-header" style="margin-bottom: 18px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${color}; border-radius: 8px;">
    <div style="font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Relatório Financeiro — Fluxo de Caixa</div>
    <div style="font-size: 10px; color: #64748b;">
      <strong>Filtros aplicados:</strong> Período: ${formatDateBr(filters.dateFrom)} a ${formatDateBr(filters.dateTo)} • Loja: ${filters.storeLabel}${filters.paymentMethods ? ` • Forma de pagamento: ${filters.paymentMethods}` : ''}
    </div>
  </div>
`;

const sectionTitle = (title: string, color: string) => `
  <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${color};">${title}</div>
`;

function buildPdfContent(
  data: FinanceDashboardResponse,
  filters: CashFlowExportFilters,
  color: string
): string {
  const d = data.dashboard;

  const revenueByStore = Array.isArray(data.revenue_by_store) ? data.revenue_by_store : Object.values(data.revenue_by_store || {});
  const topSellers = Array.isArray(data.top_sellers) ? data.top_sellers : Object.values(data.top_sellers || {});
  const overdueSummary = Array.isArray(data.overdue_summary) ? data.overdue_summary : Object.values(data.overdue_summary || {});

  const cardsHtml = `
    ${pageHeaderBlock(filters, color)}
    ${sectionTitle('Resumo de Indicadores', color)}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid ${color}; width: 25%;">
          <div style="font-size: 9px; color: #6b7280; margin-bottom: 4px;">Faturamento</div>
          <div style="font-size: 18px; font-weight: 700; color: #166534;">${formatCurrency(d?.revenue ?? 0)}</div>
          <div style="font-size: 9px; color: #6b7280;">${d?.total_orders ?? 0} vendas</div>
        </td>
        <td style="width: 2%;"></td>
        <td style="padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626; width: 25%;">
          <div style="font-size: 9px; color: #6b7280; margin-bottom: 4px;">Custos</div>
          <div style="font-size: 18px; font-weight: 700; color: #dc2626;">${formatCurrency(d?.costs ?? 0)}</div>
        </td>
        <td style="width: 2%;"></td>
        <td style="padding: 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #15803d; width: 25%;">
          <div style="font-size: 9px; color: #6b7280; margin-bottom: 4px;">Lucro</div>
          <div style="font-size: 18px; font-weight: 700; color: #15803d;">${formatCurrency(d?.profit ?? 0)}</div>
          <div style="font-size: 9px; color: #6b7280;">${d?.profit_margin ?? 0}% margem</div>
        </td>
        <td style="width: 2%;"></td>
        <td style="padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${color}; width: 21%;">
          <div style="font-size: 9px; color: #6b7280; margin-bottom: 4px;">Ticket Médio</div>
          <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${formatCurrency(d?.average_ticket ?? 0)}</div>
        </td>
      </tr>
    </table>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 10px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #d97706; width: 33%;">
          <div style="font-size: 9px; color: #6b7280;">Aguardando Retirada</div>
          <div style="font-size: 14px; font-weight: 700; color: #b45309;">${formatCurrency(d?.pending?.total ?? 0)} (${d?.pending?.count ?? 0} OS)</div>
        </td>
        <td style="width: 1%;"></td>
        <td style="padding: 10px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626; width: 33%;">
          <div style="font-size: 9px; color: #6b7280;">Inadimplências</div>
          <div style="font-size: 14px; font-weight: 700; color: #dc2626;">${formatCurrency(d?.overdue?.total ?? 0)} (${d?.overdue?.count ?? 0} OS)</div>
        </td>
        <td style="width: 1%;"></td>
        <td style="padding: 10px; background: #fff7ed; border-radius: 8px; border-left: 4px solid #ea580c; width: 33%;">
          <div style="font-size: 9px; color: #6b7280;">Despesas</div>
          <div style="font-size: 14px; font-weight: 700; color: #ea580c;">${formatCurrency(d?.expenses ?? 0)}</div>
        </td>
      </tr>
    </table>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 10px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb; width: 25%;">
          <div style="font-size: 9px; color: #6b7280;">Cartão</div>
          <div style="font-size: 14px; font-weight: 700; color: #2563eb;">${formatCurrency((d?.revenue_by_payment_method?.credit_card ?? 0) + (d?.revenue_by_payment_method?.debit_card ?? 0))}</div>
        </td>
        <td style="width: 1%;"></td>
        <td style="padding: 10px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; width: 25%;">
          <div style="font-size: 9px; color: #6b7280;">Dinheiro</div>
          <div style="font-size: 14px; font-weight: 700; color: #16a34a;">${formatCurrency(d?.revenue_by_payment_method?.cash ?? 0)}</div>
        </td>
        <td style="width: 1%;"></td>
        <td style="padding: 10px; background: #fef3c7; border-radius: 8px; border-left: 4px solid ${color}; width: 25%;">
          <div style="font-size: 9px; color: #6b7280;">PIX</div>
          <div style="font-size: 14px; font-weight: 700; color: #b45309;">${formatCurrency(d?.revenue_by_payment_method?.pix ?? 0)}</div>
        </td>
        <td style="width: 1%;"></td>
        <td style="padding: 10px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #d97706; width: 25%;">
          <div style="font-size: 9px; color: #6b7280;">Permuta</div>
          <div style="font-size: 14px; font-weight: 700; color: #d97706;">${formatCurrency(d?.revenue_by_payment_method?.permuta ?? 0)}</div>
        </td>
      </tr>
    </table>
  `;

  const tableRevenue = `
    <div style="page-break-before: always;"></div>
    ${pageHeaderBlock(filters, color)}
    ${sectionTitle('Faturamento por Loja', color)}
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 16px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151;">Loja</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151;">Vendas</th>
          <th style="padding: 8px; text-align: right; font-size: 10px; color: #374151;">Total</th>
          <th style="padding: 8px; text-align: right; font-size: 10px; color: #374151;">Ticket Médio</th>
        </tr>
      </thead>
      <tbody>
        ${revenueByStore.length > 0 ? revenueByStore.map((s, i) => `
          <tr style="${i % 2 ? 'background: #f9fafb;' : ''}">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${s.unity ? `${s.name} (${s.unity})` : s.name}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${s.count}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(s.total)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(s.average_ticket)}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">Nenhum dado no período</td></tr>'}
      </tbody>
    </table>
  `;

  const tableSellers = `
    <div style="page-break-before: always;"></div>
    ${pageHeaderBlock(filters, color)}
    ${sectionTitle('Top Vendedores', color)}
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 16px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151;">Vendedor</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151;">Vendas</th>
          <th style="padding: 8px; text-align: right; font-size: 10px; color: #374151;">Total</th>
          <th style="padding: 8px; text-align: right; font-size: 10px; color: #374151;">Ticket Médio</th>
        </tr>
      </thead>
      <tbody>
        ${topSellers.length > 0 ? topSellers.map((s, i) => `
          <tr style="${i % 2 ? 'background: #f9fafb;' : ''}">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${s.name}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${s.count}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(s.total)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(s.average_ticket)}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">Nenhum dado no período</td></tr>'}
      </tbody>
    </table>
  `;

  const tableOverdue = overdueSummary.length > 0 ? `
    <div style="page-break-before: always;"></div>
    ${pageHeaderBlock(filters, color)}
    ${sectionTitle('Inadimplências (amostra)', color)}
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 16px;">
      <thead>
        <tr style="background: #fef2f2;">
          <th style="padding: 8px; text-align: left; font-size: 10px;">Nº OS</th>
          <th style="padding: 8px; text-align: left; font-size: 10px;">Cliente</th>
          <th style="padding: 8px; text-align: left; font-size: 10px;">Loja</th>
          <th style="padding: 8px; text-align: center; font-size: 10px;">Dias Atraso</th>
          <th style="padding: 8px; text-align: right; font-size: 10px;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${overdueSummary.slice(0, 15).map((o, i) => `
          <tr style="${i % 2 ? 'background: #f9fafb;' : ''}">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${String(o.os_number).padStart(4, '0')}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${o.client_name}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${o.store_name}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${o.days_overdue}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(o.price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  return cardsHtml + tableRevenue + tableSellers + tableOverdue;
}

/**
 * Gera e baixa o PDF do Fluxo de Caixa (com filtros aplicados).
 */
export const exportCashFlowPdf = async (options: CashFlowExportPdfOptions): Promise<void> => {
  const { data, filters, storeData, storeColor, storeLogo, logoUrlBuilder } = options;
  const color = storeData?.color ?? storeColor ?? '#dc2626';

  const headerHtml = await generatePdfHeader({
    storeData,
    storeColor,
    storeLogo,
    title: 'Relatório Financeiro',
    centerTitle: 'Relatório Financeiro',
    logoUrlBuilder,
  });

  const contentHtml = buildPdfContent(data, filters, color);

  const reportHtml = `
    <div id="cash-flow-pdf" style="width: 210mm; max-width: 100%; margin: 0 auto; padding: 15mm 18mm; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; background: #fff; box-sizing: border-box;">
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
    const safeLabel = filters.storeLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    await html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `fluxo-de-caixa-${formatDateBr(filters.dateFrom)}-a-${formatDateBr(filters.dateTo)}-${safeLabel || 'todas-lojas'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['tr', 'table'] },
      })
      .from(container.querySelector('#cash-flow-pdf')!)
      .save();
  } finally {
    document.body.removeChild(container);
  }
};

// Cores para Excel (ARGB sem #)
const COLORS = {
  header: 'FF1e3a5f',      // Azul escuro
  headerText: 'FFFFFFFF',
  filtersBg: 'FFf1f5f9',
  filtersBorder: 'FFcbd5e1',
  sectionTitle: 'FF334155',
  revenue: 'FF166534',    // Verde
  cost: 'FFdc2626',       // Vermelho
  profit: 'FF15803d',     // Verde escuro
  zebra: 'FFf8fafc',
  total: 'FF0f172a',
  totalBg: 'FFe2e8f0',
  border: 'FFcbd5e1',
};

const headerStyle = {
  font: { bold: true, size: 14, color: { argb: COLORS.headerText } },
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.header } },
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
};

const tableHeaderStyle = {
  font: { bold: true, size: 11, color: { argb: COLORS.header } },
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.filtersBg } },
  border: {
    top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
    left: { style: 'thin' as const }, right: { style: 'thin' as const },
  },
  alignment: { vertical: 'middle' as const },
};

const totalRowStyle = {
  font: { bold: true, size: 11 },
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.totalBg } },
  border: {
    top: { style: 'medium' as const }, bottom: { style: 'medium' as const },
    left: { style: 'thin' as const }, right: { style: 'thin' as const },
  },
};

const currencyFormat = '"R$"#,##0.00';
const percentFormat = '0.00%';

function applyBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  };
}

/**
 * Gera e baixa o Excel do Fluxo de Caixa (com filtros aplicados).
 */
export const exportCashFlowExcel = async (options: CashFlowExportExcelOptions): Promise<void> => {
  const { data, filters } = options;
  const d = data.dashboard;
  const revenueByStore = Array.isArray(data.revenue_by_store) ? data.revenue_by_store : Object.values(data.revenue_by_store || {});
  const topSellers = Array.isArray(data.top_sellers) ? data.top_sellers : Object.values(data.top_sellers || {});
  const overdueSummary = Array.isArray(data.overdue_summary) ? data.overdue_summary : Object.values(data.overdue_summary || {});

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Rei do Óculos';
  wb.created = new Date();

  // ========== ABA: Resumo ==========
  const wsResumo = wb.addWorksheet('Resumo', { views: [{ showGridLines: false }] });
  wsResumo.columns = [{ width: 28 }, { width: 18 }];

  let row = 1;

  // Cabeçalho principal
  wsResumo.mergeCells(row, 1, row, 2);
  const headerCell = wsResumo.getCell(row, 1);
  headerCell.value = 'Relatório Financeiro — Fluxo de Caixa';
  Object.assign(headerCell, headerStyle);
  headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  row += 2;

  // Filtros aplicados
  wsResumo.mergeCells(row, 1, row, 2);
  const filterTitleCell = wsResumo.getCell(row, 1);
  filterTitleCell.value = 'Filtros aplicados';
  filterTitleCell.font = { bold: true, size: 11 };
  filterTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.filtersBg } };
  filterTitleCell.border = { bottom: { style: 'thin' } };
  row += 1;

  wsResumo.getCell(row, 1).value = 'Período';
  wsResumo.getCell(row, 2).value = `${formatDateBr(filters.dateFrom)} a ${formatDateBr(filters.dateTo)}`;
  row += 1;
  wsResumo.getCell(row, 1).value = 'Loja';
  wsResumo.getCell(row, 2).value = filters.storeLabel;
  row += 2;

  // Seção Indicadores
  wsResumo.getCell(row, 1).value = 'Indicadores';
  wsResumo.getCell(row, 2).value = 'Valor';
  wsResumo.getRow(row).eachCell((c) => {
    c.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionTitle } };
    applyBorder(c);
  });
  row += 1;

  const indicators = [
    ['Faturamento', d?.revenue ?? 0, 'currency'],
    ['Total de vendas', d?.total_orders ?? 0, 'number'],
    ['Custos', d?.costs ?? 0, 'currency'],
    ['Lucro', d?.profit ?? 0, 'currency'],
    ['Margem (%)', ((d?.profit_margin ?? 0) / 100) as number, 'percent'],
    ['Ticket Médio', d?.average_ticket ?? 0, 'currency'],
    ['Aguardando Retirada (total)', d?.pending?.total ?? 0, 'currency'],
    ['Aguardando Retirada (qtd OS)', d?.pending?.count ?? 0, 'number'],
    ['Inadimplências (total)', d?.overdue?.total ?? 0, 'currency'],
    ['Inadimplências (qtd OS)', d?.overdue?.count ?? 0, 'number'],
    ['Despesas', d?.expenses ?? 0, 'currency'],
  ];

  indicators.forEach(([label, val], i) => {
    const r = wsResumo.getRow(row);
    r.getCell(1).value = label as string;
    r.getCell(2).value = val as number;
    if ((val as number) < 0) r.getCell(2).font = { color: { argb: COLORS.cost } };
    if ((label as string).includes('Custos') || (label as string).includes('Despesas') || (label as string).includes('Inadimplências (total)')) {
      r.getCell(2).font = { color: { argb: COLORS.cost } };
    }
    if ((label as string).includes('Lucro') || (label as string).includes('Faturamento')) {
      r.getCell(2).font = { color: { argb: COLORS.profit } };
    }
    if ((indicators[i][2] as string) === 'currency') r.getCell(2).numFmt = currencyFormat;
    if ((indicators[i][2] as string) === 'percent') r.getCell(2).numFmt = percentFormat;
    r.eachCell(applyBorder);
    if (row % 2 === 0) r.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } }; });
    row += 1;
  });

  // Destaque: Resumo Financeiro
  row += 1;
  wsResumo.getCell(row, 1).value = 'Resumo Financeiro';
  wsResumo.getCell(row, 1).font = { bold: true, size: 12 };
  wsResumo.getCell(row, 2).value = (d?.revenue ?? 0) - (d?.costs ?? 0);
  wsResumo.getCell(row, 2).numFmt = currencyFormat;
  wsResumo.getCell(row, 2).font = { bold: true, color: { argb: COLORS.profit } };
  wsResumo.getRow(row).eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalBg } };
    applyBorder(c);
  });

  // ========== ABA: Faturamento por Loja ==========
  const wsRevenue = wb.addWorksheet('Faturamento por Loja', { views: [{ showGridLines: false }] });
  wsRevenue.columns = [{ width: 22 }, { width: 14 }, { width: 12 }, { width: 16 }, { width: 16 }];

  row = 1;
  wsRevenue.mergeCells(row, 1, row, 5);
  const revHeader = wsRevenue.getCell(row, 1);
  revHeader.value = 'Relatório Financeiro — Faturamento por Loja';
  Object.assign(revHeader, headerStyle);
  revHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  row += 1;

  wsRevenue.mergeCells(row, 1, row, 5);
  const revFilter = wsRevenue.getCell(row, 1);
  revFilter.value = `Filtros: ${formatDateBr(filters.dateFrom)} a ${formatDateBr(filters.dateTo)} • ${filters.storeLabel}`;
  revFilter.font = { size: 10, color: { argb: 'FF64748b' } };
  row += 2;

  const revCols = ['Loja', 'Unidade', 'Qtd. Vendas', 'Faturamento', 'Ticket Médio'];
  revCols.forEach((h, c) => {
    const cell = wsRevenue.getCell(row, c + 1);
    cell.value = h;
    Object.assign(cell, tableHeaderStyle);
  });
  row += 1;

  const revDataStart = row;
  revenueByStore.forEach((s, i) => {
    const r = wsRevenue.getRow(row);
    r.getCell(1).value = s.name;
    r.getCell(2).value = s.unity ?? '';
    r.getCell(3).value = s.count;
    r.getCell(4).value = s.total;
    r.getCell(4).numFmt = currencyFormat;
    r.getCell(5).value = s.average_ticket;
    r.getCell(5).numFmt = currencyFormat;
    r.eachCell(applyBorder);
    if (i % 2 === 1) r.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } }; });
    row += 1;
  });

  if (revenueByStore.length > 0) {
    const revTotalRow = wsRevenue.getRow(row);
    revTotalRow.getCell(1).value = 'TOTAL';
    revTotalRow.getCell(3).value = { formula: `SUM(C${revDataStart}:C${row - 1})` };
    revTotalRow.getCell(4).value = { formula: `SUM(D${revDataStart}:D${row - 1})` };
    revTotalRow.getCell(4).numFmt = currencyFormat;
    revTotalRow.getCell(5).value = { formula: `SUM(E${revDataStart}:E${row - 1})` };
    revTotalRow.getCell(5).numFmt = currencyFormat;
    revTotalRow.eachCell((c) => { Object.assign(c, totalRowStyle); applyBorder(c); });
  }

  // ========== ABA: Top Vendedores ==========
  const wsSellers = wb.addWorksheet('Top Vendedores', { views: [{ showGridLines: false }] });
  wsSellers.columns = [{ width: 22 }, { width: 26 }, { width: 12 }, { width: 16 }, { width: 16 }];

  row = 1;
  wsSellers.mergeCells(row, 1, row, 5);
  const sellHeader = wsSellers.getCell(row, 1);
  sellHeader.value = 'Relatório Financeiro — Top Vendedores';
  Object.assign(sellHeader, headerStyle);
  sellHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  row += 1;

  wsSellers.mergeCells(row, 1, row, 5);
  const sellFilter = wsSellers.getCell(row, 1);
  sellFilter.value = `Filtros: ${formatDateBr(filters.dateFrom)} a ${formatDateBr(filters.dateTo)} • ${filters.storeLabel}`;
  sellFilter.font = { size: 10, color: { argb: 'FF64748b' } };
  row += 2;

  const sellCols = ['Vendedor', 'E-mail', 'Qtd. Vendas', 'Faturamento', 'Ticket Médio'];
  sellCols.forEach((h, c) => {
    const cell = wsSellers.getCell(row, c + 1);
    cell.value = h;
    Object.assign(cell, tableHeaderStyle);
  });
  row += 1;

  const sellDataStart = row;
  topSellers.forEach((s, i) => {
    const r = wsSellers.getRow(row);
    r.getCell(1).value = s.name;
    r.getCell(2).value = s.email ?? '';
    r.getCell(3).value = s.count;
    r.getCell(4).value = s.total;
    r.getCell(4).numFmt = currencyFormat;
    r.getCell(5).value = s.average_ticket;
    r.getCell(5).numFmt = currencyFormat;
    r.eachCell(applyBorder);
    if (i % 2 === 1) r.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } }; });
    row += 1;
  });

  if (topSellers.length > 0) {
    const sellTotalRow = wsSellers.getRow(row);
    sellTotalRow.getCell(1).value = 'TOTAL';
    sellTotalRow.getCell(3).value = { formula: `SUM(C${sellDataStart}:C${row - 1})` };
    sellTotalRow.getCell(4).value = { formula: `SUM(D${sellDataStart}:D${row - 1})` };
    sellTotalRow.getCell(4).numFmt = currencyFormat;
    sellTotalRow.getCell(5).value = { formula: `SUM(E${sellDataStart}:E${row - 1})` };
    sellTotalRow.getCell(5).numFmt = currencyFormat;
    sellTotalRow.eachCell((c) => { Object.assign(c, totalRowStyle); applyBorder(c); });
  }

  // ========== ABA: Inadimplências ==========
  const wsOverdue = wb.addWorksheet('Inadimplências', { views: [{ showGridLines: false }] });
  wsOverdue.columns = [{ width: 10 }, { width: 20 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 16 }];

  row = 1;
  wsOverdue.mergeCells(row, 1, row, 7);
  const ovHeader = wsOverdue.getCell(row, 1);
  ovHeader.value = 'Relatório Financeiro — Inadimplências';
  Object.assign(ovHeader, headerStyle);
  ovHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  row += 1;

  wsOverdue.mergeCells(row, 1, row, 7);
  const ovFilter = wsOverdue.getCell(row, 1);
  ovFilter.value = `Filtros: ${formatDateBr(filters.dateFrom)} a ${formatDateBr(filters.dateTo)} • ${filters.storeLabel}`;
  ovFilter.font = { size: 10, color: { argb: 'FF64748b' } };
  row += 2;

  const ovCols = ['Nº OS', 'Cliente', 'Telefone', 'Loja', 'Dias Atraso', 'Valor', 'Chegada'];
  ovCols.forEach((h, c) => {
    const cell = wsOverdue.getCell(row, c + 1);
    cell.value = h;
    Object.assign(cell, tableHeaderStyle);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef2f2' } };
    cell.font = { bold: true, size: 11, color: { argb: COLORS.cost } };
    applyBorder(cell);
  });
  row += 1;

  const ovDataStart = row;
  overdueSummary.forEach((o, i) => {
    const r = wsOverdue.getRow(row);
    r.getCell(1).value = String(o.os_number).padStart(4, '0');
    r.getCell(2).value = o.client_name;
    r.getCell(3).value = o.client_phone ?? '';
    r.getCell(4).value = o.store_name;
    r.getCell(5).value = o.days_overdue;
    r.getCell(6).value = o.price;
    r.getCell(6).numFmt = currencyFormat;
    r.getCell(6).font = { color: { argb: COLORS.cost } };
    r.getCell(7).value = o.arrived_at ?? '';
    r.eachCell(applyBorder);
    if (i % 2 === 1) r.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } }; });
    row += 1;
  });

  if (overdueSummary.length > 0) {
    const ovTotalRow = wsOverdue.getRow(row);
    ovTotalRow.getCell(1).value = 'TOTAL';
    ovTotalRow.getCell(6).value = { formula: `SUM(F${ovDataStart}:F${row - 1})` };
    ovTotalRow.getCell(6).numFmt = currencyFormat;
    ovTotalRow.getCell(6).font = { bold: true, color: { argb: COLORS.cost } };
    ovTotalRow.eachCell((c) => { Object.assign(c, totalRowStyle); applyBorder(c); });
  }

  const safeLabel = filters.storeLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') || 'todas-lojas';
  const filename = `fluxo-de-caixa-${formatDateBr(filters.dateFrom)}-a-${formatDateBr(filters.dateTo)}-${safeLabel}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
