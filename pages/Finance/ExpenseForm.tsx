import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Receipt, Loader2 } from 'lucide-react';
import { Card, Button, Input, SingleSelect } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useExpenses } from '../../services/hooks/useExpenses';
import { useStore } from '../../contexts/StoreContext';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../services/api/expenses';
import { AccessDeniedCard } from '../../components/Common';
import { normalizeToTitleCase } from '../../utils/formatters';

const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseInt(numbers, 10) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (value: string): string => {
  if (!value) return '';
  return value.replace(/\./g, '').replace(',', '.');
};

const formatFromNumber = (value: number | string): string => {
  if (value !== 0 && !value) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PAYMENT_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => ({
  value: key,
  label: PAYMENT_METHOD_LABELS[key],
}));

export const ExpenseForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const { selectedStore } = useStore();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { getExpense, createExpense, updateExpense } = useExpenses({ autoFetch: false });

  const [formData, setFormData] = useState({
    name: '',
    value: '',
    payment_method: '' as string,
    date: '',
  });

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      setErrors({});
      getExpense(id)
        .then((exp) => {
          if (exp) {
            setFormData({
              name: exp.name || '',
              value: formatFromNumber(exp.value),
              payment_method: exp.payment_method || '',
              date: exp.date ? exp.date.split('T')[0] : '',
            });
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar despesa:', err);
          setErrors({ form: (err as Error).message || 'Erro ao carregar despesa' });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const name = formData.name.trim();
    const valueStr = parseCurrency(formData.value);
    const valueNum = valueStr ? parseFloat(valueStr) : 0;

    if (!name) {
      setErrors({ name: 'Nome da despesa é obrigatório' });
      showError('Preencha o nome da despesa');
      return;
    }
    if (valueNum <= 0) {
      setErrors({ value: 'Valor deve ser maior que zero' });
      showError('Informe um valor válido');
      return;
    }
    if (!formData.payment_method) {
      setErrors({ payment_method: 'Forma de pagamento é obrigatória' });
      showError('Selecione a forma de pagamento');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        value: valueNum,
        payment_method: formData.payment_method as PaymentMethod,
        date: formData.date || undefined,
      };

      if (isEditMode && id) {
        await updateExpense(id, payload);
        showSuccess('Despesa atualizada com sucesso!');
      } else {
        await createExpense(payload);
        showSuccess('Despesa criada com sucesso!');
      }
      navigate('/finance/expenses');
    } catch (err: any) {
      const msg = err.response?.data?.data?.errors
        ? Object.values(err.response.data.data.errors).flat().join(' ')
        : err.message || 'Erro ao salvar despesa';
      showError(msg);
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  const canCreate = hasPermission('expenses.create');
  const canUpdate = hasPermission('expenses.update');
  const canRead = hasPermission('expenses.read');
  if (isEditMode && !canRead && !canUpdate) return <AccessDeniedCard />;
  if (!isEditMode && !canCreate) return <AccessDeniedCard />;

  if (loading) {
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
            onClick={() => navigate('/finance/expenses')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              {isEditMode ? 'Editar Despesa' : 'Nova Despesa'}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {isEditMode ? 'Atualize os dados da despesa' : 'Registre uma despesa da loja'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8">
          {errors.form && (
            <div
              className="mb-6 border rounded-xl p-4"
              style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>{errors.form}</p>
            </div>
          )}

          {selectedStore && (
            <div className="mb-6 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Loja</p>
              <p className="text-sm font-bold text-slate-800">{selectedStore.name || selectedStore.unity || `Loja ${selectedStore.id}`}</p>
              <p className="text-xs text-slate-500">A despesa será vinculada à loja selecionada no sistema.</p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
              <Receipt size={28} style={{ color: 'var(--store-color)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Dados da Despesa</h2>
              <p className="text-sm text-slate-500">Campos marcados com <span className="text-red-500">*</span> são obrigatórios</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome da despesa *"
              placeholder="Ex: Aluguel, Energia, Material"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeToTitleCase(e.target.value);
                if (normalized !== e.target.value) handleFieldChange('name', normalized);
              }}
              required
            />
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.value}
                  onChange={(e) => handleFieldChange('value', formatCurrency(e.target.value))}
                  className={`w-full pl-12 pr-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
                    errors.value
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]'
                  }`}
                />
              </div>
              {errors.value && <p className="mt-1 text-xs text-red-500 font-medium">{errors.value}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <SingleSelect
              label="Forma de pagamento *"
              value={formData.payment_method}
              onChange={(val) => handleFieldChange('payment_method', val || '')}
              options={PAYMENT_OPTIONS}
              searchable
              placeholder="Selecione..."
            />
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Data (opcional)</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => navigate('/finance/expenses')} disabled={saving}>
              <ArrowLeft size={18} /> Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Salvando...</>
              ) : (
                <><Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Despesa</>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
