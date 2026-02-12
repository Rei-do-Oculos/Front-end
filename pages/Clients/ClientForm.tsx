import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../../services/hooks/useClients';
import { CreateClientDto, UpdateClientDto } from '../../services/api/clients';
import { useStore } from '../../contexts/StoreContext';
import { usePermission } from '../../services/hooks/usePermission';
import { useNotification } from '../../hooks/useNotification';
import { normalizeEmail, normalizeToTitleCase } from '../../utils/formatters';

export const ClientForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedStore, availableStores } = useStore();
  const { hasPermission } = usePermission();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  
  const { getClient, createClient, updateClient, deleteClient, loading } = useClients({
    autoFetch: false,
  });

  const [formData, setFormData] = useState<CreateClientDto>({
    name: '',
    email: '',
    phone: '',
    document: '',
  });

  const [loadingClient, setLoadingClient] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carregar dados do cliente se estiver editando
  useEffect(() => {
    if (isEditMode && id) {
      const loadClient = async () => {
        setLoadingClient(true);
        try {
          const client = await getClient(id);
          if (client) {
            setFormData({
              name: client.name || '',
              email: client.email || '',
              phone: client.phone || '',
              document: client.document || '',
            });
          }
        } catch (err: any) {
          console.error('Erro ao carregar cliente:', err);
          showError('Erro ao carregar cliente', err.message || 'Erro ao carregar dados do cliente');
        } finally {
          setLoadingClient(false);
        }
      };
      loadClient();
    }
  }, [id, isEditMode, getClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações (conforme backend: name, phone, document obrigatórios)
    if (!formData.name.trim()) {
      showError('Validação', 'O nome é obrigatório');
      return;
    }
    if (!formData.phone.trim()) {
      showError('Validação', 'O telefone é obrigatório');
      return;
    }
    if (!formData.document || !formData.document.replace(/\D/g, '').trim()) {
      showError('Validação', 'O CPF/CNPJ é obrigatório');
      return;
    }

    try {
      if (isEditMode && id) {
        await updateClient(id, formData);
        showSuccess('Cliente atualizado!', 'O cliente foi atualizado com sucesso.');
      } else {
        // Sempre incluir a loja logada ao criar o cliente
        // Se não houver loja selecionada, usar a primeira disponível
        const storeId = selectedStore?.id || (availableStores.length > 0 ? availableStores[0].id : null);
        
        if (!storeId) {
          showError('Validação', 'É necessário ter uma loja selecionada para criar um cliente');
          return;
        }
        
        const createData: CreateClientDto = {
          ...formData,
          email: formData.email && formData.email.trim() ? formData.email.trim() : null,
          stores: [storeId],
        };
        await createClient(createData);
        showSuccess('Cliente criado!', 'O cliente foi criado com sucesso.');
      }

      // Redirecionar após um pequeno delay para mostrar a notificação
      setTimeout(() => {
        navigate('/clients');
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      const errorMessage = err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar cliente';
      showError('Erro ao salvar cliente', errorMessage);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteClient(id);
      showSuccess('Cliente excluído!', 'O cliente foi excluído com sucesso.');
      setDeleteModalOpen(false);
      
      setTimeout(() => {
        navigate('/clients');
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      showError('Erro ao excluir cliente', err.message || 'Erro ao excluir cliente');
    } finally {
      setDeleting(false);
    }
  };

  const formatDocument = (value: string) => {
    // Remover tudo que não é dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Aplicar máscara de CPF: 000.000.000-00
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    return value;
  };

  const formatPhone = (value: string) => {
    // Remover tudo que não é dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Aplicar máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
      } else {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
      }
    }
    
    return value;
  };

  if (loadingClient) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 px-4 lg:px-6">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
            <p className="text-sm text-slate-500">Carregando dados do cliente...</p>
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
            {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditMode ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente no sistema'}
          </p>
        </div>
        <div className="flex gap-3">
          {isEditMode && hasPermission('clients.delete') && (
            <Button 
              variant="outline" 
              onClick={handleDeleteClick} 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={18} /> Excluir
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/clients')}>
            <ArrowLeft size={18} /> Voltar
          </Button>
        </div>
      </div>

      <Card title="Dados do cliente">
        {/* Mensagem informativa sobre a loja (apenas no modo de criação) */}
        {!isEditMode && (selectedStore || availableStores.length > 0) && (
          <p className="text-xs text-slate-500 mb-4">
            <span className="text-slate-400">Loja:</span>{' '}
            <span style={{ color: 'var(--store-color)' }}>
              {selectedStore?.fancy_name || selectedStore?.name || availableStores[0]?.fancy_name || availableStores[0]?.name || 'Nenhuma loja selecionada'}
            </span>
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nome *" 
              placeholder="Nome completo do cliente" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={(e) => {
                const normalized = normalizeToTitleCase(e.target.value);
                if (normalized !== e.target.value) setFormData({ ...formData, name: normalized });
              }}
              required 
            />
            <Input 
              label="Telefone *" 
              placeholder="(00) 00000-0000" 
              value={formData.phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setFormData({ ...formData, phone: formatted });
              }}
              required 
              maxLength={15}
            />
            <Input 
              label="CPF/CNPJ *" 
              placeholder="000.000.000-00" 
              value={formData.document}
              onChange={(e) => {
                const formatted = formatDocument(e.target.value);
                setFormData({ ...formData, document: formatted });
              }}
              required
              maxLength={14}
            />
            <Input 
              label="E-mail" 
              type="email"
              placeholder="cliente@exemplo.com" 
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
              onBlur={(e) => {
                const normalized = normalizeEmail(e.target.value);
                if (normalized !== e.target.value) setFormData({ ...formData, email: normalized || null });
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate('/clients')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              className="px-8"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> {isEditMode ? 'Atualizar' : 'Salvar'} Cliente
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
            Tem certeza que deseja excluir o cliente <strong>{formData.name}</strong>?
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
