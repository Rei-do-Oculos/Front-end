/**
 * PDF do relatório de inadimplências (OS overdue)
 */

import html2pdf from 'html2pdf.js';
import { generatePdfHeader, StoreData } from './pdfHeader';
import { formatDate } from './formatters';
import type { ServiceOrder } from '../services/api/serviceOrders';

export interface InadimplenciasReportPdfOptions {
  orders: ServiceOrder[];
  totalSales: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  storeFilterLabel?: string | null;
  searchTerm?: string | null;
  /** Rótulo do filtro de status (ativas / inativas / todas) */
  overdueStatusLabel?: string | null;
  storeData?: StoreData | null;
  storeColor?: string;
  storeLogo?: string | null;
  logoUrlBuilder?: (logoPath: string | null | undefined) => string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatOsNumber = (n: number) => String(n).padStart(4, '0');

const getDaysOverdue = (arrivedAt: string | null) => {
  if (!arrivedAt) return 0;
  const arrived = new Date(arrivedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  arrived.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((today.getTime() - arrived.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const statusLabel = (order: ServiceOrder): string => {
  const inactive = Boolean(order.overdue_inactive);
  return inactive ? 'Inativa (fora dos totais)' : 'Ativa (nos totais)';
};

const buildRows = (orders: ServiceOrder[], color: string): string => {
  if (!orders.length) {
    return `
      <tr>
        <td colspan="7" style="padding: 16px; text-align: center; color: #6b7280; border: 1px solid #e5e7eb;">Nenhuma inadimplência com os filtros aplicados</td>
      </tr>
    `;
  }
  return orders
    .map((order, i) => {
      const days = getDaysOverdue(order.arrived_at ?? null);
      const st = statusLabel(order);
      const stColor = order.overdue_inactive ? '#b91c1c' : '#15803d';
      return `
        <tr style="${i % 2 ? 'background: #f9fafb;' : ''}">
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px; font-weight: 700; color: ${color};">${formatOsNumber(order.os_number)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px;">${(order.client?.name || '-').replace(/</g, '&lt;')}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px;">${order.store?.name || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px; text-align: center;">${order.arrived_at ? formatDate(order.arrived_at) : '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px; text-align: center;">${days} ${days === 1 ? 'dia' : 'dias'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px; text-align: center; font-weight: 600; color: ${stColor};">${st}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 10px; text-align: right; font-weight: 600; color: ${color};">${formatCurrency(
            (order as ServiceOrder & { outstanding_pickup_amount?: number }).outstanding_pickup_amount ??
              order.price ??
              0
          )}</td>
        </tr>
      `;
    })
    .join('');
};

export const generateInadimplenciasReportPdf = async (options: InadimplenciasReportPdfOptions): Promise<void> => {
  const {
    orders,
    totalSales,
    dateFrom,
    dateTo,
    storeFilterLabel,
    searchTerm,
    overdueStatusLabel,
    storeData,
    storeColor,
    storeLogo,
    logoUrlBuilder,
  } = options;
  const color = storeData?.color ?? storeColor ?? '#dc2626';

  const headerHtml = await generatePdfHeader({
    storeData,
    storeColor,
    storeLogo,
    titleBelowStore: 'Relatório de Inadimplências',
    logoUrlBuilder,
  });

  const dateLine =
    dateFrom || dateTo
      ? `Chegou: ${dateFrom ? formatDate(dateFrom) : '...'} até ${dateTo ? formatDate(dateTo) : '...'}`
      : 'Chegou: (sem filtro de data)';
  const storeLine = storeFilterLabel ? `Ótica: ${storeFilterLabel}` : 'Ótica: todas (conforme seu acesso)';
  const searchLine = searchTerm ? `Busca: ${searchTerm.replace(/</g, '&lt;')}` : null;
  const statusLine = overdueStatusLabel ? `Status: ${overdueStatusLabel}` : null;

  const filtersHtml = [dateLine, storeLine, statusLine, searchLine].filter(Boolean).join(' · ');

  const contentHtml = `
    <div style="font-size: 10px; color: #6b7280; margin-bottom: 12px;">${filtersHtml}</div>
    <div style="padding: 14px; background: #fef2f2; border-radius: 8px; border-left: 4px solid ${color}; margin-bottom: 8px;">
      <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Total filtrado (soma das linhas abaixo)</div>
      <div style="font-size: 20px; font-weight: 700; color: ${color};">${orders.length} OS · ${formatCurrency(totalSales)}</div>
    </div>
    <div style="font-size: 9px; color: #6b7280; margin-bottom: 16px; line-height: 1.4;">
      OS <strong>inativas</strong> não entram nos totais do financeiro nem no gráfico do dashboard. Cada linha indica se a inadimplência está ativa ou inativa nos indicadores.
    </div>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 10px;">
      <thead>
        <tr style="background: #f3f4f6; border-left: 4px solid ${color};">
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Nº OS</th>
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Cliente</th>
          <th style="padding: 8px; text-align: left; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Ótica</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Chegou em</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Atraso</th>
          <th style="padding: 8px; text-align: center; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Status nos totais</th>
          <th style="padding: 8px; text-align: right; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${buildRows(orders, color)}
      </tbody>
    </table>
  `;

  const reportHtml = `
    <div id="inadimplencias-report-pdf" style="width: 210mm; max-width: 100%; margin: 0 auto; padding: 15mm 18mm; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; background: #fff; box-sizing: border-box;">
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
    const label = new Date().toISOString().slice(0, 10);
    await html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `inadimplencias-${label}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['tr', 'table'] },
      })
      .from(container.querySelector('#inadimplencias-report-pdf')!)
      .save();
  } finally {
    document.body.removeChild(container);
  }
};
