import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw, Loader2, ArrowLeft } from 'lucide-react';
import { Card, Button, Badge } from '../../components/Common';
import { useTrash } from '../../services/hooks/useTrash';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../services/hooks/useAuth';
import { getEffectiveUserPermissions } from '../../utils/menuPermissions';
import type { TrashItem } from '../../services/api/trash';

const detailDataExcludeKeys = ['created_at', 'updated_at', 'deleted_at'];

const formatDetailValue = (value: unknown): string => {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getDetailDataEntries = (item: TrashItem): Array<{ key: string; value: unknown }> => {
  const data = item?.data;
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data)
    .filter(([key]) => !detailDataExcludeKeys.includes(key))
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
};

const getModelBadgeColor = (model: string) => {
  const colors: Record<string, string> = {
    clients: 'bg-blue-100 text-blue-700',
    stores: 'bg-purple-100 text-purple-700',
    users: 'bg-green-100 text-green-700',
    roles: 'bg-yellow-100 text-yellow-700',
    permissions: 'bg-pink-100 text-pink-700',
    lenses: 'bg-indigo-100 text-indigo-700',
  };
  return colors[model] || 'bg-slate-100 text-slate-700';
};

export const TrashDetail: React.FC = () => {
  const { model, id } = useParams<{ model: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const { restoreItem } = useTrash({ autoFetch: false });
  const [restoring, setRestoring] = useState(false);

  const item = (location.state as { item?: TrashItem })?.item ?? null;

  // Verificar se o usuário tem permissão para restaurar
  const canRestore = useMemo(() => {
    if (!user) return false;
    const permissions = getEffectiveUserPermissions(user);
    return permissions.some(p => p.name === 'trash.restore');
  }, [user]);

  const handleRestore = async () => {
    if (!item || !model || !id) return;
    setRestoring(true);
    try {
      await restoreItem(item.model, item.id);
      showSuccess('Item restaurado!', `"${item.name}" foi restaurado com sucesso.`);
      navigate('/trash', { replace: true });
    } catch (err: any) {
      showError('Erro ao restaurar item', err.message || 'Não foi possível restaurar o item');
    } finally {
      setRestoring(false);
    }
  };

  if (!item) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <h1 className="text-3xl font-black text-slate-950 tracking-tight">Detalhes do item</h1>
        <Card className="p-8 text-center">
          <p className="text-slate-600 mb-4">Item não encontrado ou acessado diretamente sem contexto.</p>
          <Button variant="outline" onClick={() => navigate('/trash')}>
            <ArrowLeft size={16} /> Voltar para a Lixeira
          </Button>
        </Card>
      </div>
    );
  }

  const entries = getDetailDataEntries(item);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/trash')}
            className="p-2 rounded-xl"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Detalhes do item</h1>
            <p className="text-gray-500 font-medium mt-1">Registro excluído da lixeira</p>
          </div>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getModelBadgeColor(item.model)}>
            {item.model_label}
          </Badge>
          <span className="text-lg font-bold text-slate-900">{item.name}</span>
          <span className="text-sm text-slate-500">Excluído em {item.deleted_at}</span>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Dados do registro
          </p>
          <dl className="grid gap-2 sm:grid-cols-2">
            {entries.map(({ key, value }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-slate-500">{key}</dt>
                <dd className="text-sm text-slate-900 break-all">
                  {formatDetailValue(value)}
                </dd>
              </div>
            ))}
          </dl>
          {entries.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum dado adicional.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => navigate('/trash')} disabled={restoring}>
            Voltar
          </Button>
          {canRestore && (
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw size={16} /> Restaurar
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
