import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Glasses, Loader2 } from 'lucide-react';
import { Card, Button, Input, SingleSelect } from '../../components/Common';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLaboratoryLenses } from '../../services/hooks/useLaboratoryLenses';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { useNotification } from '../../hooks/useNotification';
import { laboratoryLensSchema, formatZodErrors } from '../../schemas/laboratoryLens.schema';

// Função para formatar valor como moeda brasileira
const formatCurrency = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers, 10) / 100;
  
  // Formata como moeda brasileira sem o símbolo
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para converter valor formatado para número
const parseCurrency = (value: string): string => {
  if (!value) return '';
  // Remove pontos de milhar e troca vírgula por ponto
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

export const LaboratoryLensForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Pegar laboratory_id da URL se vier da página de detalhes do laboratório
  const preselectedLaboratoryId = searchParams.get('laboratory_id') || '';
  
  const { getLaboratoryLens, createLaboratoryLens, updateLaboratoryLens } = useLaboratoryLenses({
    autoFetch: false,
  });
  const { laboratories, fetchLaboratories } = useLaboratories({ autoFetch: false });

  const [formData, setFormData] = useState({
    laboratory_id: preselectedLaboratoryId,
    name: '',
    description: '',
    delivery_days: '',
    cost_price: '',
    sale_price: '',
    active: true,
    promotion_active: false,
    promotional_cost_price: '',
  });

  useEffect(() => {
    fetchLaboratories(1, { per_page: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      setErrors({});
      const loadLens = async () => {
        try {
          const lens = await getLaboratoryLens(id);
          if (lens) {
            setFormData({
              laboratory_id: String(lens.laboratory_id) || '',
              name: lens.name || '',
              description: lens.description || '',
              delivery_days: lens.delivery_days?.toString() ?? '',
              cost_price: formatFromNumber(lens.cost_price),
              sale_price: formatFromNumber(lens.sale_price),
              active: lens.active ?? true,
              promotion_active: lens.promotion_active ?? false,
              promotional_cost_price: lens.promotional_cost_price != null ? formatFromNumber(lens.promotional_cost_price) : '',
            });
          } else {
            setErrors({ form: 'Lente não encontrada' });
          }
        } catch (err: any) {
          console.error('Erro ao carregar lente:', err);
          setErrors({ form: err.response?.data?.message || err.message || 'Erro ao carregar dados da lente' });
        } finally {
          setLoading(false);
        }
      };
      loadLens();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Converter valores formatados para números
    const dataToValidate = {
      ...formData,
      cost_price: parseCurrency(formData.cost_price),
      sale_price: parseCurrency(formData.sale_price),
      promotional_cost_price: parseCurrency(formData.promotional_cost_price),
    };

    // Validar com Zod
    const result = laboratoryLensSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      setErrors(formattedErrors);
      
      const firstError = Object.values(formattedErrors)[0];
      if (firstError) {
        showError(firstError);
      }
      return;
    }

    setSaving(true);

    try {
      const payload = result.data;

      if (isEditMode && id) {
        await updateLaboratoryLens(id, payload);
        showSuccess('Lente atualizada com sucesso!');
      } else {
        await createLaboratoryLens(payload);
        showSuccess('Lente criada com sucesso!');
      }
      navigate('/laboratory-lenses');
    } catch (err: any) {
      console.error('Erro ao salvar lente:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar lente';
      setErrors({ form: errorMessage });
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const laboratoriesList = Array.isArray(laboratories) ? laboratories : [];

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
            onClick={() => navigate('/laboratory-lenses')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              {isEditMode ? 'Editar Lente' : 'Nova Lente de Laboratório'}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {isEditMode ? 'Atualize os dados da lente' : 'Cadastre uma nova lente de laboratório'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8">
          {errors.form && (
            <div className="mb-6 border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>{errors.form}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
              <Glasses size={28} style={{ color: 'var(--store-color)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Informações da Lente</h2>
              <p className="text-sm text-slate-500">Campos marcados com <span className="text-red-500">*</span> são obrigatórios</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SingleSelect
                label="Laboratório *"
                value={formData.laboratory_id}
                onChange={(val) => handleFieldChange('laboratory_id', val)}
                options={laboratoriesList.map((lab) => ({ value: String(lab.id), label: lab.name }))}
                placeholder="Selecione um laboratório"
              />
              {errors.laboratory_id && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.laboratory_id}</p>
              )}
            </div>
            <div>
              <Input
                label="Nome da Lente *"
                placeholder="Ex: Varilux Physio 3.0"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Input
                label="Prazo de Entrega (dias)"
                type="number"
                placeholder="Ex: 7"
                min={0}
                value={formData.delivery_days}
                onChange={(e) => handleFieldChange('delivery_days', e.target.value)}
              />
              {errors.delivery_days && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.delivery_days}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Preço de Custo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.cost_price}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    handleFieldChange('cost_price', formatted);
                  }}
                  className={`w-full pl-12 pr-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
                    errors.cost_price 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]'
                  }`}
                />
              </div>
              {errors.cost_price && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.cost_price}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Preço de Venda <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.sale_price}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    handleFieldChange('sale_price', formatted);
                  }}
                  className={`w-full pl-12 pr-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
                    errors.sale_price 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]'
                  }`}
                />
              </div>
              {errors.sale_price && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.sale_price}</p>
              )}
            </div>
          </div>

          <div className="mt-8 border border-slate-100 rounded-2xl p-6 bg-slate-50/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Promoção</p>
                <p className="text-xs text-slate-500">Defina um preço de custo promocional temporário para esta lente (venda continua usando o valor padrão).</p>
              </div>
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.promotion_active}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      promotion_active: checked,
                      ...(checked ? {} : { promotional_cost_price: '' }),
                    }));
                    if (!checked && errors.promotional_cost_price) {
                      setErrors((prev) => ({ ...prev, promotional_cost_price: '' }));
                    }
                  }}
                  className="sr-only peer"
                />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]" />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: formData.promotion_active ? 'var(--store-color)' : '#94a3b8' }}
                >
                  {formData.promotion_active ? 'Promoção ativa' : 'Sem promoção'}
                </span>
              </label>
            </div>

            {formData.promotion_active && (
              <div className="mt-6 space-y-4">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Preço Promocional (Custo)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formData.promotional_cost_price}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      handleFieldChange('promotional_cost_price', formatted);
                    }}
                    className={`w-full pl-12 pr-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
                      errors.promotional_cost_price
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]'
                    }`}
                  />
                </div>
                {errors.promotional_cost_price && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.promotional_cost_price}</p>
                )}
                <p className="text-xs text-slate-500">
                  O preço promocional de custo será aplicado em novas OS automaticamente. Para encerrar a promoção, desative o botão acima.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Descrição
            </label>
            <textarea
              className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all resize-none ${
                errors.description 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]'
              }`}
              rows={4}
              placeholder="Descrição da lente..."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.description}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Status
            </label>
            <label 
              htmlFor="active" 
              className="inline-flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => handleFieldChange('active', e.target.checked)}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--store-color)]"
                />
              </div>
              <span 
                className="text-sm font-medium"
                style={{ color: formData.active ? 'var(--store-color)' : '#94a3b8' }}
              >
                {formData.active ? 'Ativo' : 'Inativo'}
              </span>
            </label>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/laboratory-lenses')}
              disabled={saving}
            >
              <ArrowLeft size={18} /> Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Lente
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
