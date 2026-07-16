import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, PackageX } from 'lucide-react';
import { Button, Input, Modal } from './Common';
import { ServiceOrder } from '../services/api/serviceOrders';
import { formatCurrency } from '../utils/formatters';

export interface ArchiveNotPickedUpOptions {
  uncollected_notes?: string;
  block_pickup_payment?: boolean;
}

interface ServiceOrderArchiveNotPickedUpModalProps {
  isOpen: boolean;
  order: ServiceOrder | null;
  processing: boolean;
  onClose: () => void;
  onConfirm: (options: ArchiveNotPickedUpOptions) => void | Promise<void>;
}

export const ServiceOrderArchiveNotPickedUpModal: React.FC<ServiceOrderArchiveNotPickedUpModalProps> = ({
  isOpen,
  order,
  processing,
  onClose,
  onConfirm,
}) => {
  const [blockPickupPayment, setBlockPickupPayment] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setBlockPickupPayment(true);
    setNotes('');
  }, [isOpen, order?.id]);

  const clientName = order?.client?.name || 'Cliente';
  const osLabel = order ? String(order.os_number).padStart(4, '0') : '';
  const totalPrice = Number(order?.price) || 0;
  const amountDue = Number((order as any)?.outstanding_pickup_amount ?? order?.price) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!processing) onClose();
      }}
      title="Registrar não retirada"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          OS <strong>#{osLabel}</strong> — <strong>{clientName}</strong>
        </p>

        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-semibold text-amber-900">O que vai acontecer</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>A OS <strong>sai de Inadimplências</strong> e das listagens operacionais do laboratório.</li>
                <li>O status muda para <strong>Não retirada</strong> — o valor da OS <strong>permanece</strong> no histórico.</li>
                <li>Será criado um <strong>alerta no histórico do cliente</strong> ({clientName}).</li>
              </ul>
              <p className="text-xs text-slate-600 pt-1">
                Total da OS: <strong>{formatCurrency(totalPrice)}</strong>
                {amountDue > 0 && amountDue !== totalPrice ? (
                  <> · Pendente na retirada: <strong>{formatCurrency(amountDue)}</strong></>
                ) : null}
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300"
              checked={blockPickupPayment}
              onChange={(e) => setBlockPickupPayment(e.target.checked)}
              disabled={processing}
            />
            <span className="text-sm text-slate-700">
              Bloquear <strong>pagamento na retirada</strong> para este cliente em novas OS
            </span>
          </label>

          <Input
            label="Observações (opcional)"
            placeholder="Ex.: Várias tentativas de contato sem retorno..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={processing}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="!bg-amber-600 hover:!bg-amber-700 !text-white border-0"
            disabled={processing}
            onClick={() =>
              void onConfirm({
                uncollected_notes: notes.trim() || undefined,
                block_pickup_payment: blockPickupPayment,
              })
            }
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processando...
              </>
            ) : (
              <>
                <PackageX size={16} /> Confirmar não retirada
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
