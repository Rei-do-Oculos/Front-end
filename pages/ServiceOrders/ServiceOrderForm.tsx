import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Save, ArrowLeft, FileText, Loader2, Search, Edit, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, NumberInput, SingleSelect, MultiSelect } from '../../components/Common';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useServiceOrders } from '../../services/hooks/useServiceOrders';
import { useClients } from '../../services/hooks/useClients';
import type { Client } from '../../services/api/clients';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { useLaboratoryLenses } from '../../services/hooks/useLaboratoryLenses';
import { useFrames } from '../../services/hooks/useFrames';
import type { Frame } from '../../services/api/frames';
import { useLenses } from '../../services/hooks/useLenses';
import { useStores } from '../../services/hooks/useStores';
import { storesService } from '../../services/api/stores';
import type { Store as StoreFromApi } from '../../services/api/stores';
import { useNotification } from '../../hooks/useNotification';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../services/hooks/useAuth';
import { usePermission } from '../../services/hooks/usePermission';
import { userHasAccessToStore } from '../../utils/storeAccess';
import { canShowNfeOptionInReceiptModal } from '../../utils/serviceOrderNfeEligibility';
import { serviceOrderSchema, formatZodErrors } from '../../schemas/serviceOrder.schema';
import { ReceiptModal } from '../../components/ReceiptModal';
import { ReceiptData } from '../../components/ThermalReceipt';
import { persistedPaymentsFromServiceOrder } from '../../utils/receiptPaymentsFromOrder';
import { EntryReceiptModal } from '../../components/EntryReceiptModal';
import { EntryReceiptData, EntryReceiptPaymentLine } from '../../components/EntryReceipt';
import { NFeSection } from '../../components/NFeSection';
import { invoicesService } from '../../services/api/invoices';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import type { ServiceOrder } from '../../services/api/serviceOrders';
import { formatIsoDatePtBr } from '../../utils/dateDisplay';
import { buildPrescriptionLinesForEntryReceipt } from '../../utils/entryReceiptPrescription';

// Função para formatar valor como moeda brasileira
const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseInt(numbers, 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para converter valor formatado para número
const parseCurrency = (value: string): string => {
  if (!value) return '';
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return cleanValue;
};

// Função para formatar número do backend para exibição
const formatFromNumber = (value: number | string): string => {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para filtrar entrada de grau (esférico/cilíndrico) - permite apenas caracteres válidos
const filterDegreeInput = (value: string): string => {
  // Permitir apenas números, vírgula, ponto e sinal no início
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (i === 0 && (char === '-' || char === '+')) {
      result += char;
    } else if (/[\d,.]/.test(char)) {
      // Só permite uma vírgula ou ponto
      if ((char === ',' || char === '.') && (result.includes(',') || result.includes('.'))) {
        continue;
      }
      result += char;
    }
  }
  return result;
};

// Função auxiliar para formatar grau com limites customizáveis
const formatDegreeWithLimits = (value: string, minVal: number, maxVal: number): string => {
  if (!value) return '';
  
  let cleaned = filterDegreeInput(value);
  
  // Manter o sinal
  const isNegative = cleaned.startsWith('-');
  cleaned = cleaned.replace(/[+-]/g, '');
  
  // Substituir vírgula por ponto para processamento
  cleaned = cleaned.replace(',', '.');
  
  // Converter para número e validar limites
  let num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  
  if (isNegative) num = -Math.abs(num);
  
  // Limitar entre min e max
  if (num > maxVal) num = maxVal;
  if (num < minVal) num = minVal;
  
  // Formatar com sinal e 2 casas decimais
  const formatted = Math.abs(num).toFixed(2).replace('.', ',');
  if (num < 0) return '-' + formatted;
  if (num > 0) return '+' + formatted;
  return formatted;
};

// Função para formatar grau esférico no blur: -30 a +30, 2 casas decimais
const formatDegree = (value: string): string => {
  return formatDegreeWithLimits(value, -30, 30);
};

// Função para formatar cilíndrico no blur: sempre negativo, limite -10 a 0, 2 casas decimais
const formatCylindrical = (value: string): string => {
  if (!value) return '';

  let cleaned = filterDegreeInput(value);
  cleaned = cleaned.replace(/[+-]/g, '').replace(',', '.');

  let num = parseFloat(cleaned);
  if (isNaN(num)) return '';

  // Cilíndrico deve ficar sempre em notação negativa.
  num = -Math.abs(num);

  // Limitar para a faixa válida
  if (num < -10) num = -10;
  if (num > 0) num = 0;

  if (num === 0) return '-0,00';
  return num.toFixed(2).replace('.', ',');
};

// Função para filtrar eixo: apenas números
const filterAxisInput = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 3);
};

// Função para formatar eixo no blur: 0 a 180
const formatAxis = (value: string): string => {
  const cleaned = filterAxisInput(value);
  if (!cleaned) return '';
  
  let num = parseInt(cleaned, 10);
  if (num > 180) num = 180;
  if (num < 0) num = 0;
  
  return String(num);
};

// Função para filtrar adição: apenas números e vírgula/ponto
const filterAdditionInput = (value: string): string => {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (/[\d,.]/.test(char)) {
      if ((char === ',' || char === '.') && (result.includes(',') || result.includes('.'))) {
        continue;
      }
      result += char;
    }
  }
  return result;
};

// Função para formatar adição no blur: 0 a 4, 2 casas decimais
const formatAddition = (value: string): string => {
  if (!value) return '';
  
  let cleaned = filterAdditionInput(value);
  cleaned = cleaned.replace(',', '.');
  
  let num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  
  // Limitar entre 0 e 4
  if (num > 4) num = 4;
  if (num < 0) num = 0;
  
  return num.toFixed(2).replace('.', ',');
};

// Função para filtrar DNP: apenas números, vírgula e barra
const filterDNPInput = (value: string): string => {
  return value.replace(/[^\d,/]/g, '').slice(0, 11);
};

export const ServiceOrderForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const { availableStores, selectedStore } = useStore();
  const { user, isLoading: authLoading } = useAuth();
  const { hasSuperAdminRole } = usePermission();
  
  // Determinar modo: criar, visualizar ou editar
  const isCreateMode = !id;
  const isViewMode = !!id && !location.endsWith('/edit');
  const isEditMode = !!id && location.endsWith('/edit');
  
  // Verificar se OS é de outra loja (bloquear edição)
  const [isOtherStoreOrder, setIsOtherStoreOrder] = useState(false);
  const [loading, setLoading] = useState(!!id); // Loading se tiver id (view ou edit)
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [clientSearch, setClientSearch] = useState('');
  /** Busca de armações na API (código ou descrição) — evita depender só das primeiras 100 linhas */
  const [frameSearchQuery, setFrameSearchQuery] = useState('');
  const framesByIdRef = useRef<Map<number, Frame>>(new Map());
  /** Cliente carregado quando vem da URL (?client_id=) para exibir no select */
  const [preselectedClientData, setPreselectedClientData] = useState<Client | null>(null);
  
  // Pegar client_id da URL se vier da página de clientes
  const preselectedClientId = searchParams.get('client_id') || '';
  
  const { getServiceOrder, createServiceOrder, updateServiceOrder } = useServiceOrders({ autoFetch: false });
  const { clients, fetchClients, getClient } = useClients({ autoFetch: false });
  const { laboratories, fetchLaboratories, loading: loadingLaboratories } = useLaboratories({ autoFetch: false });
  const { laboratoryLenses, fetchLaboratoryLenses, loading: loadingLabLenses } = useLaboratoryLenses({ autoFetch: false });
  const { frames, fetchFrames, loading: loadingFrames } = useFrames({ autoFetch: false });
  const { lenses, fetchLenses, loading: loadingLenses } = useLenses({ autoFetch: false });
  const { stores, fetchStores } = useStores({ autoFetch: false });
  
  const [loadedOrder, setLoadedOrder] = useState<ServiceOrder | null>(null);
  /** Snapshot das lentes da OS no momento da venda (para exibir preço e promoção históricos ao visualizar) */
  const [orderLaboratoryLensesSnapshot, setOrderLaboratoryLensesSnapshot] = useState<Array<{
    id: number;
    name: string;
    laboratory_id?: number | null;
    laboratory?: { id: number; name: string } | null;
    cost_price: number;
    sale_price: number;
    cost_price_at_sale?: number | null;
    sale_price_at_sale?: number | null;
    promotion_applied?: boolean;
  }> | null>(null);
  // Estado para o modal de recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEntryReceiptModal, setShowEntryReceiptModal] = useState(false);
  /** Padrão: valores dos produtos do laboratório ocultos (***). Eye para alternar. */
  const [showLabProductValues, setShowLabProductValues] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [createdOsNumber, setCreatedOsNumber] = useState<number | null>(null);
  /** Próximo número de OS da loja selecionada (somente criação). */
  const [nextOsPreview, setNextOsPreview] = useState<number | null>(null);
  const [nextOsPreviewLoading, setNextOsPreviewLoading] = useState(false);

  // Loading geral inclui dados auxiliares
  const auxiliaryDataLoading = loadingLaboratories || loadingLabLenses || loadingFrames || loadingLenses;

  // Rolar até o banner de erro quando houver validação
  useEffect(() => {
    if (errors.form) {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors.form]);

  // Determinar loja padrão
  const defaultStoreId = useMemo(() => {
    if (availableStores.length === 1) {
      return String(availableStores[0].id);
    }
    if (selectedStore) {
      return String(selectedStore.id);
    }
    return '';
  }, [availableStores, selectedStore]);

  const [formData, setFormData] = useState({
    client_id: preselectedClientId,
    store_id: defaultStoreId,
    user_id: user?.id ? String(user.id) : '',
    laboratory_ids: [] as string[],
    laboratory_id: '',
    expected_pickup_date: '',
    // Longe - OD
    far_od_spherical: '',
    far_od_cylindrical: '',
    far_od_axis: '',
    // Longe - OE
    far_oe_spherical: '',
    far_oe_cylindrical: '',
    far_oe_axis: '',
    // Perto - OD
    near_od_spherical: '',
    near_od_cylindrical: '',
    near_od_axis: '',
    // Perto - OE
    near_oe_spherical: '',
    near_oe_cylindrical: '',
    near_oe_axis: '',
    // Adição e DNP
    addition: '',
    far_dnp: '',
    near_dnp: '',
    // Armação
    frame_code: '',
    rim_use: '',
    warranty: '',
    // Tipos de lente
    single_vision: false,
    bifocal: false,
    multifocal: false,
    anti_reflective: false,
    transitions: false,
    frame_included: false,
    tinting: false,
    // Valores
    price: '',
    payment_method: '',
    installments: '1',
    notes: '',
    verified: false,
    // Many-to-many
    laboratory_lenses: [] as string[],
    frames: [] as string[],
    lenses: [] as string[],
    // Toggle de laboratório
    send_to_lab: false,
    // Pagamentos parciais/mistos
    use_partial_payments: false,
    partial_payments: [] as Array<{
      payment_method: string;
      amount: string;
      installments: string;
    }>,
  });

  const frameStoreId = useMemo(() => {
    const raw = formData.store_id || defaultStoreId;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [formData.store_id, defaultStoreId]);

  const onFrameSearchQueryChange = useCallback((query: string) => {
    setFrameSearchQuery(query);
  }, []);

  // Próximo número da OS na loja escolhida (nova OS): mescla lista /auth + GET loja se faltar
  useEffect(() => {
    if (!isCreateMode || !formData.store_id) {
      setNextOsPreview(null);
      setNextOsPreviewLoading(false);
      return;
    }

    const sid = formData.store_id;
    const fromFetched = Array.isArray(stores)
      ? (stores as StoreFromApi[]).find((s) => String(s.id) === sid)
      : undefined;
    const fromCtx = availableStores.find((s) => String(s.id) === sid);
    const merged: Partial<StoreFromApi> = { ...(fromCtx as object), ...(fromFetched as object) };
    const n = merged.os_next_number;

    if (n != null && n > 0) {
      setNextOsPreview(n);
      setNextOsPreviewLoading(false);
      return;
    }

    setNextOsPreview(null);
    setNextOsPreviewLoading(true);
    let cancelled = false;

    storesService
      .getById(sid)
      .then((s) => {
        if (cancelled) return;
        const v = s.os_next_number;
        if (v != null && v > 0) {
          setNextOsPreview(v);
          return;
        }

        // Fallback: quando a API de loja não expõe os_next_number, calcula pelo maior os_number da loja + 1.
        serviceOrdersService
          .getAll({
            page: 1,
            per_page: 1,
            store_id: Number(sid),
            order_by: 'os_number',
            order_dir: 'desc',
          })
          .then((resp) => {
            if (cancelled) return;
            const latest = resp.data?.[0]?.os_number;
            const next = typeof latest === 'number' && latest > 0 ? latest + 1 : 1;
            setNextOsPreview(next);
          })
          .catch(() => {
            if (!cancelled) setNextOsPreview(1);
          });
      })
      .catch(() => {
        if (cancelled) return;
        serviceOrdersService
          .getAll({
            page: 1,
            per_page: 1,
            store_id: Number(sid),
            order_by: 'os_number',
            order_dir: 'desc',
          })
          .then((resp) => {
            if (cancelled) return;
            const latest = resp.data?.[0]?.os_number;
            const next = typeof latest === 'number' && latest > 0 ? latest + 1 : 1;
            setNextOsPreview(next);
          })
          .catch(() => {
            if (!cancelled) setNextOsPreview(1);
          });
      })
      .finally(() => {
        if (!cancelled) setNextOsPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCreateMode, formData.store_id, stores, availableStores]);

  // Atualizar store_id e user_id quando disponíveis (apenas no modo de criação)
  useEffect(() => {
    if (isCreateMode) {
      setFormData(prev => ({
        ...prev,
        store_id: defaultStoreId,
        user_id: user?.id ? String(user.id) : prev.user_id,
      }));
    }
  }, [defaultStoreId, user, isCreateMode]);

  // Carregar dados auxiliares (armações: efeito separado com loja + busca na API)
  useEffect(() => {
    fetchClients(1, { per_page: 100 });
    fetchLaboratories(1, { per_page: 100 });
    fetchLaboratoryLenses(1, { per_page: 100 });
    fetchLenses(1, { per_page: 100 });
    fetchStores(1, { per_page: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (Array.isArray(frames) ? frames : []).forEach((f) => framesByIdRef.current.set(f.id, f));
  }, [frames]);

  useEffect(() => {
    if (!frameStoreId) return;
    const trimmed = frameSearchQuery.trim();
    const delay = trimmed ? 300 : 0;
    const t = setTimeout(() => {
      fetchFrames(1, {
        per_page: 100,
        store_id: frameStoreId,
        ...(trimmed ? { search: trimmed } : {}),
      });
    }, delay);
    return () => clearTimeout(t);
  }, [frameStoreId, frameSearchQuery, fetchFrames]);

  // Buscar clientes ao digitar nome, CPF ou telefone (debounce 300ms)
  useEffect(() => {
    const trimmed = clientSearch.trim();
    if (!trimmed) return;
    const timer = setTimeout(() => {
      fetchClients(1, { search: trimmed, per_page: 50 });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSearch]);

  // Carregar cliente preselecionado da URL 
  useEffect(() => {
    if (!preselectedClientId || !isCreateMode) {
      setPreselectedClientData(null);
      return;
    }
    let cancelled = false;
    getClient(preselectedClientId)
      .then((client) => {
        if (!cancelled && client) setPreselectedClientData(client);
      })
      .catch(() => {
        if (!cancelled) setPreselectedClientData(null);
      });
    return () => { cancelled = true; };
  }, [preselectedClientId, isCreateMode, getClient]);

  // Função para converter objeto com índices numéricos para array
  const toArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return Object.values(data);
    }
    return [];
  };

  // Opções de pagamento (inclui "Pagamento na Retirada" quando tem laboratório)
  const paymentOptions = useMemo(() => {
    const base = [
      { value: 'credit_card', label: 'Cartão de Crédito' },
      { value: 'debit_card', label: 'Cartão de Débito' },
      { value: 'cash', label: 'Dinheiro' },
      { value: 'pix', label: 'PIX' },
      { value: 'permuta', label: 'Permuta' },
    ];
    if (formData.send_to_lab) {
      base.push({ value: 'on_pickup', label: 'Pagamento na Retirada' });
    }
    return base;
  }, [formData.send_to_lab]);

  // Carregar OS para visualização ou edição
  useEffect(() => {
    if (id) {
      setLoading(true);
      setErrors({});
      const loadOrder = async () => {
        try {
          const order = await getServiceOrder(id);
          if (order) {
            setLoadedOrder(order);
            const lensesFromOrder = toArray(order.laboratory_lenses);
            /** Laboratórios distintos vindos dos produtos (vários labs na mesma OS). */
            const laboratoryIdsFromProducts: string[] = [];
            const seenLab = new Set<string>();
            for (const l of lensesFromOrder) {
              const raw = (l as any)?.laboratory_id;
              if (raw == null || raw === '') continue;
              const sid = String(raw);
              if (!seenLab.has(sid)) {
                seenLab.add(sid);
                laboratoryIdsFromProducts.push(sid);
              }
            }
            const laboratory_ids =
              laboratoryIdsFromProducts.length > 0
                ? laboratoryIdsFromProducts
                : (order.laboratory_id ? [String(order.laboratory_id)] : []);

            setOrderLaboratoryLensesSnapshot(lensesFromOrder.map((l: any) => ({
              id: l.id,
              name: l.name || '',
              laboratory_id: l.laboratory_id ?? null,
              laboratory: l.laboratory ?? null,
              cost_price: l.cost_price ?? 0,
              sale_price: l.sale_price ?? 0,
              cost_price_at_sale: l.cost_price_at_sale ?? null,
              sale_price_at_sale: l.sale_price_at_sale ?? null,
              promotion_applied: !!l.promotion_applied,
            })));
            
            setFormData({
              client_id: String(order.client_id) || '',
              store_id: String(order.store_id) || '',
              user_id: String(order.user_id) || '',
              laboratory_ids,
              laboratory_id:
                laboratory_ids.length > 0
                  ? laboratory_ids[0]
                  : (order.laboratory_id ? String(order.laboratory_id) : ''),
              expected_pickup_date: order.expected_pickup_date ? order.expected_pickup_date.slice(0, 10) : '',
              // Longe - OD
              far_od_spherical: order.far_od_spherical || '',
              far_od_cylindrical: order.far_od_cylindrical || '',
              far_od_axis: order.far_od_axis || '',
              // Longe - OE
              far_oe_spherical: order.far_oe_spherical || '',
              far_oe_cylindrical: order.far_oe_cylindrical || '',
              far_oe_axis: order.far_oe_axis || '',
              // Perto - OD
              near_od_spherical: order.near_od_spherical || '',
              near_od_cylindrical: order.near_od_cylindrical || '',
              near_od_axis: order.near_od_axis || '',
              // Perto - OE
              near_oe_spherical: order.near_oe_spherical || '',
              near_oe_cylindrical: order.near_oe_cylindrical || '',
              near_oe_axis: order.near_oe_axis || '',
              // Adição e DNP
              addition: order.addition || '',
              far_dnp: order.far_dnp || '',
              near_dnp: order.near_dnp || '',
              // Armação
              frame_code: order.frame_code || '',
              rim_use: order.rim_use ? String(order.rim_use) : '',
              warranty: order.warranty ? String(order.warranty) : '',
              // Tipos de lente
              single_vision: order.single_vision || false,
              bifocal: order.bifocal || false,
              multifocal: order.multifocal || false,
              anti_reflective: order.anti_reflective || false,
              transitions: order.transitions || false,
              frame_included: order.frame_included || false,
              tinting: order.tinting || false,
              // Valores
              price: formatFromNumber(order.price),
              payment_method: order.payment_method || '',
              installments: order.installments ? String(order.installments) : '1',
              notes: order.notes || '',
              verified: order.verified || false,
              // Many-to-many - converter objetos para arrays e extrair IDs
              laboratory_lenses: lensesFromOrder.map((l: { id: number }) => String(l.id)),
              frames: toArray(order.frames).map(f => String(f.id)),
              lenses: toArray(order.lenses).map(l => String(l.id)),
              // Toggle de laboratório
              send_to_lab: laboratory_ids.length > 0 || !!order.laboratory_id,
              // Pagamentos parciais (API pode enviar payments como array ou objeto indexado)
              use_partial_payments: persistedPaymentsFromServiceOrder(order).length > 0,
              partial_payments: (() => {
                const rows = persistedPaymentsFromServiceOrder(order);
                return rows.length > 0
                  ? rows.map((p) => ({
                      payment_method: p.payment_method || '',
                      amount: formatFromNumber(p.amount),
                      installments: p.installments ? String(p.installments) : '1',
                    }))
                  : [];
              })(),
            });
          } else {
            setErrors({ form: 'Ordem de serviço não encontrada' });
          }
        } catch (err: any) {
          console.error('Erro ao carregar OS:', err);
          setErrors({ form: err.response?.data?.message || err.message || 'Erro ao carregar dados da OS' });
        } finally {
          setLoading(false);
        }
      };
      loadOrder();
    } else {
      setLoadedOrder(null);
      setOrderLaboratoryLensesSnapshot(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Edição permitida só para superadmin ou usuário vinculado à loja da OS (não depende da loja selecionada no header)
  useEffect(() => {
    if (!loadedOrder || authLoading || !id) return;
    const cannotEditOrderStore =
      !hasSuperAdminRole && !userHasAccessToStore(loadedOrder.store_id, user);
    setIsOtherStoreOrder(cannotEditOrderStore);
    if (cannotEditOrderStore && isEditMode) {
      showError('Você não pode editar OS de uma loja à qual não está vinculado.');
      navigate(`/service-orders/${id}`);
    }
  }, [loadedOrder, authLoading, id, user, hasSuperAdminRole, isEditMode, navigate, showError]);

  // Função auxiliar para converter valor com vírgula brasileira para número
  const parseNumericField = (value: string | null | undefined): number | null => {
    if (!value) return null;
    // Remove sinais de + e converte vírgula para ponto
    const cleaned = value.replace(',', '.').replace(/^\+/, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Função para preparar os dados do recibo
  const prepareReceiptData = (osNumber: number): ReceiptData => {
    const storesList = Array.isArray(stores) ? stores : [];
    const clientsList = Array.isArray(clients) ? clients : [];
    const framesList = Array.isArray(frames) ? frames : [];
    
    // Buscar dados completos da loja
    const storeData = storesList.find(s => String(s.id) === formData.store_id);
    const clientData = clientsList.find(c => String(c.id) === formData.client_id);
    
    const totalPrice = formData.price ? parseFloat(parseCurrency(formData.price)) : 0;
    
    // Montar itens do recibo (apenas armações, sem lentes e sem produtos do laboratório)
    const items: { description: string; quantity: number; price: number }[] = [];
    
    // Adicionar armações selecionadas
    const selectedFrames = formData.frames.map(frameId => 
      framesList.find(f => String(f.id) === frameId)
    ).filter(Boolean);
    
    if (selectedFrames.length > 0) {
      // Se tiver 1 armação, coloca o valor total nela
      // Se tiver mais de 1, divide o valor entre elas
      const pricePerFrame = totalPrice / selectedFrames.length;
      
      selectedFrames.forEach(frame => {
        if (frame) {
          items.push({
            description: frame.description || `Armação ${frame.code}`,
            quantity: 1,
            price: pricePerFrame,
          });
        }
      });
    } else {
      // Se não tiver armação, mostra item genérico
      items.push({
        description: 'Serviço Óptico',
        quantity: 1,
        price: totalPrice,
      });
    }
    
    return {
      osNumber,
      date: new Date().toLocaleString('pt-BR'),
      expectedPickupDate: formData.expected_pickup_date || null,
      seller: user?.name || 'Vendedor',
      store: {
        name: storeData?.name || 'Loja',
        fancy_name: storeData?.fancy_name || storeData?.name || 'Loja',
        receipt_header: storeData?.receipt_header ?? null,
        cnpj: storeData?.cnpj || '00.000.000/0000-00',
        ie: storeData?.ie || null,
        logradouro: storeData?.logradouro || '',
        numero: storeData?.numero || '',
        bairro: storeData?.bairro || '',
        municipio: storeData?.municipio || '',
        uf: storeData?.uf || '',
        telefone: storeData?.telefone || null,
      },
      client: {
        name: clientData?.name || 'Cliente',
        document: clientData?.document || null,
      },
      items,
      total: totalPrice,
      paymentMethod: formData.use_partial_payments ? null : (formData.payment_method || null),
      installments: formData.use_partial_payments ? null : (formData.payment_method === 'credit_card' && formData.installments 
        ? parseInt(formData.installments) 
        : null),
      payments: formData.use_partial_payments && formData.partial_payments.length > 0
        ? formData.partial_payments
            .filter(p => p.payment_method && p.amount)
            .map(p => ({
              payment_method: p.payment_method,
              amount: parseFloat(parseCurrency(p.amount)),
              installments: p.payment_method === 'credit_card' && p.installments ? parseInt(p.installments) : null,
            }))
        : undefined,
    };
  };

  // Função para preparar os dados do comprovante de entrada (OS com laboratório)
  const prepareEntryReceiptData = (osNumber: number): EntryReceiptData => {
    const storesList = Array.isArray(stores) ? stores : [];
    const clientsList = Array.isArray(clients) ? clients : [];
    const framesList = Array.isArray(frames) ? frames : [];
    const laboratoriesList = Array.isArray(laboratories) ? laboratories : [];
    
    const storeData = storesList.find(s => String(s.id) === formData.store_id);
    const clientData = clientsList.find(c => String(c.id) === formData.client_id);
    const totalPrice = formData.price ? parseFloat(parseCurrency(formData.price)) : 0;
    
    // Montar lista de itens do comprovante: produtos de laboratório + armações
    const selectedLabProducts = formData.laboratory_lenses.map((lensId) => {
      const lens = laboratoryLensesList.find(l => String(l.id) === String(lensId));
      return {
        id: lens?.id ?? Number(lensId),
        name: lens?.name || `Produto #${lensId}`,
        laboratory_id: lens?.laboratory_id ?? 0,
      };
    });
    const selectedFrames = formData.frames.map(frameId =>
      framesList.find(f => String(f.id) === frameId)
    ).filter(Boolean);

    const labProductsMap = selectedLabProducts.reduce<Record<string, { description: string; quantity: number }>>((acc, product) => {
      const key = String(product.name || 'Produto');
      if (!acc[key]) {
        acc[key] = { description: key, quantity: 0 };
      }
      acc[key].quantity += 1;
      return acc;
    }, {});
    const frameItemsMap = selectedFrames.reduce<Record<string, { description: string; quantity: number }>>((acc, frame) => {
      const description = frame?.description || `Armação ${frame?.code}`;
      if (!acc[description]) {
        acc[description] = { description, quantity: 0 };
      }
      acc[description].quantity += 1;
      return acc;
    }, {});

    const combinedItemsMap: Record<string, { description: string; quantity: number }> = {
      ...labProductsMap,
    };
    Object.values(frameItemsMap).forEach((item) => {
      if (!combinedItemsMap[item.description]) {
        combinedItemsMap[item.description] = { ...item };
      } else {
        combinedItemsMap[item.description].quantity += item.quantity;
      }
    });

    const hasFrames = Object.keys(frameItemsMap).length > 0;
    if (!hasFrames && formData.rim_use) {
      combinedItemsMap['Aro de uso'] = { description: 'Aro de uso', quantity: 1 };
    }

    const combinedItems = Object.values(combinedItemsMap);
    const items = combinedItems.length > 0
      ? combinedItems
      : [{ description: 'Serviço Óptico', quantity: 1 }];

    let payments: EntryReceiptPaymentLine[] | undefined;
    let paymentMethod: string | null = formData.payment_method || null;
    let installments: number | null = null;

    if (formData.use_partial_payments && formData.partial_payments.length > 0) {
      const rows = formData.partial_payments
        .filter((p) => p.payment_method && p.amount)
        .map((p) => ({
          payment_method: p.payment_method,
          amount: parseFloat(parseCurrency(p.amount)),
          installments:
            p.payment_method === 'credit_card' && p.installments ? parseInt(p.installments, 10) : null,
        }));
      if (rows.length > 0) {
        payments = rows;
        paymentMethod = null;
        installments = null;
      }
    } else if (formData.payment_method === 'credit_card' && formData.installments) {
      installments = parseInt(formData.installments, 10) || null;
    }

    const lensesListForRx = Array.isArray(lenses) ? lenses : [];
    const stockLensMeta = formData.lenses
      .map((id) => lensesListForRx.find((ln) => String(ln.id) === String(id)))
      .filter((ln): ln is NonNullable<typeof ln> => Boolean(ln))
      .map((ln) => ({ name: ln.name }));

    const prescriptionLines = buildPrescriptionLinesForEntryReceipt({
      far_od_spherical: formData.far_od_spherical,
      far_od_cylindrical: formData.far_od_cylindrical,
      far_od_axis: formData.far_od_axis,
      far_oe_spherical: formData.far_oe_spherical,
      far_oe_cylindrical: formData.far_oe_cylindrical,
      far_oe_axis: formData.far_oe_axis,
      near_od_spherical: formData.near_od_spherical,
      near_od_cylindrical: formData.near_od_cylindrical,
      near_od_axis: formData.near_od_axis,
      near_oe_spherical: formData.near_oe_spherical,
      near_oe_cylindrical: formData.near_oe_cylindrical,
      near_oe_axis: formData.near_oe_axis,
      addition: formData.addition,
      far_dnp: formData.far_dnp,
      near_dnp: formData.near_dnp,
      frame_code: formData.frame_code,
      rim_use: formData.rim_use,
      warranty: formData.warranty,
      single_vision: formData.single_vision,
      bifocal: formData.bifocal,
      multifocal: formData.multifocal,
      anti_reflective: formData.anti_reflective,
      transitions: formData.transitions,
      frame_included: formData.frame_included,
      tinting: formData.tinting,
      notes: formData.notes,
      lenses: stockLensMeta,
    });

    return {
      osNumber,
      date: new Date().toLocaleString('pt-BR'),
      expectedPickupDate: formData.expected_pickup_date || null,
      prescriptionLines,
      store: {
        name: storeData?.name || 'Loja',
        fancy_name: storeData?.fancy_name || storeData?.name || 'Loja',
        receipt_header: storeData?.receipt_header ?? null,
        logradouro: storeData?.logradouro || '',
        numero: storeData?.numero || '',
        telefone: storeData?.telefone || null,
      },
      client: {
        name: clientData?.name || 'Cliente',
        telefone: clientData?.phone || null,
      },
      items,
      total: totalPrice,
      paymentMethod,
      installments,
      payments,
    };
  };

  // Callback quando confirma/fecha o modal de comprovante de entrada
  const handleEntryReceiptConfirm = (_printed: boolean) => {
    setShowEntryReceiptModal(false);
    setPendingPayload(null);
    setCreatedOsNumber(null);
    navigate('/service-orders/lab');
  };

  // Função para executar o salvamento. Retorna ServiceOrder (create) ou null (update).
  const performSave = async (payload: any): Promise<ServiceOrder | null> => {
    try {
      if (isEditMode && id) {
        await updateServiceOrder(id, payload);
        showSuccess('Ordem de serviço atualizada com sucesso!');
        return null;
      } else {
        const result = await createServiceOrder(payload);
        showSuccess('Ordem de serviço criada com sucesso!');
        return result ?? null;
      }
    } catch (err: any) {
      console.error('Erro ao salvar OS:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar ordem de serviço';
      setErrors({ form: errorMessage });
      showError(errorMessage);
      throw err;
    }
  };

  // Callback quando confirma no modal de recibo
  const handleReceiptConfirm = async (type: 'receipt' | 'nfce' | 'nfe' | 'none') => {
    if (!pendingPayload) return;

    // NFC-e/NF-e: a OS já foi salva e a nota emitida dentro de onGenerateInvoice
    if (type === 'nfce' || type === 'nfe') {
      setShowReceiptModal(false);
      setPendingPayload(null);
      setCreatedOsNumber(null);
      navigate('/service-orders');
      return;
    }

    setSaving(true);
    try {
      await performSave(pendingPayload);
      setShowReceiptModal(false);
      setPendingPayload(null);
      setCreatedOsNumber(null);
      navigate('/service-orders');
    } catch {
      // Erro já tratado em performSave
    } finally {
      setSaving(false);
    }
  };

  // Emitir NFC-e ou NF-e e retornar cupom/PDF (chamado pelo ReceiptModal)
  const handleGenerateInvoice = async (modelo: 55 | 65, options?: { includeDocument?: boolean }): Promise<{ pdfBase64?: string; invoice?: import('../../services/api/invoices').Invoice } | null> => {
    if (!pendingPayload) return null;
    const os = await performSave(pendingPayload);
    if (!os?.id) return null;
    const inv = await invoicesService.generateFromServiceOrder(
      String(os.id), true, modelo, undefined, options?.includeDocument ?? false
    );
    return { pdfBase64: inv.pdf_base64 ?? undefined, invoice: inv };
  };

  const validateAndSubmit = async () => {
    setErrors({});

    // Validação com Zod
    const result = serviceOrderSchema.safeParse(formData);
    if (!result.success) {
      try {
        const zodErrors = formatZodErrors(result.error);
        const firstError = result.error?.issues?.[0]?.message || 'Verifique os campos obrigatórios';
        setErrors({ ...zodErrors, form: firstError });
        showError('Campos obrigatórios', firstError);
      } catch (err) {
        const msg = result.error?.issues?.[0]?.message || 'Verifique os campos obrigatórios';
        setErrors({ form: msg });
        showError('Campos obrigatórios', msg);
      }
      return;
    }

    // Validações customizadas da OS
    const hasFrames = formData.frames.length > 0;
    const hasLab = formData.laboratory_ids.length > 0;
    const hasLabProducts = formData.laboratory_lenses.length > 0;
    const priceNum = formData.price ? parseFloat(parseCurrency(formData.price)) : 0;
    const hasPaymentSingle = !formData.use_partial_payments && !!formData.payment_method;
    const hasPaymentPartial = formData.use_partial_payments && formData.partial_payments.some(
      p => p.payment_method && p.amount && parseFloat(parseCurrency(p.amount)) > 0
    );
    const partialSumValid = formData.use_partial_payments && formData.partial_payments.length > 0
      ? Math.abs(formData.partial_payments.reduce((s, p) => s + (p.amount ? parseFloat(parseCurrency(p.amount)) : 0), 0) - priceNum) < 0.01
      : false;

    const isWarranty = !!formData.warranty;

    const customErrors: Record<string, string> = {};
    if (hasLab && !hasLabProducts) {
      customErrors.laboratory_lenses = 'Se laboratório selecionado, informe ao menos um produto de laboratório.';
    } else if (!hasFrames && !(hasLab && hasLabProducts)) {
      customErrors.frames = 'Selecione ao menos uma armação OU um laboratório com produto de laboratório.';
    }
    if (hasLab && hasLabProducts && !String(formData.expected_pickup_date || '').trim()) {
      customErrors.expected_pickup_date = 'Informe a data de retirada (previsão no recibo para o cliente).';
    }
    if (!isWarranty && priceNum <= 0) {
      customErrors.price = 'Preço é obrigatório.';
    }
    if (formData.expected_pickup_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pickDate = new Date(formData.expected_pickup_date);
      pickDate.setHours(0, 0, 0, 0);
      if (pickDate < today) {
        customErrors.expected_pickup_date = 'A data de previsão de entrega não pode ser anterior a hoje.';
      }
    }
    if (!hasFrames && hasLab && hasLabProducts && !formData.rim_use) {
      customErrors.rim_use = 'Quando não há armação mas há laboratório e lente, o aro de uso é obrigatório.';
    }
    if (!isWarranty && !hasPaymentSingle && !(formData.use_partial_payments && hasPaymentPartial && partialSumValid)) {
      customErrors.payment_method = 'Forma de pagamento é obrigatória.';
    }
    if (Object.keys(customErrors).length > 0) {
      const firstMsg = Object.values(customErrors)[0] || 'Verifique os campos obrigatórios.';
      setErrors({ ...customErrors, form: firstMsg });
      showError('Campos obrigatórios', firstMsg);
      return;
    }

    const payload: any = {
      client_id: parseInt(formData.client_id),
      store_id: parseInt(formData.store_id),
      user_id: parseInt(formData.user_id),
      laboratory_id: formData.send_to_lab && formData.laboratory_ids.length > 0
        ? parseInt(formData.laboratory_ids[0])
        : null,
      expected_pickup_date: formData.expected_pickup_date || null,
      // Longe - OD
      far_od_spherical: parseNumericField(formData.far_od_spherical),
      far_od_cylindrical: parseNumericField(formData.far_od_cylindrical),
      far_od_axis: formData.far_od_axis || null,
      // Longe - OE
      far_oe_spherical: parseNumericField(formData.far_oe_spherical),
      far_oe_cylindrical: parseNumericField(formData.far_oe_cylindrical),
      far_oe_axis: formData.far_oe_axis || null,
      // Perto - OD
      near_od_spherical: parseNumericField(formData.near_od_spherical),
      near_od_cylindrical: parseNumericField(formData.near_od_cylindrical),
      near_od_axis: formData.near_od_axis || null,
      // Perto - OE
      near_oe_spherical: parseNumericField(formData.near_oe_spherical),
      near_oe_cylindrical: parseNumericField(formData.near_oe_cylindrical),
      near_oe_axis: formData.near_oe_axis || null,
      // Adição e DNP
      addition: parseNumericField(formData.addition),
      far_dnp: formData.far_dnp || null,
      near_dnp: formData.near_dnp || null,
      // Armação
      frame_code: formData.frame_code || null,
      rim_use: formData.rim_use ? parseInt(formData.rim_use) : null,
      warranty: formData.warranty ? parseInt(formData.warranty) : null,
      // Tipos de lente
      single_vision: formData.single_vision,
      bifocal: formData.bifocal,
      multifocal: formData.multifocal,
      anti_reflective: formData.anti_reflective,
      transitions: formData.transitions,
      frame_included: formData.frame_included,
      tinting: formData.tinting,
      // Valores
      price: formData.price ? parseFloat(parseCurrency(formData.price)) : 0,
      payment_method: formData.use_partial_payments ? null : (formData.payment_method || null),
      installments: formData.use_partial_payments ? null : (formData.payment_method === 'credit_card' && formData.installments 
        ? parseInt(formData.installments) 
        : null),
      notes: formData.notes || null,
      verified: formData.verified,
      // Many-to-many
      laboratory_lenses: formData.send_to_lab ? formData.laboratory_lenses.map(id => parseInt(id)) : [],
      frames: formData.frames.map(id => parseInt(id)),
      lenses: formData.lenses.map(id => parseInt(id)),
      // Pagamentos parciais/mistos. Com pagamento único enviar [] para o backend apagar linhas em service_order_payments
      // (omitir `payments` deixava as parcelas antigas no banco e a OS continuava “parcial”).
      payments: formData.use_partial_payments
        ? formData.partial_payments
            .filter(p => p.payment_method && p.amount)
            .map(p => ({
              payment_method: p.payment_method as any,
              amount: parseFloat(parseCurrency(p.amount)),
              installments: p.payment_method === 'credit_card' && p.installments ? parseInt(p.installments) : null,
            }))
        : [],
    };

    if (isEditMode && loadedOrder?.status === 'completed' && !hasSuperAdminRole) {
      delete payload.payment_method;
      delete payload.installments;
      delete payload.payments;
      delete payload.price;
    }

    // No modo de criação (sem laboratório), mostrar modal de recibo antes de salvar
    if (isCreateMode && !formData.send_to_lab) {
      // Gerar número da OS provisório (será substituído pelo real após salvar)
      const provisionalOsNumber = Date.now() % 10000;
      setCreatedOsNumber(provisionalOsNumber);
      setPendingPayload(payload);
      setShowReceiptModal(true);
      return;
    }

    // No modo de criação (com laboratório), salvar primeiro para exibir o nº real da OS no comprovante
    if (isCreateMode && formData.send_to_lab) {
      setSaving(true);
      try {
        const createdOrder = await performSave(payload);
        const realOsNumber = createdOrder?.os_number ?? createdOrder?.id;
        if (realOsNumber) {
          setPendingPayload(null);
          setCreatedOsNumber(realOsNumber);
          setShowEntryReceiptModal(true);
        } else {
          navigate('/service-orders/lab');
        }
      } catch {
        // Erro já tratado em performSave
      } finally {
        setSaving(false);
      }
      return;
    }

    // Modo de edição: salvar direto
    setSaving(true);
    try {
      await performSave(payload);
      navigate('/service-orders');
    } catch {
      // Erro já tratado em performSave
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateAndSubmit();
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const clientsList = Array.isArray(clients) ? clients : [];
  // Incluir cliente da OS nas opções quando carregado (edição/visualização) ou cliente preselecionado da URL (Nova OS a partir do cliente)
  const clientSelectOptions = useMemo(() => {
    const opts = clientsList.map((c) => ({ value: String(c.id), label: c.name }));
    if (formData.client_id && loadedOrder?.client && !opts.some((o) => o.value === formData.client_id)) {
      opts.push({
        value: String(loadedOrder.client.id),
        label: loadedOrder.client.name || `Cliente #${loadedOrder.client.id}`,
      });
    }
    if (formData.client_id && preselectedClientData && String(preselectedClientData.id) === formData.client_id && !opts.some((o) => o.value === formData.client_id)) {
      opts.push({
        value: String(preselectedClientData.id),
        label: preselectedClientData.name || `Cliente #${preselectedClientData.id}`,
      });
    }
    return opts;
  }, [clientsList, formData.client_id, loadedOrder?.client, preselectedClientData]);
  const laboratoriesList = Array.isArray(laboratories) ? laboratories : [];
  const laboratoryLensesList = Array.isArray(laboratoryLenses) ? laboratoryLenses : [];

  /** Opções do multiselect de laboratórios: inclui labs selecionados mesmo se não estiverem na lista (ex.: catálogo antigo). */
  const laboratorySelectOptions = useMemo(() => {
    const base = laboratoriesList.map((lab) => ({ value: String(lab.id), label: lab.name }));
    const byVal = new Map(base.map((o) => [o.value, o]));
    for (const labId of formData.laboratory_ids) {
      if (!byVal.has(labId)) {
        const fromLens = toArray(loadedOrder?.laboratory_lenses).find(
          (l: any) => String(l.laboratory_id) === labId
        );
        const name =
          fromLens?.laboratory?.name ||
          (loadedOrder?.laboratory?.id === Number(labId) ? loadedOrder.laboratory?.name : null) ||
          `Laboratório #${labId}`;
        byVal.set(labId, { value: labId, label: name });
      }
    }
    return Array.from(byVal.values());
  }, [laboratoriesList, formData.laboratory_ids, loadedOrder?.laboratory_lenses, loadedOrder?.laboratory]);

  /** API antiga sem laboratory_id nos produtos: enriquecer laboratórios a partir do catálogo carregado. */
  useEffect(() => {
    if (!loadedOrder?.id || laboratoryLensesList.length === 0) return;
    const fromApi = toArray(loadedOrder.laboratory_lenses);
    if (fromApi.some((l: any) => l.laboratory_id != null && l.laboratory_id !== '')) return;
    const extra = new Set<string>();
    for (const row of fromApi) {
      const ll = laboratoryLensesList.find((x) => String(x.id) === String((row as any).id));
      if (ll?.laboratory_id != null) extra.add(String(ll.laboratory_id));
    }
    if (extra.size === 0) return;
    setFormData((prev) => {
      const merged = [...new Set([...prev.laboratory_ids, ...extra])];
      if (merged.length === prev.laboratory_ids.length) return prev;
      return {
        ...prev,
        laboratory_ids: merged,
        laboratory_id: merged[0] || prev.laboratory_id,
        send_to_lab: merged.length > 0,
      };
    });
  }, [loadedOrder?.id, laboratoryLensesList, loadedOrder?.laboratory_lenses]);
  // Incluir armações da OS carregada (ex.: vindas do PDV) e seleções fora da página atual da busca
  const framesList = React.useMemo(() => {
    const fromApi = Array.isArray(frames) ? frames : [];
    const fromOrder = toArray(loadedOrder?.frames) || [];
    const ids = new Set(fromApi.map((f: { id: number }) => f.id));
    const extraFromOrder = fromOrder.filter((f: { id?: number }) => f?.id && !ids.has(f.id));
    const merged = [...fromApi, ...extraFromOrder];
    const mergedIds = new Set(merged.map((f: { id: number }) => f.id));
    const selectedIds = (formData.frames || []).map(Number).filter(Boolean);
    const extrasSelected: Frame[] = [];
    selectedIds.forEach((fid) => {
      if (!mergedIds.has(fid)) {
        const cached = framesByIdRef.current.get(fid);
        if (cached) extrasSelected.push(cached);
      }
    });
    return [...merged, ...extrasSelected];
  }, [frames, loadedOrder?.frames, formData.frames]);
  const lensesList = Array.isArray(lenses) ? lenses : [];

  // Filtrar laboratoryLenses pelo laboratório selecionado
  const filteredLaboratoryLenses = formData.laboratory_ids.length > 0
    ? laboratoryLensesList.filter(l => formData.laboratory_ids.includes(String(l.laboratory_id)))
    : laboratoryLensesList;

  // Aro de uso é obrigatório quando: sem armação + tem laboratório + tem produto de laboratório
  const rimUseRequired = !formData.frames?.length && formData.laboratory_ids.length > 0 && formData.laboratory_lenses?.length > 0;
  const paymentAndPriceLocked =
    isEditMode && loadedOrder?.status === 'completed' && !hasSuperAdminRole;

  // Mostrar loading enquanto carrega OS ou dados auxiliares (no modo view/edit)
  if (loading || (id && auxiliaryDataLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/service-orders')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              {isViewMode ? 'Detalhes da OS' : isEditMode ? 'Editar OS' : 'Nova Ordem de Serviço'}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {isViewMode ? 'Visualize os dados da OS' : isEditMode ? 'Atualize os dados da OS' : 'Cadastre uma nova ordem de serviço'}
            </p>
            {isCreateMode && formData.store_id && (
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                {nextOsPreviewLoading ? (
                  <span className="text-slate-500">Consultando próximo número da OS nesta loja…</span>
                ) : nextOsPreview != null ? (
                  <>
                    Esta OS será criada como{' '}
                    <span className="font-black text-slate-900 tabular-nums">
                      #{String(nextOsPreview).padStart(4, '0')}
                    </span>
                    <span className="text-slate-500 font-normal">
                      {' '}
                      (próximo da sequência da loja; se outra OS for salva antes, o número pode ser o seguinte).
                    </span>
                  </>
                ) : null}
              </p>
            )}
          </div>
        </div>
        {/* Botões no cabeçalho */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/service-orders')}
          >
            <ArrowLeft size={18} /> Voltar
          </Button>
          {isViewMode && !isOtherStoreOrder && (
            <Button 
              type="button" 
              onClick={() => navigate(`/service-orders/${id}/edit`)}
            >
              <Edit size={18} /> Editar
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={isViewMode || isOtherStoreOrder} className={isViewMode ? '' : 'disabled:opacity-70'}>
        <Card className="p-8">
          {errors.form && (
            <div ref={errorBannerRef} className="mb-6 border-2 border-red-300 rounded-xl p-4 bg-red-50 shadow-sm" role="alert">
              <p className="text-sm font-bold text-red-700">{errors.form}</p>
              <p className="text-xs text-red-600 mt-1">Corrija os campos abaixo e tente novamente.</p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
              <FileText size={28} style={{ color: 'var(--store-color)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Dados do Pedido (OS{isCreateMode && nextOsPreview != null ? ` #${String(nextOsPreview).padStart(4, '0')}` : ''})
              </h2>
              <p className="text-sm text-slate-500">Utilize esta tela para cadastrar/atualizar os dados</p>
            </div>
          </div>

          {/* Dados principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <SingleSelect
                label="Cliente *"
                value={formData.client_id}
                onChange={(val) => handleFieldChange('client_id', val)}
                options={clientSelectOptions}
                placeholder="Buscar cliente..."
                searchable
                onSearch={setClientSearch}
                error={errors.client_id}
                disabled={isViewMode}
              />
            </div>
            <div>
              <SingleSelect
                label="Ótica *"
                value={formData.store_id}
                onChange={(val) => handleFieldChange('store_id', val)}
                options={availableStores.map((store) => ({ 
                  value: String(store.id), 
                  label: store.name 
                }))}
                placeholder="Selecione a ótica"
                error={errors.store_id}
                disabled={isViewMode || (isEditMode && !hasSuperAdminRole)}
              />
            </div>
            <div>
              <Input
                label="Registrado por"
                value={user?.name || ''}
                disabled
              />
            </div>
          </div>

          {/* Longe */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Longe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Olho direito */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Olho direito</h4>
                <div className="grid grid-cols-3 gap-4">
                  <NumberInput
                    label="Esférico"
                    placeholder="0,00"
                    value={formData.far_od_spherical}
                    onChange={(val) => handleFieldChange('far_od_spherical', val)}
                    onBlur={(val) => handleFieldChange('far_od_spherical', formatDegree(val))}
                    min={-30}
                    max={30}
                    step={0.25}
                  />
                  <NumberInput
                    label="Cilíndrico"
                    placeholder="-0,00"
                    value={formData.far_od_cylindrical}
                    onChange={(val) => handleFieldChange('far_od_cylindrical', val)}
                    onBlur={(val) => handleFieldChange('far_od_cylindrical', formatCylindrical(val))}
                    min={-10}
                    max={10}
                    step={0.25}
                  />
                  <NumberInput
                    label="Eixo"
                    placeholder="0"
                    value={formData.far_od_axis}
                    onChange={(val) => handleFieldChange('far_od_axis', val)}
                    onBlur={(val) => handleFieldChange('far_od_axis', formatAxis(val))}
                    min={0}
                    max={180}
                    step={1}
                  />
                </div>
              </div>
              {/* Olho esquerdo */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Olho esquerdo</h4>
                <div className="grid grid-cols-3 gap-4">
                  <NumberInput
                    label="Esférico"
                    placeholder="0,00"
                    value={formData.far_oe_spherical}
                    onChange={(val) => handleFieldChange('far_oe_spherical', val)}
                    onBlur={(val) => handleFieldChange('far_oe_spherical', formatDegree(val))}
                    min={-30}
                    max={30}
                    step={0.25}
                  />
                  <NumberInput
                    label="Cilíndrico"
                    placeholder="-0,00"
                    value={formData.far_oe_cylindrical}
                    onChange={(val) => handleFieldChange('far_oe_cylindrical', val)}
                    onBlur={(val) => handleFieldChange('far_oe_cylindrical', formatCylindrical(val))}
                    min={-10}
                    max={10}
                    step={0.25}
                  />
                  <NumberInput
                    label="Eixo"
                    placeholder="0"
                    value={formData.far_oe_axis}
                    onChange={(val) => handleFieldChange('far_oe_axis', val)}
                    onBlur={(val) => handleFieldChange('far_oe_axis', formatAxis(val))}
                    min={0}
                    max={180}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Perto */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Perto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Olho direito */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Olho direito</h4>
                <div className="grid grid-cols-3 gap-4">
                  <NumberInput
                    label="Esférico"
                    placeholder="0,00"
                    value={formData.near_od_spherical}
                    onChange={(val) => handleFieldChange('near_od_spherical', val)}
                    onBlur={(val) => handleFieldChange('near_od_spherical', formatDegree(val))}
                    min={-30}
                    max={30}
                    step={0.25}
                  />
                  <NumberInput
                    label="Cilíndrico"
                    placeholder="-0,00"
                    value={formData.near_od_cylindrical}
                    onChange={(val) => handleFieldChange('near_od_cylindrical', val)}
                    onBlur={(val) => handleFieldChange('near_od_cylindrical', formatCylindrical(val))}
                    min={-10}
                    max={10}
                    step={0.25}
                  />
                  <NumberInput
                    label="Eixo"
                    placeholder="0"
                    value={formData.near_od_axis}
                    onChange={(val) => handleFieldChange('near_od_axis', val)}
                    onBlur={(val) => handleFieldChange('near_od_axis', formatAxis(val))}
                    min={0}
                    max={180}
                    step={1}
                  />
                </div>
              </div>
              {/* Olho esquerdo */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Olho esquerdo</h4>
                <div className="grid grid-cols-3 gap-4">
                  <NumberInput
                    label="Esférico"
                    placeholder="0,00"
                    value={formData.near_oe_spherical}
                    onChange={(val) => handleFieldChange('near_oe_spherical', val)}
                    onBlur={(val) => handleFieldChange('near_oe_spherical', formatDegree(val))}
                    min={-30}
                    max={30}
                    step={0.25}
                  />
                  <NumberInput
                    label="Cilíndrico"
                    placeholder="-0,00"
                    value={formData.near_oe_cylindrical}
                    onChange={(val) => handleFieldChange('near_oe_cylindrical', val)}
                    onBlur={(val) => handleFieldChange('near_oe_cylindrical', formatCylindrical(val))}
                    min={-10}
                    max={10}
                    step={0.25}
                  />
                  <NumberInput
                    label="Eixo"
                    placeholder="0"
                    value={formData.near_oe_axis}
                    onChange={(val) => handleFieldChange('near_oe_axis', val)}
                    onBlur={(val) => handleFieldChange('near_oe_axis', formatAxis(val))}
                    min={0}
                    max={180}
                    step={1}
                  />
                </div>
              </div>
            </div>
            {/* Adição */}
            <div className="mt-4 max-w-[200px]">
              <NumberInput
                label="Adição"
                placeholder="0,00"
                value={formData.addition}
                onChange={(val) => handleFieldChange('addition', val)}
                onBlur={(val) => handleFieldChange('addition', formatAddition(val))}
                min={0}
                max={4}
                step={0.25}
              />
            </div>
          </div>

          {/* DNP */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">DNP</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Longe"
                placeholder="00,00/00,00"
                value={formData.far_dnp}
                onChange={(e) => handleFieldChange('far_dnp', filterDNPInput(e.target.value))}
                maxLength={11}
              />
              <Input
                label="Perto"
                placeholder="00,00/00,00"
                value={formData.near_dnp}
                onChange={(e) => handleFieldChange('near_dnp', filterDNPInput(e.target.value))}
                maxLength={11}
              />
            </div>
          </div>

          {/* Tipos de lente */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recomenda-se o uso de lentes</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'frame_included', label: 'Armação' },
                { key: 'single_vision', label: 'Visão simples' },
                { key: 'anti_reflective', label: 'Anti-Reflexo' },
                { key: 'multifocal', label: 'Multifocais' },
                { key: 'bifocal', label: 'Bifocais' },
                { key: 'transitions', label: 'Transitions' },
                { key: 'tinting', label: 'Coloração' },
              ].map(({ key, label }) => (
                <label key={key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(e) => handleFieldChange(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div 
                      className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Armações (ou laboratório com produtos) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MultiSelect
              label="Armações"
              value={formData.frames}
              onChange={(vals) => handleFieldChange('frames', vals)}
              options={framesList.map((frame) => ({
                value: String(frame.id),
                label: `${frame.code ?? ''} - ${frame.description ?? ''}`,
              }))}
              placeholder="Buscar por código ou nome..."
              searchable
              serverSideSearch
              onSearchQueryChange={onFrameSearchQueryChange}
              disabled={isViewMode}
              error={errors.frames}
            />
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none mt-7">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={!!formData.rim_use}
                    onChange={(e) => handleFieldChange('rim_use', e.target.checked ? '1' : '')}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                  />
                </div>
                <span className="text-sm font-medium text-slate-600">
                  Aro de uso
                  {rimUseRequired && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </label>
            </div>
          </div>

          {/* Laboratório - sempre visível para teste */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Laboratórios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <MultiSelect
                  label="Laboratórios"
                  value={formData.laboratory_ids}
                  onChange={(vals) => {
                    setFormData(prev => ({
                      ...prev,
                      laboratory_ids: vals,
                      // Mantém compatibilidade com backend atual (laboratório principal = primeiro selecionado)
                      laboratory_id: vals.length > 0 ? vals[0] : '',
                      laboratory_lenses: prev.laboratory_lenses.filter((lensId) =>
                        laboratoryLensesList.some(
                          lens => String(lens.id) === lensId && vals.includes(String(lens.laboratory_id))
                        )
                      ),
                      expected_pickup_date: vals.length === 0 ? '' : prev.expected_pickup_date,
                      send_to_lab: vals.length > 0,
                    }));
                  }}
                  options={laboratorySelectOptions}
                  placeholder="Selecione os laboratórios..."
                  searchable
                  disabled={isViewMode}
                />
                {formData.laboratory_ids.length > 0 && formData.laboratory_lenses.length > 0 && (() => {
                  const selectedLenses = formData.laboratory_lenses
                    .map(lid => filteredLaboratoryLenses.find(l => String(l.id) === lid))
                    .filter(Boolean) as { delivery_days?: number | string | null }[];
                  const maxDaysFromProducts = selectedLenses.reduce((max, l) => {
                    const rawDays = l?.delivery_days;
                    const parsedDays = typeof rawDays === 'string' ? parseInt(rawDays, 10) : rawDays;
                    const days = Number.isFinite(parsedDays) ? Number(parsedDays) : null;
                    if (days == null || days < 0) return max;
                    return days > (max ?? -1) ? days : max;
                  }, null as number | null);
                  // Sem prazo no cadastro do produto: mantém a linha de previsão (ex.: 3 dias úteis), campo pode ficar vazio até o vendedor preencher ou clicar em sugerida
                  const businessDaysForPreview =
                    maxDaysFromProducts != null && maxDaysFromProducts > 0 ? maxDaysFromProducts : 3;
                  
                  // Função para adicionar dias úteis
                  const addBusinessDays = (date: Date, days: number): Date => {
                    const result = new Date(date);
                    let added = 0;
                    while (added < days) {
                      result.setDate(result.getDate() + 1);
                      const dow = result.getDay();
                      if (dow !== 0 && dow !== 6) added++;
                    }
                    return result;
                  };
                  
                  const suggestedDate = addBusinessDays(new Date(), businessDaysForPreview);
                  
                  const formatDateForInput = (date: Date): string => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  const todayStr = formatDateForInput(new Date());
                  const suggestedDateStr = formatDateForInput(suggestedDate);
                  
                  return (
                    <div className="mt-4">
                      <Input
                        label="Data de retirada"
                        type="date"
                        value={formData.expected_pickup_date}
                        onChange={(e) => handleFieldChange('expected_pickup_date', e.target.value)}
                        disabled={isViewMode}
                        min={todayStr}
                        error={errors.expected_pickup_date}
                      />
                      <p className="mt-1 text-xs text-slate-500">Data que o vendedor informa ao cliente para retirar a OS. Esta data será exibida como "Previsão de entrega" no recibo.</p>
                      <div className="mt-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--store-color)' }}>
                          Previsão: {businessDaysForPreview}{' '}
                          {businessDaysForPreview === 1 ? 'dia útil' : 'dias úteis'} – {formatIsoDatePtBr(suggestedDateStr)}
                        </p>
                        {!formData.expected_pickup_date && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('expected_pickup_date', suggestedDateStr)}
                            className="mt-2 text-xs text-[var(--store-color)] hover:underline font-medium"
                            disabled={isViewMode}
                          >
                            Usar esta data sugerida
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                    Produtos do Laboratório
                  </label>
                  {formData.laboratory_lenses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLabProductValues((v) => !v)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                      title={showLabProductValues ? 'Ocultar valores' : 'Ver valores'}
                    >
                      {showLabProductValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
                <MultiSelect
                  label=""
                  value={formData.laboratory_lenses}
                  onChange={(vals) => handleFieldChange('laboratory_lenses', vals)}
                  error={errors.laboratory_lenses}
                  options={(() => {
                    const laboratoryNamesById: Record<string, string> = {};
                    laboratoriesList.forEach((lab) => {
                      laboratoryNamesById[String(lab.id)] = lab.name;
                    });
                    const snapshotLabels: Record<string, { label: string; selectedLabel: string }> = {};
                    if (orderLaboratoryLensesSnapshot?.length) {
                      orderLaboratoryLensesSnapshot.forEach((lens) => {
                        const lensWithLab = laboratoryLensesList.find(l => String(l.id) === String(lens.id));
                        const labName = lensWithLab
                          ? (laboratoryNamesById[String(lensWithLab.laboratory_id)] || lensWithLab.laboratory?.name || 'Laboratório')
                          : (lens.laboratory?.name
                            || (lens.laboratory_id != null ? laboratoryNamesById[String(lens.laboratory_id)] : undefined)
                            || 'Laboratório');
                        const costAtSale = lens.cost_price_at_sale ?? lens.cost_price;
                        const showLabInDropdown = formData.laboratory_ids.length > 1;
                        const fullSelected = `${lens.name} (R$ ${formatFromNumber(costAtSale)}) - ${labName}`;
                        snapshotLabels[String(lens.id)] = {
                          label: showLabInDropdown ? `${lens.name} - ${labName}` : lens.name,
                          selectedLabel: showLabProductValues ? fullSelected : `${lens.name} (***)${showLabInDropdown ? ` - ${labName}` : ''}`,
                        };
                      });
                    }
                    if (isViewMode && orderLaboratoryLensesSnapshot && orderLaboratoryLensesSnapshot.length > 0) {
                      return orderLaboratoryLensesSnapshot.map((lens) => {
                        const lensWithLab = laboratoryLensesList.find(l => String(l.id) === String(lens.id));
                        const labName = lensWithLab
                          ? (laboratoryNamesById[String(lensWithLab.laboratory_id)] || (lensWithLab as any).laboratory?.name || 'Laboratório')
                          : (lens.laboratory?.name
                            || (lens.laboratory_id != null ? laboratoryNamesById[String(lens.laboratory_id)] : undefined)
                            || 'Laboratório');
                        const showLabInDropdown = formData.laboratory_ids.length > 1;
                        const fullSelected = `${lens.name} (R$ ${formatFromNumber(lens.cost_price_at_sale ?? lens.cost_price)})${showLabInDropdown ? ` - ${labName}` : ''}`;
                        return {
                          value: String(lens.id),
                          label: snapshotLabels[String(lens.id)]?.label ?? lens.name,
                          selectedLabel: showLabProductValues ? fullSelected : `${lens.name} (***)${showLabInDropdown ? ` - ${labName}` : ''}`,
                        };
                      });
                    }
                    const showLabInDropdown = formData.laboratory_ids.length > 1;
                    return filteredLaboratoryLenses.map((lens) => {
                      const labName = laboratoryNamesById[String(lens.laboratory_id)] || lens.laboratory?.name || 'Laboratório';
                      const valueToShow = lens.promotion_active && lens.promotional_cost_price != null
                        ? lens.promotional_cost_price
                        : lens.cost_price;
                      const fullSelected = `${lens.name} (R$ ${formatFromNumber(valueToShow)})${showLabInDropdown ? ` - ${labName}` : ''}`;
                      return {
                        value: String(lens.id),
                        label: showLabInDropdown ? `${lens.name} - ${labName}` : lens.name,
                        selectedLabel: showLabProductValues ? fullSelected : `${lens.name} (***)${showLabInDropdown ? ` - ${labName}` : ''}`,
                      };
                    });
                  })()}
                  placeholder="Selecione produtos..."
                  disabled={isViewMode || formData.laboratory_ids.length === 0}
                  disabledMessage={isViewMode ? undefined : "Selecione ao menos um laboratório"}
                  searchable
                />
              </div>
            </div>
          </div>

          {/* Preço e Pagamento */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Preço e Pagamento</h3>
            {paymentAndPriceLocked && (
              <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                <p className="text-sm text-amber-900 font-medium">
                  Esta OS está finalizada. Preço e formas de pagamento não podem ser alterados. Apenas superadmin pode editar esses campos.
                </p>
              </div>
            )}
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-6">
                <div className="w-48">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Preço {!!formData.warranty ? <span className="text-slate-400 normal-case font-normal text-[9px]">(opcional na garantia)</span> : <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={formData.price}
                      onChange={(e) => {
                        if (isOtherStoreOrder || paymentAndPriceLocked) return;
                        const formatted = formatCurrency(e.target.value);
                        handleFieldChange('price', formatted);
                      }}
                      disabled={isOtherStoreOrder || paymentAndPriceLocked}
                      readOnly={isOtherStoreOrder || paymentAndPriceLocked}
                      className={`w-full pl-12 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${(isOtherStoreOrder || paymentAndPriceLocked) ? 'bg-slate-100 cursor-not-allowed border-slate-200' : ''} ${errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-[var(--store-color-opacity-5)]'}`}
                    />
                  </div>
                  {errors.price && <p className="text-xs text-red-500 font-medium mt-1">{errors.price}</p>}
                </div>
                <label className={`inline-flex items-center gap-2 select-none pb-3 ${(isOtherStoreOrder || paymentAndPriceLocked) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.use_partial_payments}
                      disabled={isOtherStoreOrder || paymentAndPriceLocked}
                      onChange={(e) => {
                        if (isOtherStoreOrder || paymentAndPriceLocked) return;
                        const totalPrice = formData.price ? parseFloat(parseCurrency(formData.price)) : 0;
                        setFormData(prev => ({
                          ...prev,
                          use_partial_payments: e.target.checked,
                          payment_method: e.target.checked ? '' : prev.payment_method,
                          partial_payments: e.target.checked && prev.partial_payments.length === 0
                            ? [{
                                payment_method: '',
                                amount: totalPrice > 0 ? totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',') : '',
                                installments: '1',
                              }]
                            : e.target.checked ? prev.partial_payments : [],
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div 
                      className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Pagamento parcial/misto</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none pb-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!formData.warranty}
                      onChange={(e) => handleFieldChange('warranty', e.target.checked ? '1' : '')}
                      className="sr-only peer"
                    />
                    <div 
                      className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Garantia</span>
                </label>
              </div>

              {!formData.use_partial_payments ? (
                // Pagamento único (modo tradicional)
                <div className="flex flex-wrap items-end gap-6">
                  <div className="w-48">
                    <SingleSelect
                      label={!!formData.warranty ? 'Forma de Pagamento' : 'Forma de Pagamento *'}
                      value={formData.payment_method}
                      onChange={(val) => {
                        setFormData(prev => ({
                          ...prev,
                          payment_method: val,
                          installments: val === 'credit_card' ? prev.installments : '1',
                        }));
                        if (errors.payment_method) {
                          setErrors({ ...errors, payment_method: '' });
                        }
                      }}
                      options={paymentOptions}
                      placeholder="Selecione..."
                      error={errors.payment_method}
                      disabled={isViewMode || isOtherStoreOrder || paymentAndPriceLocked}
                    />
                  </div>
                  {formData.payment_method === 'credit_card' && (
                    <div className="w-32">
                      <SingleSelect
                        label="Parcelas"
                        value={formData.installments}
                        onChange={(val) => handleFieldChange('installments', val)}
                        options={[
                          { value: '1', label: '1x' },
                          { value: '2', label: '2x' },
                          { value: '3', label: '3x' },
                          { value: '4', label: '4x' },
                          { value: '5', label: '5x' },
                          { value: '6', label: '6x' },
                          { value: '7', label: '7x' },
                          { value: '8', label: '8x' },
                          { value: '9', label: '9x' },
                          { value: '10', label: '10x' },
                          { value: '11', label: '11x' },
                          { value: '12', label: '12x' },
                        ]}
                        placeholder="1x"
                        disabled={isViewMode || isOtherStoreOrder || paymentAndPriceLocked}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Pagamentos parciais/mistos
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl ${
                      isOtherStoreOrder
                        ? 'bg-slate-100/50'
                        : paymentAndPriceLocked
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        isOtherStoreOrder ? 'text-slate-600' : paymentAndPriceLocked ? 'text-amber-900' : 'text-blue-800'
                      }`}
                    >
                      {isOtherStoreOrder
                        ? 'Somente visualização'
                        : paymentAndPriceLocked
                          ? 'Preço e pagamentos desta OS finalizada não podem ser alterados.'
                          : '💡 Adicione múltiplas formas de pagamento. A soma deve ser igual ao valor total.'}
                    </p>
                  </div>
                  {formData.partial_payments.map((payment, index) => {
                    const totalPaid = formData.partial_payments.reduce((sum, p) => {
                      const amount = p.amount ? parseFloat(parseCurrency(p.amount)) : 0;
                      return sum + (isNaN(amount) ? 0 : amount);
                    }, 0);
                    const totalPrice = formData.price ? parseFloat(parseCurrency(formData.price)) : 0;
                    const remaining = totalPrice - totalPaid + (payment.amount ? parseFloat(parseCurrency(payment.amount)) : 0);
                    
                    return (
                      <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex flex-wrap items-end gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <SingleSelect
                              label={`Pagamento ${index + 1}`}
                              value={payment.payment_method}
                              onChange={(val) => {
                                const newPayments = [...formData.partial_payments];
                                newPayments[index] = {
                                  ...newPayments[index],
                                  payment_method: val,
                                  installments: val === 'credit_card' ? newPayments[index].installments : '1',
                                };
                                setFormData({ ...formData, partial_payments: newPayments });
                              }}
                              options={[
                                { value: 'credit_card', label: 'Cartão de Crédito' },
                                { value: 'debit_card', label: 'Cartão de Débito' },
                                { value: 'cash', label: 'Dinheiro' },
                                { value: 'pix', label: 'PIX' },
                                { value: 'permuta', label: 'Permuta' },
                              ]}
                              placeholder="Selecione..."
                              disabled={isViewMode || isOtherStoreOrder || paymentAndPriceLocked}
                            />
                          </div>
                          <div className="w-40">
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                              Valor *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                R$
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={isOtherStoreOrder ? 'Indisponível' : '0,00'}
                                value={isOtherStoreOrder ? '' : payment.amount}
                                onChange={(e) => {
                                  if (isOtherStoreOrder || paymentAndPriceLocked) return;
                                  const formatted = formatCurrency(e.target.value);
                                  const newPayments = [...formData.partial_payments];
                                  newPayments[index] = { ...newPayments[index], amount: formatted };
                                  setFormData({ ...formData, partial_payments: newPayments });
                                }}
                                className={`w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)] ${(isOtherStoreOrder || paymentAndPriceLocked) ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                disabled={isViewMode || isOtherStoreOrder || paymentAndPriceLocked}
                              />
                            </div>
                            {remaining >= 0 && (
                              <p className="mt-1 text-xs text-slate-500">
                                Restante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}
                              </p>
                            )}
                          </div>
                          {payment.payment_method === 'credit_card' && (
                            <div className="w-28">
                              <SingleSelect
                                label="Parcelas"
                                value={payment.installments}
                                onChange={(val) => {
                                  const newPayments = [...formData.partial_payments];
                                  newPayments[index] = { ...newPayments[index], installments: val };
                                  setFormData({ ...formData, partial_payments: newPayments });
                                }}
                                options={[
                                  { value: '1', label: '1x' },
                                  { value: '2', label: '2x' },
                                  { value: '3', label: '3x' },
                                  { value: '4', label: '4x' },
                                  { value: '5', label: '5x' },
                                  { value: '6', label: '6x' },
                                  { value: '7', label: '7x' },
                                  { value: '8', label: '8x' },
                                  { value: '9', label: '9x' },
                                  { value: '10', label: '10x' },
                                  { value: '11', label: '11x' },
                                  { value: '12', label: '12x' },
                                ]}
                                placeholder="1x"
                                disabled={isViewMode || isOtherStoreOrder || paymentAndPriceLocked}
                              />
                            </div>
                          )}
                          {!isViewMode && !isOtherStoreOrder && !paymentAndPriceLocked && (
                            <button
                              type="button"
                              onClick={() => {
                                const newPayments = formData.partial_payments.filter((_, i) => i !== index);
                                setFormData({ ...formData, partial_payments: newPayments });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(() => {
                    const totalPaid = formData.partial_payments.reduce((sum, p) => {
                      const amount = p.amount ? parseFloat(parseCurrency(p.amount)) : 0;
                      return sum + (isNaN(amount) ? 0 : amount);
                    }, 0);
                    const totalPrice = formData.price ? parseFloat(parseCurrency(formData.price)) : 0;
                    const remaining = totalPrice - totalPaid;
                    const isValid = Math.abs(remaining) < 0.01;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">Total pago:</span>
                          <span className={`text-sm font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}
                          </span>
                        </div>
                        {!isValid && (
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ A soma dos pagamentos ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}) deve ser igual ao valor total ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)})
                          </p>
                        )}
                        {!isViewMode && !isOtherStoreOrder && !paymentAndPriceLocked && (
                          <Button
                            type="button"
                            variant="outline"
                      onClick={() => {
                        const remaining = totalPrice - totalPaid;
                        if (remaining > 0) {
                          const formattedRemaining = remaining.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).replace('.', ',');
                          setFormData({
                            ...formData,
                            partial_payments: [
                              ...formData.partial_payments,
                              {
                                payment_method: '',
                                amount: formattedRemaining,
                                installments: '1',
                              },
                            ],
                          });
                        }
                      }}
                            disabled={remaining <= 0 || isValid}
                            className="w-full"
                          >
                            <Plus size={16} /> Adicionar Pagamento
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="mb-8">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Observações gerais
            </label>
            <textarea
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)] transition-all resize-none"
              rows={4}
              placeholder="Observações..."
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />
          </div>

          {/* Botões dentro do card */}
          {!isViewMode && (
            <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/service-orders')}
                disabled={saving}
              >
                <ArrowLeft size={18} /> Voltar
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  void validateAndSubmit();
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
        </fieldset>
      </form>

      {/* NF-e: quando elegível (finalizada ou paga sem só "na retirada") ou já com nota */}
      {id && loadedOrder && (
        <NFeSection
          serviceOrder={loadedOrder}
          onEmitted={async () => {
            const order = await getServiceOrder(id);
            if (order) setLoadedOrder(order);
          }}
        />
      )}

      {/* Modal de Recibo */}
      {showReceiptModal && createdOsNumber && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setPendingPayload(null);
            setCreatedOsNumber(null);
          }}
          onConfirm={handleReceiptConfirm}
          receiptData={prepareReceiptData(createdOsNumber)}
          order={formData.client_id ? { id: 0, client_id: parseInt(formData.client_id), client: null } as any : null}
          loading={saving}
          onGenerateInvoice={handleGenerateInvoice}
          canGenerateInvoice={
            userHasAccessToStore(formData.store_id, user) &&
            canShowNfeOptionInReceiptModal({
              status: loadedOrder?.status ?? 'pending',
              price: formData.price ? parseFloat(parseCurrency(formData.price)) : 0,
              payment_method: formData.use_partial_payments ? null : formData.payment_method,
              payments: formData.use_partial_payments
                ? formData.partial_payments
                    .filter((p) => p.payment_method && p.amount)
                    .map((p) => ({ payment_method: p.payment_method }))
                : undefined,
              invoice_id: loadedOrder?.invoice_id,
              invoice: loadedOrder?.invoice,
              can_generate_invoice: loadedOrder?.can_generate_invoice,
            })
          }
        />
      )}

      {/* Modal de Comprovante de Entrada (para OS com laboratório) */}
      {showEntryReceiptModal && createdOsNumber && (
        <EntryReceiptModal
          isOpen={showEntryReceiptModal}
          onClose={() => handleEntryReceiptConfirm(false)}
          onConfirm={handleEntryReceiptConfirm}
          receiptData={prepareEntryReceiptData(createdOsNumber)}
          loading={saving}
        />
      )}
    </div>
  );
};
