import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThermalReceipt, ReceiptData } from '../../components/ThermalReceipt';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import { storesService } from '../../services/api/stores';
import { clientsService } from '../../services/api/clients';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { Store } from '../../services/api/stores';
import { useNotification } from '../../hooks/useNotification';

function prepareReceiptData(order: ServiceOrder, storeData: Store | null): ReceiptData {
  const store = order.store as any;
  const storeFromApi = storeData;
  const clientData = order.client;

  const totalPrice = typeof order.price === 'number' ? order.price : parseFloat(String(order.price)) || 0;

  const items: { description: string; quantity: number; price: number }[] = [];
  const orderFrames = Array.isArray(order.frames) ? order.frames : (order.frames && typeof order.frames === 'object' ? Object.values(order.frames) : []);

  if (orderFrames.length > 0) {
    const pricePerFrame = totalPrice / orderFrames.length;
    orderFrames.forEach((frame: any) => {
      items.push({
        description: frame.description || `Armação ${frame.code || ''}`,
        quantity: 1,
        price: pricePerFrame,
      });
    });
  } else {
    items.push({
      description: 'Serviço Óptico',
      quantity: 1,
      price: totalPrice,
    });
  }

  return {
    osNumber: order.os_number,
    date: new Date(order.created_at).toLocaleString('pt-BR'),
    expectedPickupDate: order.expected_pickup_date || null,
    seller: order.user?.name || 'Vendedor',
    store: {
      name: storeFromApi?.name || store?.name || 'Loja',
      fancy_name: storeFromApi?.fancy_name || storeFromApi?.name || store?.name || 'Loja',
      cnpj: storeFromApi?.cnpj || store?.cnpj || '00.000.000/0000-00',
      ie: storeFromApi?.ie ?? store?.ie ?? null,
      logradouro: storeFromApi?.logradouro || store?.logradouro || '',
      numero: storeFromApi?.numero || store?.numero || '',
      bairro: storeFromApi?.bairro || store?.bairro || '',
      municipio: storeFromApi?.municipio || store?.municipio || '',
      uf: storeFromApi?.uf || store?.uf || '',
      telefone: storeFromApi?.telefone ?? store?.telefone ?? null,
      unity: storeFromApi?.unity ?? store?.unity ?? null,
      logo: storeFromApi?.logo ?? store?.logo ?? null,
    },
    client: {
      name: clientData?.name || 'Cliente',
      document: clientData?.document || null,
    },
    items,
    total: totalPrice,
    paymentMethod: order.payments && order.payments.length > 0 ? null : (order.payment_method || null),
    installments: order.payments && order.payments.length > 0 ? null : (order.installments || null),
    payments: order.payments && order.payments.length > 0
      ? order.payments.map((p: any) => ({
          payment_method: p.payment_method,
          amount: p.amount,
          installments: p.installments || null,
        }))
      : undefined,
  };
}

export const ServiceOrderReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const shouldPrint = searchParams.get('print') === '1';
  const { showError } = useNotification();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const orderData = await serviceOrdersService.getById(id);
        setOrder(orderData);

        const storeId = orderData.store_id;
        try {
          const storeData = await storesService.getById(String(storeId));
          setStore(storeData);
        } catch {
          setStore(null);
        }
      } catch (err: any) {
        showError('Erro ao carregar OS', err.message || 'Ordem de serviço não encontrada');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, showError]);

  useEffect(() => {
    if (!shouldPrint || loading || !order || hasPrinted.current) return;

    const receiptEl = receiptRef.current;
    if (!receiptEl) return;

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      showError('Impressão', 'Não foi possível abrir a janela. Permita popups para imprimir.');
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
          <title>Recibo OS ${order.os_number}</title>
          ${styles}
        </head>
        <body>
          ${receiptEl.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        hasPrinted.current = true;
      }, 250);
    };
  }, [shouldPrint, loading, order, showError]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Ordem de serviço não encontrada.</p>
      </div>
    );
  }

  const receiptData = prepareReceiptData(order, store);

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-start p-4">
      <div ref={receiptRef}>
        <ThermalReceipt data={receiptData} />
      </div>
    </div>
  );
};
