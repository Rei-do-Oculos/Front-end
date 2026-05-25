import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useBackToList } from '../../hooks/useBackToList';
import { ArrowLeft, Loader2, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, Button, SingleSelect, Input } from '../../components/Common';
import { useServiceOrders } from '../../services/hooks/useServiceOrders';
import { useNotification } from '../../hooks/useNotification';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { parseMoneyBrInput } from '../../utils/formatters';
import { persistedPaymentsFromServiceOrder } from '../../utils/receiptPaymentsFromOrder';

export const ServiceOrderChangePayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { goBackToList } = useBackToList();
  const { showSuccess, showError } = useNotification();
  const { getServiceOrder, completeWithPayment } = useServiceOrders({ autoFetch: false });
  
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [usePartialPayments, setUsePartialPayments] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('');
  const [newInstallments, setNewInstallments] = useState<string>('1');
  type PartialPayRow = {
    id?: number;
    payment_method: string;
    amount: string;
    installments: string;
    /** Já quitado na criação da OS — não editar; mantém data no fluxo de caixa */
    locked: boolean;
    received_at?: string | null;
  };
  const [partialPayments, setPartialPayments] = useState<PartialPayRow[]>([]);
  /** Data do recebimento na retirada — padrão hoje, editável. */
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [pickupPaymentDate, setPickupPaymentDate] = useState(todayStr);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const orderData = await getServiceOrder(id);
        if (orderData) {
          setOrder(orderData);
          const persisted = persistedPaymentsFromServiceOrder(orderData);
          if (persisted.length > 0) {
            setUsePartialPayments(true);
            setPartialPayments(
              persisted.map((p) => ({
                id: p.id,
                payment_method: p.payment_method,
                amount: formatFromNumber(p.amount),
                installments: p.installments ? String(p.installments) : '1',
                locked: p.payment_method !== 'on_pickup',
                received_at:
                  p.payment_method === 'on_pickup'
                    ? todayStr
                    : (p.received_at ? String(p.received_at).slice(0, 10) : null),
              }))
            );
          } else {
            setNewPaymentMethod('');
            setNewInstallments('1');
            setPickupPaymentDate(todayStr);
          }
        } else {
          showError('Ordem de serviço não encontrada');
          goBackToList('/service-orders/lab');
        }
      } catch (err: any) {
        console.error('Erro ao carregar OS:', err);
        showError(err.message || 'Erro ao carregar ordem de serviço');
        goBackToList('/service-orders/lab');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, getServiceOrder, showError, goBackToList]);

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatFromNumber = (value: number): string => {
    if (!value && value !== 0) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleConfirm = async () => {
    if (!order) return;

    if (usePartialPayments) {
      if (partialPayments.length === 0) {
        showError('Adicione pelo menos uma forma de pagamento');
        return;
      }
      if (partialPayments.some((p) => !p.payment_method)) {
        showError('Selecione a forma de pagamento em todas as linhas');
        return;
      }
      if (partialPayments.some((p) => !p.locked && !String(p.received_at || '').trim())) {
        showError('Informe a data do pagamento em cada linha da retirada');
        return;
      }
      const totalPaid = partialPayments.reduce((sum, p) => sum + parseMoneyBrInput(p.amount), 0);
      const totalPrice = order.price || 0;
      if (Math.abs(totalPaid - totalPrice) > 0.01) {
        showError(`A soma dos pagamentos (${formatFromNumber(totalPaid)}) deve ser igual ao valor total (${formatFromNumber(totalPrice)})`);
        return;
      }
    } else {
      if (!newPaymentMethod) {
        showError('Selecione uma forma de pagamento');
        return;
      }
      if (!String(pickupPaymentDate || '').trim()) {
        showError('Informe a data do pagamento');
        return;
      }
    }

    setProcessing(true);
    try {
      const payload = usePartialPayments
        ? {
            price: order.price ?? 0,
            payment_method: null,
            installments: null,
            payments: partialPayments.map((p) => ({
              ...(p.id != null ? { id: p.id } : {}),
              payment_method: p.payment_method as any,
              amount: parseMoneyBrInput(p.amount),
              installments: p.payment_method === 'credit_card' && p.installments ? parseInt(p.installments) : null,
              ...(!p.locked && String(p.received_at || '').trim()
                ? { received_at: String(p.received_at).trim() }
                : {}),
            })),
          }
        : {
            price: order.price ?? 0,
            payment_method: newPaymentMethod as any,
            installments: newPaymentMethod === 'credit_card' ? parseInt(newInstallments) : null,
            payment_date: pickupPaymentDate,
            payments: [],
          };

      const result = await completeWithPayment(String(order.id), payload);

      if (result?.success) {
        showSuccess('OS finalizada com sucesso!');
        goBackToList('/service-orders/lab');
      } else {
        showError(result?.message || 'Erro ao finalizar OS');
      }
    } catch (err: any) {
      console.error('Erro ao finalizar OS com pagamento:', err);
      showError(err.message || 'Erro ao finalizar OS');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--store-color)]" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const totalPrice = order.price || 0;
  const totalPaid = usePartialPayments
    ? partialPayments.reduce((sum, p) => sum + parseMoneyBrInput(p.amount), 0)
    : 0;
  const remaining = totalPrice - totalPaid;
  const isValid = !usePartialPayments || Math.abs(remaining) < 0.01;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => goBackToList('/service-orders/lab')}
            className="mb-4"
          >
            <ArrowLeft size={16} /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Alterar Forma de Pagamento</h1>
          <p className="text-sm text-slate-600 mt-1">
            OS #{String(order.os_number).padStart(4, '0')} - {order.client?.name}
          </p>
        </div>

        {/* Aviso */}
        <Card className="mb-6">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Esta OS ainda tem valor pendente (ex.: &quot;Pagamento na Retirada&quot;). Registre abaixo como o restante foi pago na retirada.
              </p>
              <p className="text-xs text-yellow-800/90 mt-2 leading-relaxed">
                Pagamentos já feitos no cadastro da OS permanecem fixos: o fluxo de caixa usa a data em que entraram. O que falta (retirada) usa a data de hoje por padrão — ajuste se o recebimento foi em outro dia.
              </p>
            </div>
          </div>
        </Card>

        {/* Resumo da OS */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Resumo da OS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-500">Número da OS:</span>
                  <p className="font-semibold text-slate-900">#{String(order.os_number).padStart(4, '0')}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Cliente:</span>
                  <p className="font-semibold text-slate-900">{order.client?.name}</p>
                </div>
                {order.client?.document && (
                  <div>
                    <span className="text-sm text-slate-500">CPF/CNPJ:</span>
                    <p className="font-semibold text-slate-900">{order.client.document}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-slate-500">Loja:</span>
                  <p className="font-semibold text-slate-900">{order.store?.name}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-3">
                {order.laboratory && (
                  <div>
                    <span className="text-sm text-slate-500">Laboratório:</span>
                    <p className="font-semibold text-slate-900">{order.laboratory.name}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-slate-500">Vendedor:</span>
                  <p className="font-semibold text-slate-900">{order.user?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Data de Criação:</span>
                  <p className="font-semibold text-slate-900">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Valor Total:</span>
                  <p className="font-semibold text-slate-900 text-lg text-[var(--store-color)]">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Itens da OS */}
          {(order.frames && order.frames.length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Armações:</h3>
              <div className="space-y-2">
                {order.frames.map((frame: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">
                      {frame.description || `Armação ${frame.code || ''}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Formulário de Pagamento */}
        <Card>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Forma de Pagamento</h2>
          
          <div className="space-y-6">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={usePartialPayments}
                  onChange={(e) => {
                    setUsePartialPayments(e.target.checked);
                    if (e.target.checked) {
                      setPartialPayments([{
                        payment_method: '',
                        amount: formatFromNumber(totalPrice),
                        installments: '1',
                        locked: false,
                        received_at: todayStr,
                      }]);
                      setNewPaymentMethod('');
                    } else {
                      setPartialPayments([]);
                    }
                  }}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                />
              </div>
              <span className="text-sm font-medium text-slate-600">Pagamento parcial/misto</span>
            </label>

            {!usePartialPayments ? (
              // Pagamento único
              <div className="space-y-4">
                <div>
                  <SingleSelect
                    label="Forma de Pagamento *"
                    value={newPaymentMethod}
                    onChange={(val) => {
                      setNewPaymentMethod(val);
                      if (val !== 'credit_card') {
                        setNewInstallments('1');
                      }
                    }}
                    options={[
                      { value: 'credit_card', label: 'Cartão de Crédito' },
                      { value: 'debit_card', label: 'Cartão de Débito' },
                      { value: 'cash', label: 'Dinheiro' },
                      { value: 'pix', label: 'PIX' },
                      { value: 'permuta', label: 'Permuta' },
                    ]}
                    placeholder="Selecione a forma de pagamento..."
                  />
                </div>
                
                {newPaymentMethod === 'credit_card' && (
                  <div>
                    <SingleSelect
                      label="Parcelas"
                      value={newInstallments}
                      onChange={(val) => setNewInstallments(val)}
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
                    />
                  </div>
                )}
                <div className="w-48">
                  <Input
                    label="Data do pagamento *"
                    type="date"
                    value={pickupPaymentDate}
                    onChange={(e) => setPickupPaymentDate(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500">Padrão: hoje. Ajuste se o cliente pagou em outro dia.</p>
                </div>
              </div>
            ) : (
              // Pagamentos parciais
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-800">
                    A soma deve fechar o valor total. Linhas já pagas no cadastro da OS aparecem bloqueadas — altere só o que era &quot;na retirada&quot; ou linhas novas.
                  </p>
                </div>
                {partialPayments.map((payment, index) => {
                  const currentTotalPaid = partialPayments.reduce((sum, p) => sum + parseMoneyBrInput(p.amount), 0);
                  const currentRemaining = totalPrice - currentTotalPaid + parseMoneyBrInput(payment.amount);
                  const payOptions = [
                    { value: 'credit_card', label: 'Cartão de Crédito' },
                    { value: 'debit_card', label: 'Cartão de Débito' },
                    { value: 'cash', label: 'Dinheiro' },
                    { value: 'pix', label: 'PIX' },
                    { value: 'permuta', label: 'Permuta' },
                  ];

                  return (
                    <div
                      key={payment.id != null ? `id-${payment.id}` : `idx-${index}`}
                      className={`p-4 border rounded-xl ${payment.locked ? 'border-slate-300 bg-slate-100/80' : 'border-slate-200 bg-slate-50'}`}
                    >
                      {payment.locked && (
                        <p className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                          <span className="text-emerald-700">✓</span> Pago no cadastro da OS
                          {payment.received_at ? (
                            <span className="font-normal text-slate-500">
                              · fluxo de caixa:{' '}
                              {new Date(`${payment.received_at}T12:00:00`).toLocaleDateString('pt-BR')}
                            </span>
                          ) : null}
                        </p>
                      )}
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <SingleSelect
                            label={`Pagamento ${index + 1}`}
                            value={payment.payment_method}
                            onChange={(val) => {
                              if (payment.locked) return;
                              const newPayments = [...partialPayments];
                              newPayments[index] = {
                                ...newPayments[index],
                                payment_method: val,
                                installments: val === 'credit_card' ? newPayments[index].installments : '1',
                              };
                              setPartialPayments(newPayments);
                            }}
                            options={payOptions}
                            placeholder="Selecione..."
                            disabled={payment.locked}
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
                              placeholder="0,00"
                              value={payment.amount}
                              onChange={(e) => {
                                if (payment.locked) return;
                                const formatted = formatCurrencyInput(e.target.value);
                                const newPayments = [...partialPayments];
                                newPayments[index] = { ...newPayments[index], amount: formatted };
                                setPartialPayments(newPayments);
                              }}
                              disabled={payment.locked}
                              className={`w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)] ${payment.locked ? 'bg-slate-200/60 cursor-not-allowed text-slate-700' : ''}`}
                            />
                          </div>
                          {!payment.locked && currentRemaining >= 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Restante: {formatCurrency(currentRemaining)}
                            </p>
                          )}
                        </div>
                        {payment.payment_method === 'credit_card' && (
                          <div className="w-28">
                            <SingleSelect
                              label="Parcelas"
                              value={payment.installments}
                              onChange={(val) => {
                                if (payment.locked) return;
                                const newPayments = [...partialPayments];
                                newPayments[index] = { ...newPayments[index], installments: val };
                                setPartialPayments(newPayments);
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
                              disabled={payment.locked}
                            />
                          </div>
                        )}
                        {!payment.locked && (
                          <div className="w-40">
                            <Input
                              label="Data pgto *"
                              type="date"
                              value={payment.received_at || todayStr}
                              onChange={(e) => {
                                const newPayments = [...partialPayments];
                                newPayments[index] = { ...newPayments[index], received_at: e.target.value };
                                setPartialPayments(newPayments);
                              }}
                            />
                          </div>
                        )}
                        {!payment.locked && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPayments = partialPayments.filter((_, i) => i !== index);
                              setPartialPayments(newPayments);
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
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Total pago:</span>
                    <span className={`text-sm font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  {!isValid && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ A soma dos pagamentos ({formatFromNumber(totalPaid)}) deve ser igual ao valor total ({formatFromNumber(totalPrice)})
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (remaining > 0) {
                        const formattedRemaining = remaining.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).replace('.', ',');
                        setPartialPayments([
                          ...partialPayments,
                          {
                            payment_method: '',
                            amount: formattedRemaining,
                            installments: '1',
                            locked: false,
                            received_at: todayStr,
                          },
                        ]);
                      }
                    }}
                    disabled={remaining <= 0 || isValid}
                    className="w-full"
                  >
                    <Plus size={16} /> Adicionar Pagamento
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => goBackToList('/service-orders/lab')}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={processing || (usePartialPayments ? !isValid || partialPayments.length === 0 : !newPaymentMethod)}
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Confirmar e Finalizar
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
