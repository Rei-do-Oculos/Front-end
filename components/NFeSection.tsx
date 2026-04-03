import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, FileDown, Printer, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../services/hooks/useAuth';
import { userHasAccessToStore } from '../utils/storeAccess';
import { Card, Button } from './Common';
import { invoicesService } from '../services/api/invoices';
import { invoiceToNFCeData, buildReciboHtml } from '../utils/nfceCupom';
import type { ServiceOrder } from '../services/api/serviceOrders';
import {
  isEligibleToEmitNewNfe,
  orderHasInvoice,
} from '../utils/serviceOrderNfeEligibility';

const getInvoiceType = (accessKey: string | null | undefined): 'NF-e' | 'NFC-e' => {
  if (!accessKey || accessKey.length < 22) return 'NF-e';
  return accessKey.slice(20, 22) === '65' ? 'NFC-e' : 'NF-e';
};

/** Erros da SEFAZ exigem correção de dados; retry não resolve. */
const isSefazError = (msg: string | null | undefined): boolean => {
  if (!msg || typeof msg !== 'string') return false;
  const m = msg.toLowerCase();
  return (
    m.includes('rejei') ||
    m.includes('sefaz') ||
    m.includes('cnpj') ||
    m.includes('cpf') ||
    m.includes('diverge') ||
    m.includes('denegad') ||
    /\b[23]\d{2}\b/.test(m) // códigos 2XX, 3XX
  );
};

const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface NFeSectionProps {
  serviceOrder: ServiceOrder;
  onEmitted?: () => void;
}

export const NFeSection: React.FC<NFeSectionProps> = ({ serviceOrder, onEmitted }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emitting, setEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeId = serviceOrder.store_id ?? (serviceOrder.store as { id?: number })?.id;
  const canGenerateInvoice = userHasAccessToStore(storeId, user);

  const hasInvoice = orderHasInvoice(serviceOrder);
  const invoice = (serviceOrder as any).invoice ?? null;
  const canEmitNew = isEligibleToEmitNewNfe(serviceOrder);

  if (!hasInvoice && !canEmitNew) {
    return null;
  }

  // Sem acesso à loja e sem nota emitida: ocultar a seção inteira
  if (!canGenerateInvoice && !hasInvoice) {
    return null;
  }

  const handleEmit = async (retry = false) => {
    setError(null);
    setEmitting(true);
    try {
      const inv = await invoicesService.generateFromServiceOrder(String(serviceOrder.id), true, undefined, retry);
      const isRejected = inv?.status === 'rejected' || inv?.status === 'denied';
      const rejectionMsg = isRejected
        ? (inv?.brasilnfe_response as { Error?: string })?.Error || inv?.status_message || 'NF-e rejeitada pela SEFAZ.'
        : null;
      if (isRejected && rejectionMsg) {
        setError(rejectionMsg);
        return;
      }
      onEmitted?.();
    } catch (e: any) {
      setError(e.response?.data?.data?.errors?.message || e.message || 'Erro ao emitir NF-e');
    } finally {
      setEmitting(false);
    }
  };

  const handlePrintRecibo = async () => {
    if (!invoice?.id) return;
    try {
      const inv = await invoicesService.getById(String(invoice.id));
      const reciboData = invoiceToNFCeData(inv);
      if (!reciboData) {
        setError('Dados da nota incompletos para recibo.');
        return;
      }
      const reciboTipo = getInvoiceType(inv.access_key);
      const html = buildReciboHtml(reciboData, reciboTipo);
      const w = window.open('', '_blank', 'width=400,height=800');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 400);
      } else {
        setError('Permita popups para imprimir.');
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao imprimir recibo');
    }
  };

  const handleDownloadXml = async () => {
    if (!invoice?.id) return;
    try {
      const blob = await invoicesService.downloadXml(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NF-e-${invoice.invoice_number || invoice.id}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Erro ao baixar XML');
    }
  };

  if (hasInvoice && invoice) {
    const isError = invoice.status === 'rejected' || invoice.status === 'denied';
    const canRetry = isError && !isSefazError(invoice.status_message);

    if (isError) {
      return (
        <Card title="Nota Fiscal Eletrônica (NF-e)" className="border-l-4 border-l-amber-500">
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">NF-e #{invoice.invoice_number}</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Série {invoice.series} • {invoice.status === 'rejected' ? 'Rejeitada' : 'Denegada'}
                  </p>
                  {invoice.status_message && (
                    <p className="text-xs text-slate-600 mt-1 max-w-md">{invoice.status_message}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 text-sm"
                >
                  <ExternalLink size={16} /> Ver NF-e
                </Button>
                {canRetry && canGenerateInvoice && (
                  <Button
                    onClick={() => handleEmit(true)}
                    disabled={emitting}
                    style={emitting ? undefined : { backgroundColor: 'var(--store-color)' }}
                    className="text-sm"
                  >
                    {emitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Gerando...</>
                    ) : (
                      <><RefreshCw size={16} /> Gerar novamente</>
                    )}
                  </Button>
                )}
                {canRetry && !canGenerateInvoice && (
                  <p className="text-xs text-slate-500">Você não tem acesso a esta loja para gerar nota fiscal.</p>
                )}
              </div>
            </div>
            {error && (
              <div className="mt-3 p-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            {isError && !canRetry && (
              <p className="mt-2 text-xs text-slate-500">
                Erro da SEFAZ: corrija os dados cadastrais antes de tentar novamente.
              </p>
            )}
          </div>
        </Card>
      );
    }

    return (
      <Card title="Nota Fiscal Eletrônica (NF-e)" className="border-l-4 border-l-emerald-500">
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">NF-e #{invoice.invoice_number}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Série {invoice.series} • {invoice.status || 'Emitida'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/invoices/${invoice.id}`)}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm"
              >
                <ExternalLink size={16} /> Ver NF-e
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintRecibo}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm"
              >
                <Printer size={16} /> Recibo
              </Button>
              <Button variant="outline" onClick={handleDownloadXml} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm">
                <FileDown size={16} /> XML
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Sem NF-e: preview (resumo) + botão Emitir (ou mensagem se sem acesso à loja)
  const clientName = (serviceOrder.client as any)?.name || 'Cliente';
  const price = typeof serviceOrder.price === 'number' ? serviceOrder.price : parseFloat(String(serviceOrder.price || 0));

  return (
    <Card title="Nota Fiscal Eletrônica (NF-e)" className="border-l-4 border-l-amber-500">
      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
        <p className="text-sm text-slate-600 mb-3">Pré-visualização do que será emitido:</p>
        <ul className="text-sm text-slate-700 space-y-1 mb-4">
          <li><strong>Destinatário:</strong> {clientName}</li>
          <li><strong>Item:</strong> Serviço Óptico</li>
          <li><strong>Valor total:</strong> {formatCurrency(price)}</li>
        </ul>
        {error && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <Button
          onClick={() => handleEmit(false)}
          disabled={emitting || !price || price <= 0}
          style={emitting ? undefined : { backgroundColor: 'var(--store-color)' }}
        >
          {emitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Emitindo...
            </>
          ) : (
            <>
              <FileText size={18} /> Emitir NF-e
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
