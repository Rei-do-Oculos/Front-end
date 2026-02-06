import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Card, Button, Input, MultiSelect } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useLaboratories } from '../../services/hooks/useLaboratories';
import { usePlucks } from '../../services/hooks/usePlucks';
import { storesService } from '../../services/api/stores';
import { useNotification } from '../../hooks/useNotification';
import { laboratorySchema, formatZodErrors } from '../../schemas/laboratory.schema';
import { maskCnpjInput, maskPhoneInput } from '../../utils/formatters';

export const LaboratoryForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { getLaboratory, createLaboratory, updateLaboratory } = useLaboratories({
    autoFetch: false,
  });

  const { plucks: storesPlucks, loading: storesPlucksLoading } = usePlucks({
    service: storesService,
    autoFetch: true,
  });

  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    contact_name: '',
    notes: '',
    active: true,
    stores: [] as number[],
  });

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      setErrors({});
      const loadLaboratory = async () => {
        try {
          const laboratory = await getLaboratory(id);
          if (laboratory) {
            const rawCnpj = (laboratory.cnpj || '').replace(/\D/g, '');
            const rawPhone = (laboratory.phone || '').replace(/\D/g, '');
            // Extrair IDs das lojas vinculadas
            const storesIds = laboratory.stores 
              ? laboratory.stores.map((s: any) => s.id || s)
              : [];
            setFormData({
              name: laboratory.name || '',
              cnpj: rawCnpj ? maskCnpjInput(rawCnpj) : '',
              phone: rawPhone ? maskPhoneInput(rawPhone) : '',
              email: laboratory.email || '',
              address: laboratory.address || '',
              contact_name: laboratory.contact_name || '',
              notes: laboratory.notes || '',
              active: laboratory.active ?? true,
              stores: storesIds,
            });
          } else {
            setErrors({ form: 'Laboratório não encontrado' });
          }
        } catch (err: any) {
          console.error('Erro ao carregar laboratório:', err);
          setErrors({ form: err.response?.data?.message || err.message || 'Erro ao carregar dados do laboratório' });
        } finally {
          setLoading(false);
        }
      };
      loadLaboratory();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar com Zod
    const result = laboratorySchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      setErrors(formattedErrors);
      
      // Mostrar o primeiro erro como notificação
      const firstError = Object.values(formattedErrors)[0];
      if (firstError) {
        showError(firstError);
      }
      return;
    }

    setSaving(true);

    try {
      const payload = result.data;
      
      // Preparar payload com stores
      const finalPayload: any = { ...payload };
      
      if (isEditMode) {
        // No modo de edição, só envia stores se houver seleção (para não remover todas as lojas)
        if (formData.stores && formData.stores.length > 0) {
          finalPayload.stores = formData.stores;
        }
        // Se não houver seleção, não envia stores (mantém as lojas existentes)
      } else {
        // No modo de criação, envia stores se houver seleção, senão o backend usa a loja do contexto
        if (formData.stores && formData.stores.length > 0) {
          finalPayload.stores = formData.stores;
        }
      }

      if (isEditMode && id) {
        await updateLaboratory(id, finalPayload);
        showSuccess('Laboratório atualizado com sucesso!');
      } else {
        await createLaboratory(finalPayload);
        showSuccess('Laboratório criado com sucesso!');
      }
      navigate('/laboratories');
    } catch (err: any) {
      console.error('Erro ao salvar laboratório:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar laboratório';
      setErrors({ form: errorMessage });
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Limpar erro do campo quando usuário digita
  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

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
            onClick={() => navigate('/laboratories')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              {isEditMode ? 'Editar Laboratório' : 'Novo Laboratório'}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {isEditMode ? 'Atualize os dados do laboratório' : 'Cadastre um novo laboratório parceiro'}
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
              <Building2 size={28} style={{ color: 'var(--store-color)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Informações do Laboratório</h2>
              <p className="text-sm text-slate-500">Campos marcados com <span className="text-red-500 font-bold">*</span> são obrigatórios</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Nome do Laboratório *"
                placeholder="Ex: Essilor"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
                className={errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
              )}
            </div>
            <div>
              <Input
                label="CNPJ"
                placeholder="00.000.000/0001-00"
                value={formData.cnpj}
                onChange={(e) => handleFieldChange('cnpj', maskCnpjInput(e.target.value))}
                maxLength={18}
              />
              {errors.cnpj && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.cnpj}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', maskPhoneInput(e.target.value))}
                maxLength={15}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>
              )}
            </div>
            <div>
              <Input
                label="E-mail"
                type="email"
                placeholder="contato@laboratorio.com"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Input
                label="Nome do Contato"
                placeholder="Nome do responsável"
                value={formData.contact_name}
                onChange={(e) => handleFieldChange('contact_name', e.target.value)}
              />
              {errors.contact_name && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.contact_name}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">
              Lojas
            </label>
            <MultiSelect
              options={safeStoresPlucks.map((s: any) => ({ 
                label: s.fancy_name || s.name, 
                value: String(s.id) 
              }))}
              value={formData.stores.map(String)}
              onChange={(values) => {
                const newStores = values.map(Number);
                handleFieldChange('stores', newStores);
              }}
              placeholder={storesPlucksLoading ? "Carregando lojas..." : "Selecione uma ou mais lojas"}
            />
            {errors.stores && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.stores}</p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {isEditMode 
                ? "Selecione as lojas onde este laboratório estará disponível. Se não selecionar nenhuma, as lojas atuais serão mantidas."
                : "Selecione as lojas onde este laboratório estará disponível. Se não selecionar nenhuma, será vinculado à loja atual."
              }
            </p>
          </div>

          <div className="mt-6">
            <Input
              label="Endereço"
              placeholder="Endereço completo"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.address}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Observações
            </label>
            <textarea
              className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all resize-none ${
                errors.notes 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-slate-200 focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]'
              }`}
              rows={4}
              placeholder="Observações sobre o laboratório..."
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.notes}</p>
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
              onClick={() => navigate('/laboratories')}
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
                  <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Laboratório
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
