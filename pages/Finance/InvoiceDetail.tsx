import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Building2,
  DollarSign,
  CreditCard,
  FileCode,
  Copy,
  Mail,
  Phone,
  MapPin,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileEdit,
  Eye,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/Common';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../services/hooks/useAuth';
import { usePermission } from '../../services/hooks/usePermission';
import { userHasAccessToStore } from '../../utils/storeAccess';
import { invoicesService, type Invoice } from '../../services/api/invoices';
import { invoiceToNFCeData, buildReciboHtml } from '../../utils/nfceCupom';
import { ClientWhatsAppAvatar } from '../../components/ClientWhatsAppAvatar';

/** Obtém tipo da nota pela chave (pos 20-21: 55=NF-e, 65=NFC-e). */
function getInvoiceType(accessKey: string | null | undefined): 'NFC-e' | 'NF-e' {
  if (!accessKey || accessKey.length < 22) return 'NF-e';
  const modelo = accessKey.slice(20, 22);
  return modelo === '65' ? 'NFC-e' : 'NF-e';
}

const formatCpf = (doc: string | undefined | null): string => {
  if (!doc) return '—';
  const n = doc.replace(/\D/g, '');
  if (n.length !== 11) return doc;
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const statusLabel: Record<string, string> = {
  authorized: 'Autorizada',
  pending: 'Pendente',
  rejected: 'Rejeitada',
  denied: 'Denegada',
  cancelled: 'Cancelada',
};

const paymentLabel: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
  permuta: 'Permuta',
  on_pickup: 'Pagamento na Retirada',
};

function mapInvoiceToDisplay(inv: Invoice) {
  const client = inv.service_order?.client;
  const store = inv.store;
  const emission = inv.emission_date ? new Date(inv.emission_date) : null;
  const authDate = inv.authorization_date ? new Date(inv.authorization_date) : null;
  const dateStr = (authDate || emission) ? (authDate || emission)!.toLocaleDateString('pt-BR') : '—';
  const timeStr = (authDate || emission) ? (authDate || emission)!.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
  const firstPayment = inv.payments?.[0];
  const total = Number(inv.total_value) || 0;
  const qty = inv.payments?.length || 1;
  return {
    invoiceNumber: inv.invoice_number,
    series: inv.series,
    status: statusLabel[inv.status] || inv.status,
    statusRaw: inv.status,
    statusMessage: inv.status_message || null,
    client: client?.name || '—',
    clientCpf: formatCpf(client?.document),
    clientEmail: client?.email || null,
    clientPhone: client?.phone || null,
    osNumber: inv.service_order?.os_number ?? inv.service_order_id,
    osId: inv.service_order_id,
    date: dateStr,
    time: timeStr,
    value: total,
    store: store?.name || '—',
    storeFancyName: store?.fancy_name || store?.name || '—',
    storeUnity: store?.unity || null,
    storeCnpj: store?.cnpj || '—',
    storeIe: store?.ie || null,
    storeAddress: [store?.logradouro, store?.numero, store?.bairro, store?.municipio, store?.uf, store?.cep].filter(Boolean).join(', ') || '—',
    storePhone: store?.telefone || null,
    storeEmail: store?.email || null,
    accessKey: inv.access_key || null,
    protocol: inv.protocol || null,
    invoiceType: getInvoiceType(inv.access_key),
    items: (Array.isArray(inv.items) ? inv.items : (inv.items ? Object.values(inv.items) : [])).map((i: any) => ({
      description: i?.description ?? '—',
      ncm: i?.ncm || '—',
      quantity: Number(i?.quantity) || 0,
      unitValue: Number(i?.unit_value) || 0,
      totalValue: Number(i?.total_value) || 0,
    })),
    paymentMethod: firstPayment ? paymentLabel[firstPayment.payment_method] || firstPayment.payment_method : '—',
    installments: qty > 1 ? qty : undefined,
    installmentValue: qty > 1 ? total / qty : undefined,
    qrCode: inv.access_key
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inv.access_key)}`
      : null,
  };
}

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showSuccess, showError } = useNotification();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartaModalOpen, setCartaModalOpen] = useState(false);
  const [cartaTexto, setCartaTexto] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [eventosLoading, setEventosLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'carta' | 'cancel' | 'devolucao' | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    invoicesService
      .getById(id)
      .then((data) => {
        if (!cancelled) {
          setInvoice(data);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e.response?.data?.data?.errors?.message || e.message || 'Erro ao carregar nota fiscal');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copiado!', `${label} copiado para a área de transferência.`);
  };

  const handleDownloadXml = async () => {
    if (!invoice?.id) return;
    try {
      const blob = await invoicesService.downloadXml(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.access_key ? getInvoiceType(invoice.access_key) : 'NF-e'}-${invoice.invoice_number}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Download', 'XML baixado.');
    } catch (e: any) {
      showError('Erro ao baixar XML', e.message || 'Tente novamente.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice?.id) return;
    try {
      const blob = await invoicesService.downloadPdf(invoice.id);
      if (!(blob instanceof Blob)) throw new Error('Resposta inválida.');
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const json = JSON.parse(text);
        throw new Error(json?.data?.message || json?.message || 'Erro no servidor.');
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE-${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Download', 'DANFE baixado.');
    } catch (e: any) {
      showError('Erro ao baixar DANFE', e.message || 'Tente novamente.');
    }
  };

  const handlePrintRecibo = () => {
    if (!invoice) return;
    const reciboTipo = getInvoiceType(invoice.access_key);
    const reciboData = invoiceToNFCeData(invoice);
    if (!reciboData) {
      showError('Recibo', 'Dados da nota incompletos.');
      return;
    }
    const html = buildReciboHtml(reciboData, reciboTipo);
    const w = window.open('', '_blank', 'width=400,height=800');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        w.print();
        showSuccess('Recibo', 'Desmarque "Cabeçalhos e rodapés" na janela de impressão para não incluir URL nem título na saída.');
      }, 400);
    } else {
      showError('Recibo', 'Permita popups para imprimir.');
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'carta') {
      setConfirmAction(null);
      setCartaModalOpen(true);
    } else if (confirmAction === 'cancel') {
      setConfirmAction(null);
      setCancelModalOpen(true);
    } else if (confirmAction === 'devolucao') {
      setConfirmAction(null);
      handleGerarDevolucao();
    }
  };

  const invoiceType = invoice ? getInvoiceType(invoice.access_key) : 'NF-e';
  const confirmModalConfig = {
    carta: {
      title: 'Carta de Correção (CC-e)',
      message: 'Você está prestes a enviar uma Carta de Correção. Ela corrige apenas informações permitidas pela legislação (ex.: observações), não valores, dados cadastrais, data ou número da nota. Deseja continuar?',
    },
    cancel: {
      title: `Cancelar ${invoiceType}`,
      message: `Atenção: Cancelar a ${invoiceType} é irreversível. A nota perderá validade fiscal na SEFAZ. Tem certeza que deseja continuar?`,
    },
    devolucao: {
      title: 'Gerar nota de devolução',
      message: 'Você está prestes a gerar uma nota de devolução. Uma nova NF-e será emitida referenciando esta venda, registrando a devolução da mercadoria/serviço. Continuar?',
    },
  };

  const handleGerarDevolucao = async () => {
    if (!invoice?.id) return;
    setEventosLoading(true);
    try {
      const newInvoice = await invoicesService.gerarDevolucao(invoice.id, true);
      showSuccess('Nota de devolução', 'Emitida com sucesso.');
      setInvoice(await invoicesService.getById(String(invoice.id)));
      navigate(`/invoices/${newInvoice.id}`);
    } catch (e: any) {
      showError('Nota de devolução', e.message || 'Erro ao gerar.');
    } finally {
      setEventosLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    const reason = (cancelReason || '').trim();
    const invType = invoice ? getInvoiceType(invoice.access_key) : 'NF-e';
    if (reason.length < 15) {
      showError(`Cancelar ${invType}`, 'Justificativa deve ter no mínimo 15 caracteres.');
      return;
    }
    if (!invoice?.id) return;
    setEventosLoading(true);
    try {
      const updated = await invoicesService.cancel(invoice.id, reason);
      setInvoice(updated);
      setCancelModalOpen(false);
      setCancelReason('');
      showSuccess(`Cancelar ${invType}`, 'Nota cancelada na SEFAZ.');
    } catch (e: any) {
      showError(`Cancelar ${invType}`, e.message || 'Erro ao cancelar.');
    } finally {
      setEventosLoading(false);
    }
  };

  const handleCartaCorrecaoSubmit = async () => {
    const text = (cartaTexto || '').trim();
    if (text.length < 15 || text.length > 1000) {
      showError('Carta de Correção', 'O texto deve ter entre 15 e 1000 caracteres.');
      return;
    }
    if (!invoice?.id) return;
    setEventosLoading(true);
    try {
      const updated = await invoicesService.sendCartaCorrecao(invoice.id, text);
      setInvoice(updated);
      setCartaModalOpen(false);
      setCartaTexto('');
      showSuccess('Carta de Correção', 'Enviada com sucesso.');
    } catch (e: any) {
      showError('Carta de Correção', e.message || 'Erro ao enviar.');
    } finally {
      setEventosLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={18} /> Voltar
        </Button>
        <Card className="p-8 text-center">
          <p className="text-slate-600">{error || 'Nota fiscal não encontrada.'}</p>
        </Card>
      </div>
    );
  }

  const d = mapInvoiceToDisplay(invoice);

  const getStatusIcon = () => {
    switch (d.statusRaw) {
      case 'authorized':
        return <CheckCircle2 size={24} className="text-emerald-600" />;
      case 'cancelled':
      case 'rejected':
      case 'denied':
        return <XCircle size={24} className="text-red-600" />;
      case 'pending':
        return <Clock size={24} className="text-amber-600" />;
      default:
        return <AlertCircle size={24} className="text-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (d.statusRaw) {
      case 'authorized':
        return 'border-l-emerald-500 bg-emerald-50/50';
      case 'cancelled':
      case 'rejected':
      case 'denied':
        return 'border-l-red-500 bg-red-50/50';
      case 'pending':
        return 'border-l-amber-500 bg-amber-50/50';
      default:
        return 'border-l-slate-500 bg-slate-50/50';
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/invoices')} className="border-slate-200 text-slate-600 bg-white">
            <ArrowLeft size={18} /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">{d.invoiceType} #{d.invoiceNumber}</h1>
            <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Série {d.series} • {d.status}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {d.statusRaw === 'authorized' && (
            <>
              <Button variant="outline" className="border-slate-200 text-slate-600 bg-white" onClick={handleDownloadXml}>
                <Download size={18} /> XML
              </Button>
              <Button variant="outline" className="border-slate-200 text-slate-600 bg-white" onClick={handlePrintRecibo} title="Reimprimir cupom">
                <Printer size={18} /> Imprimir Cupom
              </Button>
              {d.invoiceType === 'NF-e' && (
                <Button variant="outline" className="border-slate-200 text-slate-600 bg-white" onClick={handleDownloadPdf}>
                  <Download size={18} /> Baixar DANFE
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Card className={`border-l-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Status: {d.status}</p>
              <p className="text-xs text-slate-600 mt-1">
                {d.protocol && `Protocolo: ${d.protocol} • `}Emitida em {d.date} às {d.time}
              </p>
              {d.statusRaw === 'rejected' && d.statusMessage && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Motivo da rejeição (SEFAZ): {d.statusMessage}
                </p>
              )}
            </div>
          </div>
          <Badge variant={d.statusRaw === 'authorized' ? 'success' : d.statusRaw === 'pending' ? 'warning' : 'danger'}>
            {d.status}
          </Badge>
        </div>
      </Card>

      {d.statusRaw === 'authorized' && userHasAccessToStore(invoice.store_id ?? invoice.store?.id, user) && (
        <Card title="Ações" className="border-slate-200 print:hidden">
          <p className="text-xs text-slate-500 mb-4">
            Corrigir informações (Carta de Correção), cancelar a {d.invoiceType} na SEFAZ ou gerar nota de devolução. Justificativa de cancelamento: mínimo 15 caracteres.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600"
              onClick={() => setConfirmAction('carta')}
              disabled={eventosLoading}
            >
              <FileEdit size={18} /> Carta de Correção
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setConfirmAction('cancel')}
              disabled={eventosLoading}
            >
              <XCircle size={18} /> Cancelar {d.invoiceType}
            </Button>
            {!invoice.original_invoice_id ? (
              invoice.devolucao_invoice ? (
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-600"
                  onClick={() => navigate(`/invoices/${invoice.devolucao_invoice!.id}`)}
                >
                  <Eye size={18} /> Ver nota de devolução
                </Button>
              ) : hasPermission('invoices.gerar-devolucao') ? (
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => setConfirmAction('devolucao')}
                  disabled={eventosLoading}
                >
                  <FileText size={18} /> Gerar nota de devolução
                </Button>
              ) : null
            ) : (
              <Button
                variant="outline"
                className="border-slate-200 text-slate-600"
                onClick={() => navigate(`/invoices/${invoice.original_invoice_id!}`)}
              >
                <Eye size={18} /> Ver nota original
              </Button>
            )}
          </div>
        </Card>
      )}

      <Modal
        isOpen={cartaModalOpen}
        onClose={() => !eventosLoading && setCartaModalOpen(false)}
        title="Carta de Correção (CC-e)"
        message="Informe o texto da correção (entre 15 e 1000 caracteres). Não é possível corrigir valores, dados cadastrais, data ou número da nota."
      >
        <div className="space-y-4">
          <textarea
            value={cartaTexto}
            onChange={(e) => setCartaTexto(e.target.value)}
            placeholder="Ex.: Correção do endereço de entrega conforme combinado com o cliente."
            className="w-full min-h-[120px] px-4 py-3 border border-slate-200 rounded-xl text-sm resize-y"
            maxLength={1000}
          />
          <p className="text-xs text-slate-500">{cartaTexto.length} / 1000 (mín. 15)</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCartaModalOpen(false)} disabled={eventosLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCartaCorrecaoSubmit} disabled={eventosLoading || cartaTexto.trim().length < 15}>
              {eventosLoading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => !eventosLoading && (setCancelModalOpen(false), setCancelReason(''))}
        title={`Cancelar ${d.invoiceType}`}
        message="O cancelamento é irreversível. Informe a justificativa (mínimo 15 caracteres)."
      >
        <div className="space-y-4">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ex.: Erro nos dados do cliente. Necessário cancelar para reemitir."
            className="w-full min-h-[100px] px-4 py-3 border border-slate-200 rounded-xl text-sm resize-y"
            maxLength={255}
          />
          <p className="text-xs text-slate-500">{cancelReason.length} / 255 (mín. 15)</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => (setCancelModalOpen(false), setCancelReason(''))} disabled={eventosLoading}>
              Voltar
            </Button>
            <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={handleCancelSubmit} disabled={eventosLoading || cancelReason.trim().length < 15}>
              {eventosLoading ? <Loader2 size={18} className="animate-spin" /> : `Cancelar ${d.invoiceType}`}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmAction !== null}
        onClose={() => !eventosLoading && setConfirmAction(null)}
        title={confirmAction ? confirmModalConfig[confirmAction].title : ''}
        message={confirmAction ? confirmModalConfig[confirmAction].message : ''}
        type="warning"
        confirmText="Sim, continuar"
        cancelText="Voltar"
        onConfirm={handleConfirmAction}
        showCancel={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Dados do Cliente">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <ClientWhatsAppAvatar
                  phone={d.clientPhone}
                  clientName={d.client}
                  iconSize={20}
                />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{d.client}</p>
                  <p className="text-xs text-slate-500 mt-0.5">CPF: {d.clientCpf}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OS Relacionada</p>
                  <button
                    onClick={() => navigate(`/service-orders/${invoice.service_order_id}`)}
                    className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline mt-1"
                  >
                    OS #{d.osNumber}
                  </button>
                </div>
              </div>
              {d.clientEmail && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{d.clientEmail}</p>
                  </div>
                </div>
              )}
              {d.clientPhone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Phone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{d.clientPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Itens da Nota Fiscal">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">NCM</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Qtd</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(Array.isArray(d.items) ? d.items : []).map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-mono text-slate-500">{item.ncm}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm font-bold text-slate-700">{item.quantity}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(item.unitValue)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(item.totalValue)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={4} className="px-4 py-4 text-right">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-lg font-black text-red-600">{formatCurrency(d.value)}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Card title="Informações Fiscais">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave de Acesso</p>
                  <p className="text-xs font-mono text-slate-700 mt-1 break-all">{d.accessKey || 'Aguardando autorização...'}</p>
                </div>
                {d.accessKey && (
                  <button
                    onClick={() => copyToClipboard(d.accessKey!, 'Chave de acesso')}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all flex-shrink-0 ml-2"
                    title="Copiar chave"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {d.protocol && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Autorização</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{d.protocol}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Emissão</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{d.date} às {d.time}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {d.qrCode && (
            <Card title="QR Code">
              <div className="flex flex-col items-center justify-center p-6">
                <img src={d.qrCode} alt={`QR Code ${d.invoiceType}`} className="w-48 h-48 border-2 border-slate-200 rounded-xl" />
                <p className="text-[10px] font-bold text-slate-400 mt-4 text-center">Escaneie para consultar a {d.invoiceType} na SEFAZ</p>
              </div>
            </Card>
          )}

          <Card title="Pagamento">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <CreditCard size={18} className="text-slate-400" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{d.paymentMethod}</p>
                  {d.installments != null && d.installments > 1 && d.installmentValue != null && (
                    <p className="text-xs text-slate-500 mt-0.5">{d.installments}x de {formatCurrency(d.installmentValue)}</p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Valor Total</p>
                    <p className="text-xl font-black text-red-600 mt-1">{formatCurrency(d.value)}</p>
                  </div>
                  <DollarSign size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Unidade">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalhes da unidade emitente</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Razão Social</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{d.store}</p>
                  {d.storeFancyName && d.storeFancyName !== d.store && (
                    <p className="text-xs text-slate-500 mt-0.5">Nome fantasia: {d.storeFancyName}</p>
                  )}
                  {d.storeUnity && (
                    <p className="text-xs text-slate-500 mt-0.5">Unidade: {d.storeUnity}</p>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</p>
                    <p className="text-xs font-mono text-slate-700">{d.storeCnpj}</p>
                  </div>
                </div>
                {d.storeIe && (
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscrição Estadual</p>
                      <p className="text-xs font-mono text-slate-700">{d.storeIe}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</p>
                  <p className="text-xs text-slate-600 mt-1">{d.storeAddress}</p>
                </div>
              </div>
              {(d.storePhone || d.storeEmail) && (
                <div className="flex flex-wrap gap-4">
                  {d.storePhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <p className="text-xs text-slate-600">{d.storePhone}</p>
                    </div>
                  )}
                  {d.storeEmail && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <p className="text-xs text-slate-600">{d.storeEmail}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
