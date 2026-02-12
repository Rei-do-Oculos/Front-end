import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/Common';
import { useNavigate } from 'react-router-dom';
import { authService, type ProfileUpdateDto } from '../../services/api/auth';
import { useAuth } from '../../services/hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { normalizeEmail, normalizeToTitleCase } from '../../utils/formatters';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      setFormError('E-mail é obrigatório');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setFormError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      setFormError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const payload: ProfileUpdateDto = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };
      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await authService.updateProfile(payload);
      if (response.data?.user) {
        await refreshUser();
        showSuccess('Perfil atualizado!', 'Seus dados foram salvos com sucesso.');
        setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      const msg = err.response?.data?.data?.errors?.message
        || err.response?.data?.data?.errors?.email?.[0]
        || err.response?.data?.data?.errors?.name?.[0]
        || err.message
        || 'Erro ao atualizar perfil';
      setFormError(msg);
      showError('Erro ao atualizar perfil', msg);
    } finally {
      setLoading(false);
    }
  };

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const stores = Array.isArray(user?.stores) ? user.stores : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Meu Perfil</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">
            Atualize seus dados pessoais
          </p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>

      <Card>
        {formError && (
          <div className="mb-6 border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--store-color-dark)' }}>{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo *"
              placeholder="Seu nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={(e) => {
                const normalized = normalizeToTitleCase(e.target.value);
                if (normalized !== e.target.value) setFormData({ ...formData, name: normalized });
              }}
              required
            />
            <Input
              label="E-mail *"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={(e) => {
                const normalized = normalizeEmail(e.target.value);
                if (normalized !== e.target.value) setFormData({ ...formData, email: normalized });
              }}
              required
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-3 block">
              Alterar senha (opcional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nova senha"
                type="password"
                placeholder="Deixe em branco para manter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                placeholder="Repita a nova senha"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-6">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 block">
              Informações do sistema (somente leitura)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">
                  Perfil
                </label>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map((r: any) => (
                      <Badge key={r.id} variant="info">{r.name}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">
                  Lojas
                </label>
                <div className="flex flex-wrap gap-2">
                  {stores.length > 0 ? (
                    stores.map((s: any) => (
                      <Badge key={s.id} variant="primary">{s.fancy_name || s.name}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Perfil e lojas são gerenciados pelo administrador do sistema.
            </p>
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button type="button" onClick={() => navigate(-1)} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
