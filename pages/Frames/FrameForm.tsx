import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Card, Button, Input, SingleSelect, Modal } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useFrames } from '../../services/hooks/useFrames';
import { CreateFrameDto, UpdateFrameDto } from '../../services/api/frames';
import { useFrameTypes } from '../../services/hooks/useFrameTypes';
import { useStore } from '../../contexts/StoreContext';
import { useNotification } from '../../hooks/useNotification';

export const FrameForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { selectedStore } = useStore();
  const isEditMode = !!id;
  
  const { getFrame, createFrame, updateFrame, deleteFrame, loading } = useFrames({
    autoFetch: false,
  });
  const { frameTypes, fetchFrameTypes } = useFrameTypes({ autoFetch: false });

  const [formData, setFormData] = useState<CreateFrameDto>({
    description: '',
    code: '',
    frame_type_id: 0,
    gender: 'unissex',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [loadingFrame, setLoadingFrame] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOtherStoreFrame, setIsOtherStoreFrame] = useState(false);

  // Carregar tipos de armação
  useEffect(() => {
    const load = async () => {
      try {
        await fetchFrameTypes(1, { per_page: 100 });
      } catch (err) {
        console.error('Erro ao carregar tipos de armação:', err);
      }
    };
    load();
  }, [fetchFrameTypes]);

  // Carregar dados da armação se estiver editando
  useEffect(() => {
    if (isEditMode && id) {
      const loadFrame = async () => {
        setLoadingFrame(true);
        try {
          const frame = await getFrame(id);
          if (frame) {
            // Verificar se frame pertence à loja atual
            const frameStoreId = frame.latestStoreFrame?.toStore?.id || frame.latest_store_frame?.to_store?.id;
            const currentStoreId = selectedStore?.id;
            const isOtherStore = currentStoreId !== undefined && frameStoreId !== currentStoreId;
            setIsOtherStoreFrame(isOtherStore);
            
            // Se for frame de outra loja e estiver editando, redirecionar
            if (isOtherStore && isEditMode) {
              showError('Não é possível editar armação de outra loja.');
              navigate(`/frames/${id}`);
              return;
            }
            
            setFormData({
              description: frame.description || '',
              code: frame.code || '',
              frame_type_id: frame.frame_type_id || 0,
              gender: frame.gender || 'unissex',
            });
          }
        } catch (err: any) {
          console.error('Erro ao carregar armação:', err);
          setFormError(err.message || 'Erro ao carregar dados da armação');
        } finally {
          setLoadingFrame(false);
        }
      };
      loadFrame();
    }
  }, [id, isEditMode, getFrame]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações básicas
    if (!formData.description.trim()) {
      setFormError('A descrição é obrigatória');
      showError('Validação', 'A descrição é obrigatória');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('O código é obrigatório');
      showError('Validação', 'O código é obrigatório');
      return;
    }
    if (!formData.frame_type_id || formData.frame_type_id === 0) {
      setFormError('O tipo de armação é obrigatório');
      showError('Validação', 'O tipo de armação é obrigatório');
      return;
    }
    if (!isEditMode && !selectedStore?.id) {
      setFormError('Selecione uma loja no cabeçalho para cadastrar a armação.');
      showError('Validação', 'Selecione a loja no topo da página.');
      return;
    }

    try {
      if (isEditMode && id) {
        await updateFrame(id, formData);
        showSuccess('Armação atualizada!', 'A armação foi atualizada com sucesso.');
        // Em edição, mantém redirecionamento para a listagem
        setTimeout(() => {
          navigate('/frames');
        }, 1000);
      } else {
        await createFrame({ ...formData, store_id: selectedStore!.id });
        showSuccess('Armação criada!', 'A armação foi criada com sucesso.');
        // Em criação, permanece na tela conforme solicitado
        setFormData({
          description: '',
          code: '',
          frame_type_id: 0,
          gender: 'unissex',
        });
      }
    } catch (err: any) {
      console.error('Erro ao salvar armação:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar armação';
      setFormError(errorMessage);
      showError('Erro ao salvar armação', errorMessage);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteFrame(id);
      showSuccess('Armação excluída com sucesso!');
      navigate('/frames');
    } catch (err: any) {
      console.error('Erro ao excluir armação:', err);
      showError(err.message || 'Erro ao excluir armação');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const frameTypesList = Array.isArray(frameTypes) ? frameTypes : [];

  if (loadingFrame) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 px-4 lg:px-6">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
            <p className="text-sm text-slate-500">Carregando dados da armação...</p>
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
            {isEditMode ? 'Editar Armação' : 'Nova Armação'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditMode ? 'Atualize os dados da armação' : 'Cadastre uma nova armação no sistema'}
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
          <Button variant="secondary" onClick={() => navigate('/frames')}>
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
          <fieldset disabled={isOtherStoreFrame} className="disabled:opacity-70">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Descrição *"
              placeholder="Ex: Armação Acetato Preta"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <Input
              label="Código *"
              placeholder="Ex: 1234"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <SingleSelect
              label="Tipo de Armação *"
              value={formData.frame_type_id > 0 ? String(formData.frame_type_id) : ''}
              onChange={(val) => setFormData({ ...formData, frame_type_id: val ? Number(val) : 0 })}
              options={frameTypesList.map(ft => ({ label: ft.name, value: String(ft.id) }))}
              placeholder="Selecione um tipo de armação"
            />
            <SingleSelect
              label="Gênero *"
              value={formData.gender}
              onChange={(val) => setFormData({ ...formData, gender: (val || 'unissex') as 'masculino' | 'feminino' | 'unissex' })}
              options={[
                { label: 'Unissex', value: 'unissex' },
                { label: 'Masculino', value: 'masculino' },
                { label: 'Feminino', value: 'feminino' },
              ]}
              placeholder="Selecione o gênero"
            />
            {!isEditMode && selectedStore && (
              <div className="space-y-1.5 lg:space-y-2 w-full">
                <span className="text-[10px] lg:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">Loja</span>
                <p className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700">
                  {selectedStore.fancy_name || selectedStore.name}
                </p>
              </div>
            )}
          </div>
          
          {isOtherStoreFrame && (
            <div className="p-6 rounded-xl border-2 border-red-400 bg-red-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">Armação de Outra Loja</h3>
                  <p className="text-sm text-red-800">
                    Esta armação pertence a outra loja. Você pode visualizar, mas não pode editar.
                  </p>
                </div>
              </div>
            </div>
          )}

          </fieldset>
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button type="button" onClick={() => navigate('/frames')} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isOtherStoreFrame}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Armação
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
            Tem certeza que deseja excluir esta armação?
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
