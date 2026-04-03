import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { EntryReceipt, EntryReceiptData } from './EntryReceipt';

interface EntryReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (print: boolean) => void;
  receiptData: EntryReceiptData;
  loading?: boolean;
}

export const EntryReceiptModal: React.FC<EntryReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  receiptData,
  loading = false,
}) => {
  const receiptFirstRef = useRef<HTMLDivElement>(null);
  const receiptSecondRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const elFirst = receiptFirstRef.current;
    const elSecond = receiptSecondRef.current;
    if (elFirst && elSecond) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlFirst = elFirst.innerHTML;
        const htmlSecond = elSecond.innerHTML;
        const copiesHtml = `
            <section class="receipt-copy">${htmlFirst}</section>
            <div class="copy-separator"></div>
            <section class="receipt-copy">${htmlSecond}</section>
          `;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Comprovante de Entrada - OS ${receiptData.osNumber}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0mm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                width: 80mm;
                margin: 0;
                padding: 0;
                font-family: 'Arial Black', Arial, 'Helvetica Neue', sans-serif;
                font-size: 13px;
                line-height: 1.4;
                color: #000;
                font-weight: 800;
                letter-spacing: 0.15px;
              }
              body {
                padding: 2mm;
              }
              @media print {
                html, body {
                  width: 80mm;
                }
                body { 
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  text-rendering: geometricPrecision;
                }
                .receipt-copy {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
                .copy-separator {
                  border-top: 1px dashed #000;
                  margin: 6mm 0;
                }
              }
              @media screen {
                body {
                  max-width: 80mm;
                  margin: 0 auto;
                  border: 1px dashed #ccc;
                }
                .copy-separator {
                  border-top: 1px dashed #666;
                  margin: 6mm 0;
                }
              }
            </style>
          </head>
          <body>
            ${copiesHtml}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
    onConfirm(true);
  };

  const handleSkip = () => {
    onConfirm(false);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">Comprovante de Entrada</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <p className="text-sm text-slate-600 mb-2">
            Deseja imprimir o comprovante de entrada para o cliente?
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Serão impressas 2 vias: a primeira inclui receita e medidas preenchidas na OS; a segunda, só resumo para assinatura. Use impressora térmica 80mm.
          </p>
          
          {/* Preview = 1ª via (com receita, se houver) */}
          <div className="flex justify-center">
            <div 
              className="bg-white border border-slate-200 rounded-lg shadow-sm p-4"
              style={{ maxHeight: '400px', overflow: 'auto' }}
            >
              <EntryReceipt ref={receiptFirstRef} data={receiptData} includePrescriptionDetails />
            </div>
          </div>
          {/* 2ª via invisível — mesmo layout, sem bloco de receita (innerHTML na impressão) */}
          <div
            aria-hidden
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: '80mm',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          >
            <EntryReceipt
              ref={receiptSecondRef}
              data={receiptData}
              includePrescriptionDetails={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--store-color)' }}
          >
            <Printer size={18} />
            Imprimir 2 Vias
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};

export default EntryReceiptModal;
