import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button, Modal } from './Common';
import { ServiceOrder } from '../services/api/serviceOrders';

interface ServiceOrderDeleteModalProps {
  isOpen: boolean;
  order: ServiceOrder | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const ServiceOrderDeleteModal: React.FC<ServiceOrderDeleteModalProps> = ({
  isOpen,
  order,
  deleting,
  onClose,
  onConfirm,
}) => {
  const osLabel = order ? String(order.os_number).padStart(4, '0') : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!deleting) onClose();
      }}
      title="Confirmar exclusão"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          Tem certeza que deseja excluir a OS <strong>#{osLabel}</strong>?
        </p>
        <p className="text-xs text-slate-500">
          Para cliente que não retirou o produto, prefira <strong>Registrar não retirada</strong> em Inadimplências —
          a OS permanece no histórico com o valor original.
        </p>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="!bg-red-600 hover:!bg-red-700 !text-white border-0"
            disabled={deleting}
            onClick={() => void onConfirm()}
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Excluir
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
