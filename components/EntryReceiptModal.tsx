import React, { useRef } from 'react';
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
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
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
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                line-height: 1.4;
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
                }
              }
              @media screen {
                body {
                  max-width: 80mm;
                  margin: 0 auto;
                  border: 1px dashed #ccc;
                }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
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

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
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
            Dica: Na janela de impressão, selecione sua impressora térmica e configure o tamanho do papel para 80mm.
          </p>
          
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="bg-white border border-slate-200 rounded-lg shadow-sm p-4"
              style={{ maxHeight: '400px', overflow: 'auto' }}
            >
              <EntryReceipt ref={receiptRef} data={receiptData} />
            </div>
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
            Imprimir Comprovante
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryReceiptModal;
