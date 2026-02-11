import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Button } from '../../components/Common';
import { ServiceOrderSheet } from '../../components/ServiceOrderSheet';
import { ReceiptStore } from '../../components/ThermalReceipt';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import { storesService } from '../../services/api/stores';
import { clientsService } from '../../services/api/clients';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { Store } from '../../services/api/stores';
import { useNotification } from '../../hooks/useNotification';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : (import.meta.env.VITE_API_URL || '').replace(/\/api(\/.*)?$/, '') || window.location.origin;
const buildLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
  if (logoPath.startsWith('/')) return `${API_BASE}${logoPath}`;
  // Path do storage (ex: stores/xxx.jpg) -> em dev usa relativo (proxy); em prod usa API_BASE
  const path = logoPath.startsWith('storage/') ? logoPath : `storage/${logoPath}`;
  return import.meta.env.DEV ? `/${path}` : `${API_BASE}/${path}`;
};

export const ServiceOrderSheetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [store, setStore] = useState<ReceiptStore | null>(null);
  const [clientPhone, setClientPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);

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

        const rawLogo = storeData?.logo ?? (orderData.store as any)?.logo ?? null;
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
          logo: buildLogoUrl(rawLogo) || null,
          color: storeData?.color ?? (orderData.store as any)?.color ?? '#dc2626',
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

  const formatOsNumber = (n: number): string => String(n).padStart(4, '0');

  const imageToDataUrl = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return url;
    }
  };

  const handlePrint = async () => {
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;
    const imgs = sheetEl.querySelectorAll('img[src^="http"]');
    const origSrcs: (string | null)[] = [];
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i] as HTMLImageElement;
      const src = img.getAttribute('src');
      if (src) {
        origSrcs[i] = src;
        const dataUrl = await imageToDataUrl(src);
        img.setAttribute('src', dataUrl);
      }
    }
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `OS-${formatOsNumber(order?.os_number ?? 0)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['tr', 'table', '.service-order-sheet > div'] },
    };
    await html2pdf().set(opt).from(sheetEl).save();
    imgs.forEach((img, i) => {
      if (origSrcs[i]) (img as HTMLImageElement).setAttribute('src', origSrcs[i]!);
    });
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
        <Button variant="outline" onClick={() => navigate('/service-orders')}>
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Barra de ações - oculta na impressão */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/service-orders')}>
          <ArrowLeft size={18} /> Voltar
        </Button>
        <Button onClick={handlePrint} style={{ backgroundColor: 'var(--store-color)' }}>
          <Printer size={18} /> Imprimir
        </Button>
      </div>

      {/* Conteúdo para impressão */}
      <div className="p-8 flex justify-center min-h-[calc(100vh-80px)] items-start">
        <ServiceOrderSheet ref={sheetRef} order={order} store={store} clientPhone={clientPhone} />
      </div>
    </div>
  );
};
