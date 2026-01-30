import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useFrameTypes } from '../../services/hooks/useFrameTypes';
import { CreateFrameTypeDto, UpdateFrameTypeDto } from '../../services/api/frameTypes';
import { useNotification } from '../../hooks/useNotification';

export const FrameTypeForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  
  const { getFrameType, createFrameType, updateFrameType, deleteFrameType, loading } = useFrameTypes({
    autoFetch: false,
  });

  const [formData, setFormData] = useState<CreateFrameTypeDto>({
    name: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [loadingFrameType, setLoadingFrameType] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carregar dados do tipo de armação se estiver editando
  useEffect(() => {
    if (isEditMode && id) {
      const loadFrameType = async () => {
        setLoadingFrameType(true);
        try {
          const frameType = await getFrameType(id);
          if (frameType) {
            setFormData({
              name: frameType.name || '',
            });
          }
        } catch (err: any) {
          console.error('Erro ao carregar tipo de armação:', err);
          setFormError(err.message || 'Erro ao carregar dados do tipo de armação');
        } finally {
          setLoadingFrameType(false);
        }
      };
      loadFrameType();
    }
  }, [id, isEditMode, getFrameType]);

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
        await updateFrameType(id, formData);
        showSuccess('Tipo de armação atualizado!', 'O tipo de armação foi atualizado com sucesso.');
      } else {
        await createFrameType(formData);
        showSuccess('Tipo de armação criado!', 'O tipo de armação foi criado com sucesso.');
      }

      // Redirecionar após um pequeno delay para mostrar a notificação
      setTimeout(() => {
        navigate('/frame-types');
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar tipo de armação:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar tipo de armação';
      setFormError(errorMessage);
      showError('Erro ao salvar tipo de armação', errorMessage);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteFrameType(id);
      showSuccess('Tipo de armação excluído com sucesso!');
      navigate('/frame-types');
    } catch (err: any) {
      console.error('Erro ao excluir tipo de armação:', err);
      showError(err.message || 'Erro ao excluir tipo de armação');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loadingFrameType) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 px-4 lg:px-6">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
            <p className="text-sm text-slate-500">Carregando dados do tipo de armação...</p>
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
            {isEditMode ? 'Editar Tipo de Armação' : 'Novo Tipo de Armação'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditMode ? 'Atualize os dados do tipo de armação' : 'Cadastre um novo tipo de armação no sistema'}
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
          <Button variant="secondary" onClick={() => navigate('/frame-types')}>
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
              label="Nome do Tipo de Armação *"
              placeholder="Ex: Acetato"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          

          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button type="button" onClick={() => navigate('/frame-types')} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Tipo de Armação
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
            Tem certeza que deseja excluir este tipo de armação?
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
