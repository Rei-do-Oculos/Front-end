import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useLenses } from '../../services/hooks/useLenses';
import { CreateLensDto, UpdateLensDto } from '../../services/api/lenses';
import { useNotification } from '../../hooks/useNotification';
import { normalizeToTitleCase } from '../../utils/formatters';

export const LensForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  
  const { getLens, createLens, updateLens, deleteLens, loading } = useLenses({
    autoFetch: false,
  });

  const [formData, setFormData] = useState<CreateLensDto>({
    name: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [loadingLens, setLoadingLens] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carregar dados da lente se estiver editando
  useEffect(() => {
    if (isEditMode && id) {
      const loadLens = async () => {
        setLoadingLens(true);
        try {
          const lens = await getLens(id);
          if (lens) {
            setFormData({
              name: lens.name || '',
            });
          }
        } catch (err: any) {
          console.error('Erro ao carregar lente:', err);
          setFormError(err.message || 'Erro ao carregar dados da lente');
        } finally {
          setLoadingLens(false);
        }
      };
      loadLens();
    }
  }, [id, isEditMode, getLens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações básicas
    if (!formData.name.trim()) {
      setFormError('O nome é obrigatório');
      showError('Validação', 'O nome é obrigatório');
      return;
    }

    try {
      if (isEditMode && id) {
        await updateLens(id, formData);
        showSuccess('Lente atualizada!', 'A lente foi atualizada com sucesso.');
      } else {
        await createLens(formData);
        showSuccess('Lente criada!', 'A lente foi criada com sucesso.');
      }

      // Redirecionar após um pequeno delay para mostrar a notificação
      setTimeout(() => {
        navigate('/lenses');
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar lente:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar lente';
      setFormError(errorMessage);
      showError('Erro ao salvar lente', errorMessage);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteLens(id);
      showSuccess('Lente excluída com sucesso!');
      navigate('/lentes');
    } catch (err: any) {
      console.error('Erro ao excluir lente:', err);
      showError(err.message || 'Erro ao excluir lente');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loadingLens) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 px-4 lg:px-6">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
            <p className="text-sm text-slate-500">Carregando dados da lente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 px-4 lg:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Editar Lente' : 'Nova Lente'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditMode ? 'Atualize os dados da lente' : 'Cadastre uma nova lente no sistema'}
          </p>
        </div>
        <div className="flex gap-3">
          {isEditMode && (
            <Button 
              variant="outline" 
              onClick={handleDeleteClick} 
              style={{ color: 'var(--store-color-dark)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--store-color)';
                e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '';
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              <Trash2 size={18} /> Excluir
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/lentes')}>
            <ArrowLeft size={18} /> Voltar
          </Button>
        </div>
      </div>

      {formError && (
        <div className="mb-6 border rounded-xl p-4 animate-in slide-in-from-top-2" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>{formError}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome da Lente *"
              placeholder="Ex: Varilux Physio 3.0"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={(e) => {
                const normalized = normalizeToTitleCase(e.target.value);
                if (normalized !== e.target.value) setFormData({ ...formData, name: normalized });
              }}
              required
            />
          </div>
          
       

          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button type="button" onClick={() => navigate('/lentes')} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
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
        </form>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
          }
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir esta lente?
          </p>
          <p className="text-xs text-slate-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Excluir
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
