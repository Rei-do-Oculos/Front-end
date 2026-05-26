
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  UserPlus, 
  Trash2, 
  Plus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  Package,
  X,
  Receipt,
  FileText,
  Ban,
  User,
  XCircle,
  ArrowLeft,
  Home,
  Clock,
  Calendar,
  Loader2,
  ChevronDown,
  LogOut,
  Store,
  SplitSquareVertical,
  Printer,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/Common';
import { PhoneInput, validateInternationalPhone } from '../../components/PhoneInput';
import { useNotification } from '../../hooks/useNotification';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../services/hooks/useAuth';
import { framesService, Frame } from '../../services/api/frames';
import { clientsService, Client } from '../../services/api/clients';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import { invoicesService } from '../../services/api/invoices';
import { storesService, type Store as FullStore } from '../../services/api/stores';
import { ReceiptData, ThermalReceipt } from '../../components/ThermalReceipt';
import { invoiceToNFCeData, buildReciboHtml } from '../../utils/nfceCupom';

interface CartItem {
  id: number;
  description: string;
  code: string;
}

type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'permuta' | 'parcial';

type PartialPaymentRow = {
  id: number;
  method: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'permuta';
  amountRaw: string;
  installments: number;
};

const paymentMethodLabel = (m: PartialPaymentRow['method']): string => {
  switch (m) {
    case 'credit_card':
      return 'Cartão crédito';
    case 'debit_card':
      return 'Cartão débito';
    case 'pix':
      return 'PIX';
    case 'permuta':
      return 'Permuta';
    default:
      return 'Dinheiro';
  }
};

const CONSUMIDOR_FINAL_DOCUMENT = '00000000000';
const CONSUMIDOR_FINAL_PHONE = '0000000000';

const formatCurrencyInput = (raw: string): string => {
  const nums = raw.replace(/\D/g, '');
  if (nums.length === 0) return '';
  const intPart = (nums.slice(0, -2) || '0').replace(/^0+/, '') || '0';
  const decPart = nums.slice(-2).padStart(2, '0');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted},${decPart}`;
};
const parseCurrencyFormatted = (formatted: string): number => {
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const POS: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const { selectedStore, availableStores, setSelectedStore, storeColor, storeDisplayName, storeUnity, storeCnpj } = useStore();
  const { user, logout } = useAuth();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) setStoreDropdownOpen(false);
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isWarrantySale, setIsWarrantySale] = useState(false);
  const [installments, setInstallments] = useState<number>(1);
  const [partialPayments, setPartialPayments] = useState<PartialPaymentRow[]>([]);
  const [partialPaymentsId, setPartialPaymentsId] = useState(0);
  const [totalValueRaw, setTotalValueRaw] = useState<string>('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [visibleProducts, setVisibleProducts] = useState(20);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [createdOsId, setCreatedOsId] = useState<number | null>(null);
  const [createdOsNumber, setCreatedOsNumber] = useState<number | null>(null);
  const [receiptDataForModal, setReceiptDataForModal] = useState<ReceiptData | null>(null);
  const [showReceiptPrintModal, setShowReceiptPrintModal] = useState(false);
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [fullStoreData, setFullStoreData] = useState<FullStore | null>(null);

  // Frames e clientes da API
  const [frames, setFrames] = useState<Frame[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulário de cliente rápido
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickPhoneCountryIso, setQuickPhoneCountryIso] = useState('BR');
  const [quickDocument, setQuickDocument] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  // Buscar armações da loja — `search` na API cobre código e descrição (evita só 100 itens em memória)
  const fetchFrames = useCallback(
    async (searchTerm?: string) => {
      if (!selectedStore?.id) return;
      setFramesLoading(true);
      try {
        const { data } = await framesService.getAll({
          page: 1,
          per_page: 100,
          store_id: selectedStore.id,
          order_by: 'description',
          order_dir: 'asc',
          ...(searchTerm?.trim() ? { search: searchTerm.trim() } : {}),
        });
        setFrames(data);
      } catch (err) {
        console.error('[POS] Erro ao carregar armações:', err);
        showError('Erro', 'Não foi possível carregar as armações.');
        setFrames([]);
      } finally {
        setFramesLoading(false);
      }
    },
    [selectedStore?.id, showError]
  );

  useEffect(() => {
    if (!selectedStore?.id) return;
    const trimmed = search.trim();
    const delay = trimmed ? 300 : 0;
    const t = setTimeout(() => {
      fetchFrames(trimmed || undefined);
    }, delay);
    return () => clearTimeout(t);
  }, [selectedStore?.id, search, fetchFrames]);

  useEffect(() => {
    setVisibleProducts(20);
  }, [search, selectedStore?.id]);

  // Buscar dados completos da loja para recibo (endereço, CNPJ, IE, telefone etc.)
  useEffect(() => {
    let active = true;
    const fetchStoreDetails = async () => {
      if (!selectedStore?.id) {
        if (active) setFullStoreData(null);
        return;
      }
      try {
        const store = await storesService.getById(String(selectedStore.id));
        if (active) setFullStoreData(store);
      } catch {
        if (active) setFullStoreData(null);
      }
    };
    fetchStoreDetails();
    return () => {
      active = false;
    };
  }, [selectedStore?.id]);

  // Buscar clientes (debounced)
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) {
      setClients([]);
      return;
    }
    const timer = setTimeout(async () => {
      setClientsLoading(true);
      try {
        const { data } = await clientsService.getAll({
          page: 1,
          per_page: 20,
          search: clientSearch,
          stores: selectedStore?.id ? [selectedStore.id] : undefined,
        });
        setClients(data);
      } catch (err) {
        console.error('[POS] Erro ao buscar clientes:', err);
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, selectedStore?.id]);

  // Atualizar data e hora
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' });
      setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayFrames = frames.slice(0, visibleProducts);
  const cartFrameIds = useMemo(() => new Set(cart.map(c => c.id)), [cart]);

  const addToCart = (frame: Frame) => {
    if (cart.some(item => item.id === frame.id)) {
      showInfo(
        'Armação já nas compras',
        'Cada armação é uma peça única. Para vender outra igual, cadastre outro registro de armação.'
      );
      return;
    }
    setCart([
      ...cart,
      { id: frame.id, description: frame.description || '', code: frame.code || '' },
    ]);
  };

  const removeFromCart = (id: number) => setCart(cart.filter(item => item.id !== id));

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setClientModalOpen(false);
  };

  const removeClient = () => setSelectedClient(null);

  // Obter ou criar Consumidor Final
  const getOrCreateConsumidorFinal = async (): Promise<Client> => {
    const storeId = selectedStore?.id;
    if (!storeId) throw new Error('Loja não selecionada');

    const { data: existingClients } = await clientsService.getAll({
      page: 1,
      per_page: 1,
      document: CONSUMIDOR_FINAL_DOCUMENT,
      stores: [storeId],
    });
    if (existingClients.length > 0) return existingClients[0];

    const created = await clientsService.create({
      name: 'Consumidor Final',
      document: CONSUMIDOR_FINAL_DOCUMENT,
      phone: CONSUMIDOR_FINAL_PHONE,
      stores: [storeId],
    });
    return created;
  };

  const handleCreateQuickClient = async () => {
    if (!quickName.trim() || !quickDocument.trim() || !quickPhone.trim()) {
      showError('Campos obrigatórios', 'Preencha nome, CPF e telefone.');
      return;
    }
    if (!validateInternationalPhone(quickPhone, quickPhoneCountryIso)) {
      showError('Validação', 'Informe um telefone válido para o país selecionado.');
      return;
    }
    if (!selectedStore?.id) {
      showError('Erro', 'Selecione uma loja.');
      return;
    }
    setCreatingClient(true);
    try {
      const client = await clientsService.create({
        name: quickName.trim(),
        document: quickDocument.replace(/\D/g, ''),
        phone: quickPhone.replace(/\D/g, ''),
        ...(quickEmail.trim() && { email: quickEmail.trim() }),
        stores: [selectedStore.id],
      });
      setSelectedClient(client);
      setClientSearch('');
      setQuickName('');
      setQuickPhone('');
      setQuickDocument('');
      setQuickEmail('');
      setCreateClientModalOpen(false);
      showSuccess('Cliente criado', `${client.name} cadastrado com sucesso.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao criar cliente';
      showError('Erro', msg);
    } finally {
      setCreatingClient(false);
    }
  };

  const prepareReceiptData = (osNumber: number, storeDataOverride?: FullStore | null): ReceiptData => {
    const storeData = storeDataOverride ?? fullStoreData;
    const totalPrice = parseCurrencyFormatted(formatCurrencyInput(totalValueRaw)) || 0;
    const n = Math.max(1, cart.length);
    const pricePerFrame = totalPrice / n;
    const items = cart.map(i => ({
      description: i.description,
      quantity: 1,
      price: pricePerFrame,
    }));
    const isPartial = !isWarrantySale && paymentMethod === 'parcial';
    return {
      osNumber,
      date: new Date().toLocaleString('pt-BR'),
      expectedPickupDate: null,
      seller: user?.name || 'Vendedor',
      store: {
        name: storeData?.name ?? selectedStore?.name ?? 'Loja',
        fancy_name: storeData?.fancy_name ?? storeDisplayName ?? selectedStore?.fancy_name ?? selectedStore?.name ?? 'Loja',
        receipt_header: storeData?.receipt_header ?? selectedStore?.receipt_header ?? null,
        cnpj: storeData?.cnpj ?? storeCnpj ?? selectedStore?.cnpj ?? '00.000.000/0000-00',
        ie: storeData?.ie ?? null,
        logradouro: storeData?.logradouro ?? '',
        numero: storeData?.numero ?? '',
        bairro: storeData?.bairro ?? '',
        municipio: storeData?.municipio ?? '',
        uf: storeData?.uf ?? '',
        telefone: storeData?.telefone ?? null,
        unity: storeData?.unity ?? storeUnity ?? selectedStore?.unity ?? null,
        logo: storeData?.logo ?? selectedStore?.logo ?? null,
        color: storeData?.color ?? selectedStore?.color ?? null,
      },
      client: selectedClient
        ? { name: selectedClient.name, document: selectedClient.document ?? null }
        : { name: 'Consumidor Final', document: null },
      items,
      total: totalPrice,
      paymentMethod: isWarrantySale ? null : (isPartial ? null : (paymentMethod ?? null)),
      installments: isWarrantySale ? null : (isPartial ? null : paymentMethod === 'credit_card' ? installments : null),
      payments: isPartial && partialPayments.length > 0
        ? partialPayments
            .filter(p => (parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0) > 0)
              .map(p => ({
                payment_method: p.method,
                amount: parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0,
                ...(p.method === 'credit_card' ? { installments: p.installments } : {}),
              }))
        : undefined,
    };
  };

  const handleFinishSale = () => {
    if (cart.length === 0) {
      showError('Compras vazio', 'Adicione armações a compras antes de finalizar.');
      return;
    }
    if (!isWarrantySale && !paymentMethod) {
      showError('Forma de pagamento', 'Selecione uma forma de pagamento.');
      return;
    }
    if (!selectedStore?.id || !user?.id) {
      showError('Erro', 'Sessão inválida. Faça login novamente.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSale = async () => {
    setSubmitting(true);
    try {
      const storeId = selectedStore!.id;
      const userId = user!.id;
      let clientId = selectedClient?.id;

      if (!clientId) {
        const consumidor = await getOrCreateConsumidorFinal();
        clientId = consumidor.id;
      }

      const price = parseCurrencyFormatted(formatCurrencyInput(totalValueRaw)) || 0;
      const isPartial = !isWarrantySale && paymentMethod === 'parcial';
      const paymentMethodApi = isWarrantySale ? null : (isPartial ? (partialPayments[0]?.method ?? 'cash') : (paymentMethod || 'cash'));
      const paymentsPayload = !isWarrantySale && price > 0
        ? isPartial
          ? partialPayments
              .filter(p => (parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0) > 0)
              .map(p => ({
                payment_method: p.method,
                amount: parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0,
                ...(p.method === 'credit_card' && { installments: p.installments }),
              }))
          : [{
              payment_method: paymentMethodApi,
              amount: price,
              ...(paymentMethodApi === 'credit_card' && { installments }),
            }]
        : undefined;

      const payload = {
        client_id: clientId,
        store_id: storeId,
        user_id: userId,
        laboratory_id: null,
        frames: [...new Set(cart.map(item => item.id))],
        price: isWarrantySale ? 0 : price,
        payment_method: paymentMethodApi,
        payments: paymentsPayload,
        warranty: isWarrantySale ? 1 : null,
      };

      const created = await serviceOrdersService.create(payload as any);

      // Garante dados completos da loja no recibo, sem depender do carregamento assíncrono prévio.
      let storeForReceipt: FullStore | null = fullStoreData;
      if (!storeForReceipt && selectedStore?.id) {
        try {
          storeForReceipt = await storesService.getById(String(selectedStore.id));
          setFullStoreData(storeForReceipt);
        } catch {
          storeForReceipt = null;
        }
      }

      setCreatedOsId(created.id);
      setCreatedOsNumber(created.os_number);
      setReceiptDataForModal(prepareReceiptData(created.os_number, storeForReceipt));
      setShowConfirmModal(false);
      setShowFinishModal(true);
      showSuccess('OS criada!', `Ordem de Serviço #${created.os_number} gerada com sucesso.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao criar OS';
      showError('Erro', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectNfePrint = async (): Promise<boolean> => {
    if (!createdOsId) return false;
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) {
      showError('Popup bloqueado', 'Permita popups para imprimir a NF-e.');
      return false;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>NF-e</title></head><body style="font-family:Arial;padding:24px;text-align:center;"><p>Gerando NF-e...</p></body></html>`);
    printWindow.document.close();

    try {
      const result = await handleGenerateInvoice(55, { includeDocument: false });
      if (!result?.invoice) {
        printWindow.close();
        showError('Erro ao emitir nota', 'Não foi possível gerar a NF-e.');
        return false;
      }

      const inv = result.invoice;
      const isRejected = inv.status === 'rejected' || inv.status === 'denied';
      const rejectionError = isRejected
        ? (inv.brasilnfe_response as { Error?: string })?.Error || inv.status_message || 'NF-e rejeitada pela SEFAZ.'
        : null;

      if (isRejected && rejectionError) {
        printWindow.close();
        showError('NF-e rejeitada', rejectionError);
        return false;
      }

      // Recarrega a nota para garantir campos completos (access_key/qr_code_url) no recibo.
      let invoiceForPrint = inv;
      if (invoiceForPrint?.id) {
        try {
          const fullInvoice = await invoicesService.getById(String(invoiceForPrint.id));
          invoiceForPrint = {
            ...invoiceForPrint,
            ...fullInvoice,
          };
        } catch {
          // Se falhar o reload, mantém os dados já retornados pela geração.
        }
      }

      const reciboData = invoiceToNFCeData(invoiceForPrint);
      if (reciboData) {
        const html = buildReciboHtml(reciboData, 'NF-e');
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.document.body?.offsetHeight;
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 400);
        return true;
      }

      printWindow.close();
      showError('Erro ao imprimir', 'NF-e gerada, mas sem dados de impressão.');
      return false;
    } catch {
      printWindow.close();
      return false;
    }
  };

  const handlePrintReceiptFromModal = () => {
    const receiptEl = receiptPrintRef.current;
    if (!receiptEl || !receiptDataForModal) return;
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      showError('Impressão', 'Permita popups para imprimir o recibo.');
      return;
    }
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: white;
          color: #000;
          line-height: 1.4;
          font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
          font-weight: 800;
          font-size: 12px;
          width: 80mm;
          max-width: 80mm;
        }
        @page { size: 80mm auto; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    `;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo OS ${receiptDataForModal.osNumber}</title>
          ${styles}
        </head>
        <body>${receiptEl.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const handleFinishPrint = async (choice: 'receipt' | 'nfce' | 'nfe' | 'none') => {
    if (choice === 'receipt' && receiptDataForModal) {
      setShowReceiptPrintModal(true);
      return;
    }
    if (choice === 'nfe') {
      const ok = await handleDirectNfePrint();
      if (ok) resetSale();
      return;
    }
    resetSale();
  };

  const handleGenerateInvoice = async (modelo: 55 | 65, options?: { includeDocument?: boolean }) => {
    if (!createdOsId) return null;
    try {
      const inv = await invoicesService.generateFromServiceOrder(
        String(createdOsId),
        true,
        modelo,
        undefined,
        options?.includeDocument ?? false
      );
      return { pdfBase64: inv.pdf_base64 ?? undefined, invoice: inv };
    } catch (e: any) {
      showError('Erro ao emitir nota', e?.message || 'Tente novamente.');
      return null;
    }
  };

  const resetSale = () => {
    setCart([]);
    setSelectedClient(null);
    setPaymentMethod(null);
    setIsWarrantySale(false);
    setInstallments(1);
    setPartialPayments([]);
    setTotalValueRaw('');
    setShowFinishModal(false);
    setShowConfirmModal(false);
    setShowReceiptPrintModal(false);
    setCreatedOsId(null);
    setCreatedOsNumber(null);
    setReceiptDataForModal(null);
  };

  const storeColorCss = storeColor || '#dc2626';

  // Sem loja selecionada
  if (!selectedStore) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6">
        <Package size={64} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Selecione uma loja</h2>
        <p className="text-slate-500 text-center">Use o seletor de loja no cabeçalho para continuar.</p>
      </div>
    );
  }

  // View: Produtos + Carrinho
  return (
    <div className="h-screen min-h-0 flex flex-col bg-white animate-in fade-in duration-500 overflow-hidden">
      <header
        className="relative min-h-14 md:min-h-20 shrink-0 flex flex-col md:flex-row items-center justify-between px-3 sm:px-4 md:px-8 py-2 md:py-0 shadow-lg gap-2 md:gap-0"
        style={{ backgroundColor: storeColorCss }}
      >
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/20 rounded-lg md:rounded-xl border border-white/30">
              <span className="text-white font-black text-base md:text-xl tracking-wider">PDV</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-2 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg md:rounded-xl text-white font-bold text-sm md:text-base transition-all flex items-center gap-1 md:gap-2"
            >
              <Home size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
        {/* Centro: CNPJ - visível em md+ */}
        {storeCnpj && (
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none">
            <span className="text-sm md:text-base font-bold text-white drop-shadow-sm">CNPJ: {storeCnpj}</span>
          </div>
        )}
        {/* Direita: Loja → Data/Hora → Usuário */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {availableStores.length > 1 ? (
            <div className="relative" ref={storeDropdownRef}>
              <button
                onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                className="px-2 md:px-3 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-bold text-sm flex items-center gap-1.5"
              >
                <Store size={16} className="text-white shrink-0" />
                <span className="max-w-[80px] truncate hidden sm:inline">{storeUnity || storeDisplayName || 'Loja'}</span>
                <ChevronDown size={12} className={`transition-transform ${storeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {storeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2">
                    {availableStores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => {
                          setSelectedStore(store);
                          setStoreDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm ${
                          selectedStore?.id === store.id ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <Store size={18} className="text-slate-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{store.name}</p>
                          {store.fancy_name && (
                            <p className="text-[10px] text-slate-500 truncate">{store.fancy_name}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : availableStores.length === 1 && selectedStore ? (
            <div className="px-2 py-1.5 bg-white/20 border border-white/30 rounded-lg flex items-center gap-1.5">
              <Store size={16} className="text-white shrink-0" />
              <span className="text-sm font-bold text-white max-w-[120px] truncate hidden sm:inline">{storeUnity || storeDisplayName || selectedStore.fancy_name}</span>
            </div>
          ) : null}
          {/* Data/Hora (depois da loja) - compacto no mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base text-white font-bold tabular-nums">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-white shrink-0" />
              <span className="font-black tracking-tight">{currentDate}</span>
            </div>
            <div className="w-px h-5 bg-white/40" />
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-white shrink-0" />
              <span className="font-black tracking-tight">{currentTime}</span>
            </div>
          </div>
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="p-1.5 md:p-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white flex items-center gap-1"
            >
              <User size={16} />
              <ChevronDown size={12} className={`hidden sm:block transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setUserDropdownOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <User size={16} /> Meu perfil
                  </button>
                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await logout();
                      window.location.href = '/login';
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="flex-1 min-h-0 flex flex-col gap-3 md:gap-4 overflow-hidden min-w-0 lg:min-h-0">
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
            <input
              type="text"
              placeholder="Pesquisar armação por nome ou código..."
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-xl text-base sm:text-lg font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-semibold focus:ring-4 focus:ring-[var(--store-color-opacity-20)] transition-all outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {framesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin" style={{ color: storeColorCss }} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden p-3 sm:p-4 pr-3 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 content-start">
                  {displayFrames.map(frame => {
                    const inCart = cartFrameIds.has(frame.id);
                    return (
                    <div key={frame.id} className="min-w-0">
                      <div
                        onClick={() => addToCart(frame)}
                        className={`p-2.5 sm:p-3 rounded-lg transition-all cursor-pointer group flex flex-col min-h-0 border-2 ${
                          inCart
                            ? 'bg-emerald-50/50 border-[var(--store-color)] shadow-sm'
                            : 'bg-white border-slate-100 hover:border-[var(--store-color)] hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-1.5 mb-2">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${storeColorCss}20`, color: storeColorCss }}
                          >
                            <Package size={14} />
                          </div>
                          {frame.frameType?.name && (
                            <Badge variant="info" className="text-[10px] px-1.5 py-0.5 font-black shrink-0 leading-tight">
                              {frame.frameType.name}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-[15px] font-black text-slate-900 group-hover:text-[var(--store-color)] transition-colors line-clamp-2 leading-snug mb-1 min-h-[2.5em]">
                          {frame.description || 'Sem nome'}
                        </h3>
                        {frame.code && (
                          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">Cód: {frame.code}</p>
                        )}
                        <div className="mt-auto flex justify-between items-center gap-2">
                          {inCart && (
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-emerald-800">
                              Nas compras
                            </span>
                          )}
                          <div className="p-2 rounded-md shadow-sm ml-auto" style={{ backgroundColor: storeColorCss }}>
                            <Plus size={14} className="text-white" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!framesLoading && frames.length > visibleProducts && (
              <div className="pt-4 pb-4 border-t border-slate-100 mt-4 shrink-0">
                <button
                  onClick={() => setVisibleProducts(p => Math.min(p + 20, frames.length))}
                  className="w-full py-3.5 text-base text-white font-black rounded-lg transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: storeColorCss }}
                >
                  Ver Mais <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col gap-3 md:gap-4 shrink-0 order-first lg:order-last">
          <Card className="flex flex-col p-0 border-2 border-slate-100 w-full">
            <div
              className="p-3 md:p-4 border-b border-slate-50 flex items-center justify-between shrink-0"
              style={{ backgroundColor: `${storeColorCss}08` }}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg text-white" style={{ backgroundColor: storeColorCss }}>
                  <ShoppingCart size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Compras</h2>
              </div>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-black text-white"
                style={{ backgroundColor: storeColorCss }}
              >
                {cart.length} ARMAÇÕES
              </span>
            </div>
            <div className="flex flex-col">
              <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center text-slate-500 py-6">
                    <ShoppingCart size={40} className="mb-2 text-slate-400" strokeWidth={2} />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-700">Compras vazio</p>
                    <p className="text-xs font-semibold mt-1 text-slate-600">Clique nas armações para adicionar</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{item.description}</p>
                        <p className="text-xs text-slate-600 font-bold mt-0.5">Cód: {item.code}</p>
                      </div>
                      <button
                        type="button"
                        title="Remover das compras"
                        onClick={() => removeFromCart(item.id)}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 md:p-4 bg-slate-50 border-t border-slate-100 space-y-2.5 md:space-y-3 shrink-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wide">
                  <span>Cliente</span>
                  {!selectedClient && (
                    <button onClick={() => setClientModalOpen(true)} className="flex items-center gap-1.5 text-xs font-black hover:underline normal-case" style={{ color: storeColorCss }}>
                      <UserPlus size={14} strokeWidth={2.5} /> Buscar
                    </button>
                  )}
                </div>
                {selectedClient ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-emerald-900 truncate">{selectedClient.name}</p>
                      <p className="text-xs font-bold text-emerald-700 truncate">{selectedClient.document}</p>
                    </div>
                    <button onClick={removeClient} className="text-emerald-600 hover:text-red-600 shrink-0 ml-2">
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
                    Consumidor Final (Venda Avulsa)
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide">Valor Total (R$)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isWarrantySale;
                      setIsWarrantySale(next);
                      if (next) {
                        setPaymentMethod(null);
                        setInstallments(1);
                        setPartialPayments([]);
                        setTotalValueRaw('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border transition-all ${
                      isWarrantySale
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    title="Ative para gerar OS de garantia no PDV sem valor e sem pagamento"
                  >
                    {isWarrantySale ? 'Garantia ativa' : 'Marcar garantia'}
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={isWarrantySale ? 'Dispensado em garantia' : '0,00'}
                  value={totalValueRaw === '' ? '' : formatCurrencyInput(totalValueRaw)}
                  onChange={e => setTotalValueRaw(e.target.value.replace(/\D/g, ''))}
                  className="!px-3 !py-3 !text-base !font-semibold lg:!text-lg"
                  disabled={isWarrantySale}
                />
              </div>
              <div className="space-y-1 pt-2 border-t border-slate-200">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Forma de pagamento</p>
                {isWarrantySale ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
                    OS de garantia: forma de pagamento não é obrigatória no PDV.
                  </div>
                ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: 'credit_card' as const, icon: CreditCard, lines: ['Crédito'] as const },
                      { key: 'debit_card' as const, icon: Wallet, lines: ['Débito'] as const },
                      { key: 'pix' as const, icon: QrCode, lines: ['PIX'] as const },
                      { key: 'cash' as const, icon: Banknote, lines: ['Dinheiro'] as const },
                      { key: 'permuta' as const, icon: RefreshCw, lines: ['Permuta'] as const },
                      { key: 'parcial' as const, icon: SplitSquareVertical, lines: ['Pagamento', 'parcial'] as const },
                    ] as const
                  ).map(({ key, icon: Icon, lines }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(key);
                        if (key === 'parcial' && partialPayments.length === 0) {
                          setPartialPayments([{ id: partialPaymentsId, method: 'credit_card', amountRaw: '', installments: 1 }]);
                          setPartialPaymentsId(p => p + 1);
                        }
                      }}
                      title={
                        key === 'parcial'
                          ? 'Múltiplas formas (parcelas só no crédito)'
                          : lines.join(' ')
                      }
                      className={`flex flex-row items-center justify-start gap-2 py-2.5 px-2.5 rounded-xl border transition-all text-left min-h-[3rem] shadow-sm ${
                        paymentMethod === key ? 'text-white border-transparent' : 'bg-white border-slate-200 hover:border-[var(--store-color)]'
                      }`}
                      style={paymentMethod === key ? { backgroundColor: storeColorCss } : {}}
                    >
                      <Icon size={18} className="shrink-0" strokeWidth={2.25} />
                      <span className="text-xs font-black leading-tight min-w-0 flex-1">
                        {lines.map((line, i) => (
                          <span
                            key={line}
                            className={i === 0 ? 'block' : 'block text-[11px] font-bold opacity-95 leading-tight'}
                          >
                            {line}
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
                )}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-0.5">
                    <label className="text-xs font-black text-slate-700">Parcelas</label>
                    <select
                      value={installments}
                      onChange={e => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[var(--store-color)] focus:border-[var(--store-color)] outline-none transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                )}
                {paymentMethod === 'parcial' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-700">Pagamentos parciais</label>
                      <button
                        type="button"
                        onClick={() => {
                          setPartialPayments(p => [...p, { id: partialPaymentsId, method: 'credit_card', amountRaw: '', installments: 1 }]);
                          setPartialPaymentsId(i => i + 1);
                        }}
                        className="text-xs font-black flex items-center gap-1 hover:underline"
                        style={{ color: storeColorCss }}
                        title="Adicionar forma de pagamento"
                      >
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {partialPayments.map((row, idx) => (
                        <div key={row.id} className="flex gap-2 items-center p-2 bg-white rounded-lg border border-slate-200">
                          <select
                            value={row.method}
                            onChange={e =>
                              setPartialPayments(prev =>
                                prev.map(r =>
                                  r.id === row.id
                                    ? {
                                        ...r,
                                        method: e.target.value as PartialPaymentRow['method'],
                                        installments: e.target.value === 'credit_card' ? r.installments : 1,
                                      }
                                    : r
                                )
                              )
                            }
                            className="flex-1 min-w-0 px-2 py-2 text-sm font-bold border-0 rounded bg-slate-50 focus:ring-2 focus:ring-[var(--store-color)]"
                            title={paymentMethodLabel(row.method)}
                          >
                            <option value="credit_card">Cartão crédito</option>
                            <option value="debit_card">Cartão débito</option>
                            <option value="pix">PIX</option>
                            <option value="cash">Dinheiro</option>
                            <option value="permuta">Permuta</option>
                          </select>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Valor"
                            value={row.amountRaw === '' ? '' : formatCurrencyInput(row.amountRaw)}
                            onChange={e => setPartialPayments(prev => prev.map(r => r.id === row.id ? { ...r, amountRaw: e.target.value.replace(/\D/g, '') } : r))}
                            className="w-24 px-2 py-2 text-sm font-semibold border rounded bg-slate-50 focus:ring-2 focus:ring-[var(--store-color)]"
                          />
                          {row.method === 'credit_card' && (
                            <select
                              value={row.installments}
                              onChange={e => setPartialPayments(prev => prev.map(r => r.id === row.id ? { ...r, installments: Number(e.target.value) } : r))}
                              className="w-14 px-1 py-2 text-sm font-bold border-0 rounded bg-slate-50"
                              title="Parcelas"
                            >
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => setPartialPayments(prev => prev.filter(r => r.id !== row.id))}
                            className="p-1.5 text-slate-400 hover:text-red-500 shrink-0"
                            title="Remover"
                            disabled={partialPayments.length <= 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const total = parseCurrencyFormatted(formatCurrencyInput(totalValueRaw)) || 0;
                      const sum = partialPayments.reduce((s, r) => s + (parseCurrencyFormatted(formatCurrencyInput(r.amountRaw)) || 0), 0);
                      const diff = Math.abs(total - sum) > 0.009;
                      return total > 0 && diff ? (
                        <p className="text-xs font-bold text-amber-700">Soma dos valores deve ser R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
              <Button
                onClick={handleFinishSale}
                className="w-full py-3.5 text-base font-black"
                style={{ backgroundColor: storeColorCss }}
                disabled={
                  cart.length === 0 || (!isWarrantySale && !paymentMethod) ||
                  (paymentMethod === 'parcial' && (partialPayments.length === 0 || partialPayments.some(r => (parseCurrencyFormatted(formatCurrencyInput(r.amountRaw)) || 0) <= 0) || Math.abs((parseCurrencyFormatted(formatCurrencyInput(totalValueRaw)) || 0) - partialPayments.reduce((s, r) => s + (parseCurrencyFormatted(formatCurrencyInput(r.amountRaw)) || 0), 0)) > 0.01))
                }
              >
                <CheckCircle2 size={16} /> Gerar OS
              </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Selecionar Cliente */}
      {clientModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black text-slate-950">Selecionar Cliente</h3>
              <button onClick={() => setClientModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
              <Input
                placeholder="Digite o nome ou CPF do cliente..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="text-base"
              />
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {clientsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-slate-400" />
                  </div>
                ) : clientSearch.length >= 2 && clients.length > 0 ? (
                  clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="w-full p-4 bg-white rounded-xl border border-slate-100 hover:border-[var(--store-color)] hover:shadow-md transition-all text-left"
                    >
                      <p className="text-sm font-black text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{client.document}</p>
                    </button>
                  ))
                ) : clientSearch.length >= 2 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                    <User size={40} className="mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-400">Nenhum cliente encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Crie um novo cliente abaixo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                    <User size={48} className="mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-400">Busque por nome ou CPF</p>
                    <p className="text-xs text-slate-400">Ou continue sem cliente como Consumidor Final</p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-3 shrink-0">
                <Button onClick={() => { setClientModalOpen(false); setCreateClientModalOpen(true); }} className="w-full" style={{ backgroundColor: storeColorCss }}>
                  <UserPlus size={18} /> Cadastrar Novo Cliente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientModalOpen(false);
                  }}
                  className="w-full border-slate-200 text-slate-600 bg-white"
                >
                  Continuar sem Cliente (Consumidor Final)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      {createClientModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-950">Novo Cliente</h3>
              <button onClick={() => { setCreateClientModalOpen(false); setClientModalOpen(true); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Nome *" placeholder="Nome completo" value={quickName} onChange={e => setQuickName(e.target.value)} />
              <Input label="CPF *" placeholder="000.000.000-00" value={quickDocument} onChange={e => setQuickDocument(e.target.value)} />
              <PhoneInput
                label="Telefone *"
                value={quickPhone}
                onChange={(phone, countryIso) => {
                  setQuickPhone(phone);
                  setQuickPhoneCountryIso(countryIso);
                }}
                required
              />
              <Input label="E-mail (opcional)" type="email" placeholder="nome@email.com" value={quickEmail} onChange={e => setQuickEmail(e.target.value)} />
              <Button onClick={handleCreateQuickClient} disabled={creatingClient} className="w-full" style={{ backgroundColor: storeColorCss }}>
                {creatingClient ? <><Loader2 size={18} className="animate-spin" /> Cadastrando...</> : <><UserPlus size={18} /> Cadastrar e usar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Confirmar OS</h3>
              <p className="text-sm text-slate-500 mt-1">Revise os dados antes de gerar a Ordem de Serviço</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</p>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm font-bold text-slate-900">{selectedClient ? selectedClient.name : 'Consumidor Final'}</p>
                  {selectedClient && <p className="text-xs text-slate-500 mt-1">{selectedClient.document}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Armações ({cart.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.description}</p>
                        {item.code ? (
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">Cód: {item.code}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Forma de Pagamento:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {isWarrantySale
                      ? 'Garantia (sem pagamento)'
                      : paymentMethod === 'parcial'
                      ? 'Parcial (múltiplas)'
                      : paymentMethod === 'credit_card'
                        ? `Cartão crédito${installments > 1 ? ` (${installments}x)` : ''}`
                        : paymentMethod === 'debit_card'
                          ? 'Cartão débito'
                          : paymentMethod === 'pix'
                            ? 'PIX'
                            : paymentMethod === 'permuta'
                              ? 'Permuta'
                              : 'Dinheiro'}
                  </span>
                </div>
                {paymentMethod === 'parcial' && partialPayments.filter(p => (parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0) > 0).length > 0 && (
                  <div className="text-xs space-y-1">
                    {partialPayments.filter(p => (parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0) > 0).map(p => (
                      <div key={p.id} className="flex justify-between text-slate-600">
                        <span>
                          {paymentMethodLabel(p.method)}
                          {p.method === 'credit_card' && p.installments > 1 ? ` (${p.installments}x)` : ''}
                        </span>
                        <span className="font-bold text-slate-900">R$ {(parseCurrencyFormatted(formatCurrencyInput(p.amountRaw)) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Valor total:</span>
                  <span className="font-bold text-slate-900">
                    R$ {(isWarrantySale ? 0 : (parseCurrencyFormatted(formatCurrencyInput(totalValueRaw)) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {paymentMethod === 'credit_card' && installments > 1 && (
                      <span className="block text-xs font-normal text-slate-500 mt-0.5">
                        {installments}x de R$ {((parseCurrencyFormatted(formatCurrencyInput(totalValueRaw)) || 0) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1 border-slate-200 text-slate-600 bg-white">
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSale}
                  disabled={submitting}
                  className="flex-1"
                  style={{ backgroundColor: storeColorCss }}
                >
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Gerando...</>
                  ) : (
                    <><CheckCircle2 size={18} /> Confirmar</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Finalização */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-100 text-center">
              <h3 className="text-2xl font-black text-slate-900 mb-1">OS Gerada!</h3>
              <p className="text-sm text-slate-500 uppercase tracking-widest">Ordem de Serviço finalizada</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 mb-4 text-center">Escolha o que deseja imprimir:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => handleFinishPrint('receipt')}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--store-color)' }}>
                    <Receipt size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Imprimir Recibo</span>
                </button>
                <button
                  onClick={() => handleFinishPrint('nfe')}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--store-color)' }}>
                    <FileText size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Imprimir NF-e</span>
                </button>
                <button
                  onClick={() => handleFinishPrint('none')}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-400 text-white mb-3 group-hover:scale-110 transition-transform">
                    <Ban size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Nenhum</span>
                </button>
              </div>
              <Button variant="outline" onClick={resetSale} className="w-full border-slate-200 text-slate-600 bg-white mt-4">
                <ArrowLeft size={18} /> Nova Venda
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recibo Térmico (dentro do PDV) */}
      {showReceiptPrintModal && receiptDataForModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recibo</h3>
              <button
                onClick={() => setShowReceiptPrintModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-auto max-h-[60vh] flex justify-center mb-4 bg-slate-50 rounded-xl p-4">
              <ThermalReceipt ref={receiptPrintRef} data={receiptDataForModal} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handlePrintReceiptFromModal} className="flex-1" style={{ backgroundColor: 'var(--store-color)' }}>
                <Printer size={18} /> Imprimir
              </Button>
              <Button variant="outline" onClick={() => setShowReceiptPrintModal(false)} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
