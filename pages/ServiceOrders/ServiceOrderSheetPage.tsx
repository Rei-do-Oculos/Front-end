import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/Common';
import { ServiceOrderSheet } from '../../components/ServiceOrderSheet';
import { ReceiptStore } from '../../components/ThermalReceipt';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import { storesService } from '../../services/api/stores';
import { clientsService } from '../../services/api/clients';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { Store } from '../../services/api/stores';
import { useNotification } from '../../hooks/useNotification';

export const ServiceOrderSheetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [store, setStore] = useState<ReceiptStore | null>(null);
  const [clientPhone, setClientPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const orderData = await serviceOrdersService.getById(id);
        setOrder(orderData);

        // Buscar loja completa
        const storeId = orderData.store_id;
        let storeData: Store | null = null;
        try {
          storeData = await storesService.getById(String(storeId));
        } catch {
          // Usar dados básicos do order.store como fallback
        }

        const receiptStore: ReceiptStore = {
          name: storeData?.name || orderData.store?.name || 'Loja',
          fancy_name: storeData?.fancy_name || storeData?.name || orderData.store?.name || 'Loja',
          cnpj: storeData?.cnpj || '00.000.000/0000-00',
          ie: storeData?.ie || null,
          logradouro: storeData?.logradouro || '',
          numero: storeData?.numero || '',
          bairro: storeData?.bairro || '',
          municipio: storeData?.municipio || '',
          uf: storeData?.uf || '',
          telefone: storeData?.telefone || null,
          unity: storeData?.unity ?? (orderData.store as any)?.unity ?? null,
          logo: storeData?.logo ?? (orderData.store as any)?.logo ?? null,
        };
        setStore(receiptStore);

        // Buscar telefone do cliente
        try {
          const client = await clientsService.getById(String(orderData.client_id));
          setClientPhone(client.phone || null);
        } catch {
          setClientPhone((orderData.client as any)?.phone || null);
        }
      } catch (err: any) {
        showError('Erro ao carregar OS', err.message || 'Ordem de serviço não encontrada');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, showError]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  if (!order || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-slate-600">Ordem de serviço não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Barra de ações - oculta na impressão */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Voltar
        </Button>
        <Button onClick={handlePrint} style={{ backgroundColor: 'var(--store-color)' }}>
          <Printer size={18} /> Imprimir
        </Button>
      </div>

      {/* Conteúdo para impressão */}
      <div className="p-6 flex justify-center">
        <ServiceOrderSheet order={order} store={store} clientPhone={clientPhone} />
      </div>
    </div>
  );
};
