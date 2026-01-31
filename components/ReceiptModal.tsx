import React, { useRef, useState, useMemo } from 'react';
import { X, Printer, FileText, Receipt, Ban } from 'lucide-react';
import { ThermalReceipt, ReceiptData } from './ThermalReceipt';
import { NFCePreview, NFCeData } from './NFCePreview';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'receipt' | 'nfe' | 'none') => void;
  receiptData: ReceiptData;
  loading?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  receiptData,
  loading = false,
}) => {
  const [selectedType, setSelectedType] = useState<'receipt' | 'nfe' | 'none'>('receipt');
  const receiptRef = useRef<HTMLDivElement>(null);
  const nfceRef = useRef<HTMLDivElement>(null);

  // Converter ReceiptData para NFCeData
  const nfceData: NFCeData = useMemo(() => ({
    store: receiptData.store,
    client: receiptData.client.name ? {
      name: receiptData.client.name,
      document: receiptData.client.document,
    } : undefined,
    items: receiptData.items.map((item, index) => ({
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
  }), [receiptData]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (selectedType === 'none') {
      onConfirm('none');
      return;
    }

    if (selectedType === 'nfe') {
      // NF-e ainda não implementada
      alert('Emissão de NF-e ainda não disponível. Em breve!');
      return;
    }

    // Imprimir recibo
    const printContent = receiptRef.current;
    if (!printContent) {
      onConfirm('receipt');
      return;
    }

    // Criar janela de impressão
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      alert('Não foi possível abrir a janela de impressão. Verifique se popups estão habilitados.');
      onConfirm('receipt');
      return;
    }

    // Estilos para impressão térmica
    const styles = `
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.4;
          background: white;
          color: black;
          width: 80mm;
          max-width: 80mm;
        }
        @media print {
          body {
            width: 80mm;
            max-width: 80mm;
          }
        }
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

    // Aguardar carregamento e imprimir
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
          <h2 className="text-xl font-bold text-slate-900">Emitir Documento</h2>
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
                  Documento informal
                </p>
              </div>
            </label>

            {/* Opção NF-e (preview apenas) */}
            <label
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedType === 'nfe'
                  ? 'border-slate-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              style={selectedType === 'nfe' ? { 
                borderColor: 'var(--store-color)', 
                backgroundColor: 'var(--store-color-light)' 
              } : {}}
            >
              <input
                type="radio"
                name="docType"
                value="nfe"
                checked={selectedType === 'nfe'}
                onChange={() => setSelectedType('nfe')}
                className="sr-only"
              />
              <div 
                className={`p-3 rounded-xl ${
                  selectedType === 'nfe' ? 'text-white' : 'bg-slate-100 text-slate-500'
                }`}
                style={selectedType === 'nfe' ? { backgroundColor: 'var(--store-color)' } : {}}
              >
                <FileText size={24} />
              </div>
              <div>
                <p 
                  className={`font-bold ${selectedType === 'nfe' ? '' : 'text-slate-700'}`}
                  style={selectedType === 'nfe' ? { color: 'var(--store-color-dark)' } : {}}
                >
                  NFC-e
                </p>
                <p className="text-xs text-slate-500">
                  Preview (em breve)
                </p>
              </div>
            </label>

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
            <div 
              className="bg-slate-100 p-6 rounded-2xl overflow-auto max-h-[500px]"
              style={{ 
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div className="shadow-lg">
                {selectedType === 'nfe' ? (
                  <NFCePreview ref={nfceRef} data={nfceData} />
                ) : (
                  <ThermalReceipt ref={receiptRef} data={receiptData} />
                )}
              </div>
            </div>
            {selectedType === 'nfe' && (
              <p className="text-xs text-amber-600 mt-3 text-center">
                * Este é apenas um preview. A integração com a Brasil NFe será implementada em breve.
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
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--store-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--store-color-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--store-color)'}
          >
            {loading ? (
              <>Salvando...</>
            ) : selectedType === 'none' ? (
              <>Salvar sem Documento</>
            ) : (
              <>
                <Printer size={18} />
                {selectedType === 'receipt' ? 'Imprimir Recibo' : 'Emitir NF-e'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
