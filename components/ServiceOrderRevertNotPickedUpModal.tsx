import React from 'react';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { Button, Modal } from './Common';
import { ServiceOrder } from '../services/api/serviceOrders';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  sent_to_lab: 'Enviado ao laboratório',
  ready_for_pickup: 'Aguardando retirada',
  overdue: 'Inadimplência',
};

interface ServiceOrderRevertNotPickedUpModalProps {
  isOpen: boolean;
  order: ServiceOrder | null;
  previousStatus?: string | null;
  processing: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const ServiceOrderRevertNotPickedUpModal: React.FC<ServiceOrderRevertNotPickedUpModalProps> = ({
  isOpen,
  order,
  previousStatus,
  processing,
  onClose,
  onConfirm,
}) => {
  const clientName = order?.client?.name || 'Cliente';
  const osLabel = order ? String(order.os_number).padStart(4, '0') : '';
  const restoreLabel = previousStatus ? (STATUS_LABELS[previousStatus] || previousStatus) : 'status anterior';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!processing) onClose();
      }}
      title="Reverter não retirada"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          OS <strong>#{osLabel}</strong> — <strong>{clientName}</strong>
        </p>

        <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-sky-900">O que vai acontecer</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>A OS volta para <strong>{restoreLabel}</strong>.</li>
                <li>O alerta e o saldo de não retirada saem do histórico do cliente.</li>
                {previousStatus === 'overdue' && (
                  <li>A OS <strong>volta para Inadimplências</strong> se ainda houver valor pendente na retirada.</li>
                )}
                <li>Se havia bloqueio de pagamento na retirada, ele será removido (salvo outras pendências abertas).</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={processing} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 !bg-sky-600 hover:!bg-sky-700"
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Revertendo...
              </>
            ) : (
              <>
                <RotateCcw size={16} /> Reverter não retirada
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
