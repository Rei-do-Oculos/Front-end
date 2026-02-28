import React, { useRef, useState, useMemo } from 'react';
import { X, Printer, FileText, Receipt, Ban, Loader2, User, CheckCircle, ShoppingBag } from 'lucide-react';
import { ThermalReceipt, ReceiptData } from './ThermalReceipt';
import { NFCePreview, NFCeData } from './NFCePreview';
import { ServiceOrder } from '../services/api/serviceOrders';
import { clientsService } from '../services/api/clients';
import { invoiceToNFCeData, buildReciboHtml } from '../utils/nfceCupom';
import { invoicesService } from '../services/api/invoices';

function toItemsArray<T>(val: T[] | Record<string, T> | null | undefined): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}
import type { Invoice } from '../services/api/invoices';

type DocType = 'receipt' | 'nfce' | 'nfe' | 'none';

function normalizeDocType(type: DocType | undefined): DocType {
  if (!type) return 'receipt';
  // NFC-e foi ocultada no front; qualquer entrada legada cai para NF-e.
  return type === 'nfce' ? 'nfe' : type;
}

/** Verifica se o documento é CPF (11 dígitos) ou CNPJ (14 dígitos) válido */
function hasValidDocument(doc: string | null | undefined): boolean {
  if (!doc) return false;
  const digits = doc.replace(/\D/g, '');
  return digits.length === 11 || digits.length === 14;
}

/** Formata CPF para exibição */
function formatCpfDisplay(doc: string): string {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.***.***-$4');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/****-$5');
  return doc;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: DocType) => void;
  receiptData: ReceiptData;
  order?: ServiceOrder | null;
  clientPhone?: string | null;
  loading?: boolean;
  /** Tipo pré-selecionado ao abrir (aceita valores legados e normaliza para NF-e no front). */
  initialType?: DocType;
  /** Emitir nota na SEFAZ. modelo: 65=NFC-e (cupom), 55=NF-e. Retorna pdfBase64 e/ou invoice. */
  onGenerateInvoice?: (modelo: 55 | 65, options?: { includeDocument?: boolean }) => Promise<{ pdfBase64?: string; invoice?: Invoice } | null>;
  /** Se o usuário tem acesso à loja da OS para gerar NF-e. Quando false, oculta a opção de gerar nova nota (imprimir existente segue disponível). */
  canGenerateInvoice?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  receiptData,
  order = null,
  clientPhone = null,
  loading = false,
  initialType,
  onGenerateInvoice = undefined,
  canGenerateInvoice = true,
}) => {
  const [selectedType, setSelectedType] = useState<DocType>(normalizeDocType(initialType));
  const [invoiceGenerating, setInvoiceGenerating] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [includeDocumentOnInvoice, setIncludeDocumentOnInvoice] = useState(false);
  const [addCpfValue, setAddCpfValue] = useState('');
  const [addCpfError, setAddCpfError] = useState<string | null>(null);
  const [addCpfSaving, setAddCpfSaving] = useState(false);

  const hasInvoice = Boolean(order?.invoice_id ?? order?.invoice);

  // Sincronizar com initialType ao abrir
  React.useEffect(() => {
    if (isOpen && initialType) setSelectedType(normalizeDocType(initialType));
  }, [isOpen, initialType]);

  React.useEffect(() => {
    if (isOpen) setIncludeDocumentOnInvoice(false);
  }, [isOpen]);

  // Limpar estado ao trocar tipo ou fechar
  React.useEffect(() => {
    if (!isOpen || (selectedType !== 'nfce' && selectedType !== 'nfe')) {
      setAddCpfValue('');
      setAddCpfError(null);
      setInvoiceError(null);
    }
  }, [isOpen, selectedType]);
  const receiptRef = useRef<HTMLDivElement>(null);
  const nfceRef = useRef<HTMLDivElement>(null);

  const clientDoc = receiptData.client.document ?? (order?.client as { document?: string } | null)?.document;
  const hasClientDocument = hasValidDocument(clientDoc ?? null);

  // Converter ReceiptData para NFCeData (preview reflete o que será emitido: sem CPF se checkbox desmarcado)
  const nfceData: NFCeData = useMemo(() => ({
    store: receiptData.store,
    client: receiptData.client.name ? {
      name: receiptData.client.name,
      document: includeDocumentOnInvoice ? receiptData.client.document : undefined,
    } : undefined,
    items: toItemsArray(receiptData.items).map((item, index) => ({
      code: String(index + 1).padStart(6, '0'),
      description: item.description,
      quantity: item.quantity,
      unit: 'UND',
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    })),
    subtotal: receiptData.total,
    total: receiptData.total,
    paymentMethod: 'Cartão de Crédito',
    amountPaid: receiptData.total,
    nfceNumber: receiptData.osNumber,
    series: 1,
    accessKey: '41260130060044001786500100001042012449824 76',
    authProtocol: '141260113979101',
    federalTax: receiptData.total * 0.1343,
    stateTax: receiptData.total * 0.18,
    municipalTax: 0,
  }), [receiptData, includeDocumentOnInvoice]);

  const printPreviewAndConfirm = (docType: 'nfce' | 'nfe') => {
    const printContent = nfceRef.current;
    if (!printContent) { onConfirm(docType); return; }
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) {
      alert('Não foi possível abrir a janela. Verifique popups.');
      onConfirm(docType);
      return;
    }
    const styles = `<style>* { margin: 0; padding: 0; } body { font-family: Arial; padding: 12px; } @media print { body { -webkit-print-color-adjust: exact; } }</style>`;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${docType === 'nfce' ? 'NFC-e' : 'NF-e'} OS ${receiptData.osNumber}</title>${styles}</head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => { printWindow.print(); printWindow.close(); onConfirm(docType); }, 250);
    };
  };

  if (!isOpen) return null;

  const handlePrint = async () => {
    if (selectedType === 'none') {
      onConfirm('none');
      return;
    }

    if (selectedType === 'nfce' || selectedType === 'nfe') {
      const modelo: 55 | 65 = 55;
      const docLabel = 'NF-e';

      // Gerar nova nota: verificar permissão de loja
      if (!hasInvoice && !canGenerateInvoice) {
        alert('Você não tem acesso a esta loja para gerar nota fiscal. A NF-e só pode ser emitida por usuários vinculados à ótica da OS.');
        return;
      }

      // Nota já emitida: imprimir a existente (não gera nova)
      if (hasInvoice && order) {
        const invoiceId = order.invoice_id ?? (order.invoice as { id?: number })?.id;
        if (invoiceId) {
          setInvoiceGenerating(true);
          const printWindow = window.open('', '_blank', 'width=400,height=700');
          if (!printWindow) {
            alert('Não foi possível abrir a janela. Permita popups para imprimir.');
            setInvoiceGenerating(false);
            return;
          }
          printWindow.document.write(`<!DOCTYPE html><html><head><title>${docLabel}</title></head><body style="font-family:Arial;padding:24px;text-align:center;"><p>Carregando recibo...</p></body></html>`);
          printWindow.document.close();
          try {
            const inv = await invoicesService.getById(String(invoiceId));
            const reciboData = invoiceToNFCeData(inv);
            if (reciboData) {
              const html = buildReciboHtml(reciboData, 'NF-e');
              printWindow.document.open();
              printWindow.document.write(html);
              printWindow.document.close();
              printWindow.document.body?.offsetHeight;
              setTimeout(() => { printWindow.print(); printWindow.close(); onConfirm('nfe'); }, 500);
            } else {
              printWindow.document.body.innerHTML = '<p style="color:red">Dados da nota incompletos para recibo.</p>';
              setTimeout(() => printWindow.close(), 3000);
            }
          } catch (e) {
            printWindow.document.body.innerHTML = `<p style="color:red">${(e as Error)?.message || 'Erro ao carregar nota.'}</p>`;
            setTimeout(() => printWindow.close(), 3000);
          } finally {
            setInvoiceGenerating(false);
          }
          return;
        }
      }

      if (onGenerateInvoice) {
        let includeDocument = includeDocumentOnInvoice;
        if (includeDocument && !hasClientDocument && order?.client_id && addCpfValue.trim()) {
          const digits = addCpfValue.replace(/\D/g, '');
          if (digits.length !== 11 && digits.length !== 14) {
            setAddCpfError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
            return;
          }
          setAddCpfError(null);
          setAddCpfSaving(true);
          try {
            const formatted = digits.length === 11
              ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
              : digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
            await clientsService.update(String(order.client_id), { document: formatted });
          } catch (e) {
            setAddCpfSaving(false);
            setAddCpfError((e as Error)?.message || 'Erro ao atualizar cliente.');
            return;
          }
          setAddCpfSaving(false);
          includeDocument = true;
        } else if (includeDocument && !hasClientDocument && order?.client_id) {
          setAddCpfError('Adicione o CPF ou CNPJ do cliente para incluir na nota.');
          return;
        } else if (includeDocument && !hasClientDocument) {
          alert('Cliente sem CPF/CNPJ. Desmarque "CPF na nota" ou edite o cadastro do cliente.');
          return;
        }

        setInvoiceGenerating(true);
        setInvoiceError(null);
        const printWindow = window.open('', '_blank', 'width=400,height=700');
        if (!printWindow) {
          alert('Não foi possível abrir a janela. Permita popups para este site e tente novamente.');
          setInvoiceGenerating(false);
          return;
        }
        printWindow.document.write(`<!DOCTYPE html><html><head><title>${docLabel}</title></head><body style="font-family:Arial;padding:24px;text-align:center;"><p>Gerando ${docLabel}...</p></body></html>`);
        printWindow.document.close();
        try {
          const result = await onGenerateInvoice(modelo, { includeDocument });
          const inv = result?.invoice;
          const isRejected = inv?.status === 'rejected' || inv?.status === 'denied';
          const rejectionError = isRejected
            ? (inv?.brasilnfe_response as { Error?: string })?.Error || inv?.status_message || 'NF-e rejeitada pela SEFAZ. Verifique os dados do cliente e da loja.'
            : null;

          if (isRejected && rejectionError) {
            printWindow.close();
            setInvoiceError(rejectionError);
            return;
          }

          const reciboTipo = 'NF-e' as const;
          if (inv && !isRejected) {
            const reciboData = invoiceToNFCeData(inv);
            if (reciboData) {
              const html = buildReciboHtml(reciboData, reciboTipo);
              printWindow.document.open();
              printWindow.document.write(html);
              printWindow.document.close();
              printWindow.document.body?.offsetHeight;
              setTimeout(() => { printWindow.print(); printWindow.close(); onConfirm('nfe'); }, 500);
            } else {
              const printContent = nfceRef.current;
              const styles = `*{margin:0;padding:0} body{font-family:'Courier New',monospace;padding:12px;background:#fff;color:#000;min-height:100vh} @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
              const bodyHtml = printContent ? printContent.innerHTML : `<p>Nota rejeitada ou sem dados para recibo.</p>`;
              printWindow.document.open();
              printWindow.document.write(`<!DOCTYPE html><html><head><title>${docLabel}</title><style>${styles}</style></head><body>${bodyHtml}</body></html>`);
              printWindow.document.close();
              printWindow.document.body?.offsetHeight;
              setTimeout(() => { printWindow.print(); printWindow.close(); onConfirm('nfe'); }, 500);
            }
          } else {
            printWindow.close();
            setInvoiceError(rejectionError || 'Não foi possível gerar a NF-e.');
          }
        } catch (e) {
          printWindow.close();
          setInvoiceError((e as Error)?.message || `Erro ao emitir ${docLabel}. Verifique os dados e tente novamente.`);
        } finally {
          setInvoiceGenerating(false);
        }
      } else {
        printPreviewAndConfirm(selectedType);
      }
      return;
    }

    // Recibo: impressão em janela popup
    const printContent = receiptRef.current;
    if (!printContent) {
      onConfirm('receipt');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      alert('Não foi possível abrir a janela de impressão. Verifique se popups estão habilitados.');
      onConfirm('receipt');
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; color: black; line-height: 1.4; font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; max-width: 80mm; }
        @page { size: 80mm auto; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo OS ${receiptData.osNumber}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onConfirm('receipt');
      }, 250);
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {hasInvoice && (selectedType === 'nfe' || selectedType === 'nfce') ? 'Imprimir Documento' : 'Emitir Documento'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex gap-6 max-h-[calc(90vh-180px)] overflow-auto">
          {/* Opções */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <p className="text-sm font-medium text-slate-600 mb-4">
              Escolha o tipo de documento:
            </p>

            {/* Opção Recibo */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedType === 'receipt'
                  ? 'border-slate-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              style={selectedType === 'receipt' ? { 
                borderColor: 'var(--store-color)', 
                backgroundColor: 'var(--store-color-light)' 
              } : {}}
            >
              <input
                type="radio"
                name="docType"
                value="receipt"
                checked={selectedType === 'receipt'}
                onChange={() => setSelectedType('receipt')}
                className="sr-only"
              />
              <div 
                className={`p-3 rounded-xl ${
                  selectedType === 'receipt' ? 'text-white' : 'bg-slate-100 text-slate-500'
                }`}
                style={selectedType === 'receipt' ? { backgroundColor: 'var(--store-color)' } : {}}
              >
                <Receipt size={24} />
              </div>
              <div>
                <p 
                  className={`font-bold ${selectedType === 'receipt' ? '' : 'text-slate-700'}`}
                  style={selectedType === 'receipt' ? { color: 'var(--store-color-dark)' } : {}}
                >
                  Recibo
                </p>
                <p className="text-xs text-slate-500">
                  Imprimir recibo
                </p>
              </div>
            </label>

            {/* Opção NFC-e ocultada no front por decisão de negócio */}

            {/* Opção NF-e - quando já emitida: permite imprimir. Quando não emitida: só mostra se canGenerateInvoice */}
            {(hasInvoice || canGenerateInvoice) && (hasInvoice ? (
              <label
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedType === 'nfe' ? 'border-slate-200' : 'border-slate-200 hover:border-slate-300'
                }`}
                style={selectedType === 'nfe' ? { borderColor: 'var(--store-color)', backgroundColor: 'var(--store-color-light)' } : {}}
              >
                <input
                  type="radio"
                  name="docType"
                  value="nfe"
                  checked={selectedType === 'nfe'}
                  onChange={() => setSelectedType('nfe')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-xl ${selectedType === 'nfe' ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                  style={selectedType === 'nfe' ? { backgroundColor: 'var(--store-color)' } : {}}
                >
                  <FileText size={24} />
                </div>
                <div>
                  <p className={`font-bold ${selectedType === 'nfe' ? '' : 'text-slate-700'}`}
                    style={selectedType === 'nfe' ? { color: 'var(--store-color-dark)' } : {}}
                  >
                    NF-e
                  </p>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Nota já gerada
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Imprimir (não gera nova)</p>
                </div>
              </label>
            ) : (
              <label
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedType === 'nfe' ? 'border-slate-200' : 'border-slate-200 hover:border-slate-300'
                }`}
                style={selectedType === 'nfe' ? { borderColor: 'var(--store-color)', backgroundColor: 'var(--store-color-light)' } : {}}
              >
                <input
                  type="radio"
                  name="docType"
                  value="nfe"
                  checked={selectedType === 'nfe'}
                  onChange={() => setSelectedType('nfe')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-xl ${selectedType === 'nfe' ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                  style={selectedType === 'nfe' ? { backgroundColor: 'var(--store-color)' } : {}}
                >
                  <FileText size={24} />
                </div>
                <div>
                  <p className={`font-bold ${selectedType === 'nfe' ? '' : 'text-slate-700'}`}
                    style={selectedType === 'nfe' ? { color: 'var(--store-color-dark)' } : {}}
                  >
                    NF-e
                  </p>
                  <p className="text-xs text-slate-500">Gerar NF-e (nota completa)</p>
                </div>
              </label>
            ))}

            {/* Opção Nenhum */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedType === 'none'
                  ? 'border-slate-500 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="docType"
                value="none"
                checked={selectedType === 'none'}
                onChange={() => setSelectedType('none')}
                className="sr-only"
              />
              <div className={`p-3 rounded-xl ${
                selectedType === 'none' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <Ban size={24} />
              </div>
              <div>
                <p className={`font-bold ${selectedType === 'none' ? 'text-slate-700' : 'text-slate-700'}`}>
                  Nenhum
                </p>
                <p className="text-xs text-slate-500">
                  Salvar sem emitir
                </p>
              </div>
            </label>
          </div>

          {/* Preview do Documento */}
          <div className="flex-1 flex flex-col items-center">
            <p className="text-sm font-medium text-slate-600 mb-4">
              Pré-visualização:
            </p>
            {(selectedType === 'nfce' || selectedType === 'nfe') && onGenerateInvoice && !hasInvoice && (
              <div className="w-full mb-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="flex items-center gap-2 text-amber-900 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDocumentOnInvoice}
                      onChange={(e) => {
                        setIncludeDocumentOnInvoice(e.target.checked);
                        setAddCpfError(null);
                      }}
                    />
                    CPF na nota
                  </label>
                  {hasClientDocument && (
                    <span className="text-xs text-amber-800">
                      Documento do cliente: {formatCpfDisplay(clientDoc!)}
                    </span>
                  )}
                </div>
                {!hasClientDocument && includeDocumentOnInvoice && (
                  <>
                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                      <User size={18} />
                      Cliente sem CPF/CNPJ cadastrado
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      Adicione o documento para incluir na nota fiscal:
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="CPF ou CNPJ"
                        value={addCpfValue}
                        onChange={(e) => { setAddCpfValue(e.target.value); setAddCpfError(null); }}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-500"
                        maxLength={18}
                      />
                    </div>
                  </>
                )}
                {!includeDocumentOnInvoice && (
                  <p className="text-sm text-amber-700">
                    A nota será emitida como consumidor não identificado.
                  </p>
                )}
                {addCpfError && <p className="text-sm text-red-600 mt-2">{addCpfError}</p>}
              </div>
            )}
            {invoiceError && (selectedType === 'nfce' || selectedType === 'nfe') && (
              <div className="w-full mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm font-medium text-red-800">NF-e rejeitada:</p>
                <p className="text-sm text-red-700 mt-1">{invoiceError}</p>
                <p className="text-xs text-red-600 mt-2">Corrija os dados e tente novamente. A impressão não foi aberta.</p>
              </div>
            )}
            <div 
              className="bg-slate-100 p-6 rounded-2xl overflow-auto max-h-[500px]"
              style={{ 
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div className="shadow-lg">
                {(selectedType === 'nfce' || selectedType === 'nfe') ? (
                  <NFCePreview ref={nfceRef} data={nfceData} />
                ) : (
                  <ThermalReceipt ref={receiptRef} data={receiptData} />
                )}
              </div>
            </div>
            {(selectedType === 'nfce' || selectedType === 'nfe') && !onGenerateInvoice && (
              <p className="text-xs text-amber-600 mt-3 text-center">
                * Este é apenas um preview. Emissão fiscal será feita ao clicar em Imprimir.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || invoiceGenerating || addCpfSaving}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--store-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--store-color-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--store-color)'}
          >
            {loading ? (
              <>Salvando...</>
            ) : invoiceGenerating ? (
              <><Loader2 size={18} className="animate-spin" /> Gerando...</>
            ) : selectedType === 'none' ? (
              <>Salvar sem Documento</>
            ) : (
              <>
                <Printer size={18} />
                {selectedType === 'receipt' && 'Imprimir Recibo'}
                {selectedType === 'nfe' && (hasInvoice ? 'Imprimir NF-e' : 'Gerar NF-e')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
