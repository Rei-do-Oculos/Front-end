
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Store as StoreIcon, Building2, Palette, Image as ImageIcon, MapPin, Phone, Mail, QrCode, Trash2, X } from 'lucide-react';
import { Card, Button, Input, Select, Modal } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useStores } from '../../services/hooks/useStores';
import { Store } from '../../services/api/stores';
import { useNotification } from '../../hooks/useNotification';
import { normalizeEmail, normalizeToTitleCase } from '../../utils/formatters';

// Em dev: backend direto para /storage. Em prod: mesmo domínio (proxy) – API mascarada
const API_BASE_URL = import.meta.env.DEV ? '/api' : '/api';
const PUBLIC_BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin;

export const StoreForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  const [selectedColor, setSelectedColor] = useState('#3F4EC6');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode); // Inicia como true se estiver editando
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const { getStore, createStore, updateStore, deleteStore } = useStores({
    autoFetch: false,
  });

  const [formData, setFormData] = useState({
    name: '',
    unity: '',
    fancy_name: '',
    cnpj: '',
    ie: '',
    is_uf: '',
    cep: '',
    logradouro: '',
    complemento: '',
    numero: '',
    bairro: '',
    cod_municipio: '',
    municipio: '',
    uf: '',
    cod_pais: 1058,
    pais: 'BRASIL',
    telefone: '',
    email: '',
    fax: '',
    active: true,
    status: 'active',
  });

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      setError(null);
      const loadStore = async () => {
        try {
          const store = await getStore(id);
          if (store) {
            setSelectedColor(store.color || '#3F4EC6');
            setFormData({
              name: store.name || '',
              unity: store.unity || '',
              fancy_name: store.fancy_name || '',
              cnpj: store.cnpj || '',
              ie: store.ie || '',
              is_uf: store.is_uf || '',
              cep: store.cep || '',
              logradouro: store.logradouro || '',
              complemento: store.complemento || '',
              numero: store.numero || '',
              bairro: store.bairro || '',
              cod_municipio: store.cod_municipio || '',
              municipio: store.municipio || '',
              uf: store.uf || '',
              cod_pais: store.cod_pais || 1058,
              pais: store.pais || 'BRASIL',
              telefone: store.telefone || '',
              email: store.email || '',
              fax: store.fax || '',
              active: store.active ?? true,
            });
            
            const logoValue = store.logo ? String(store.logo) : '';
            if (logoValue && logoValue.toLowerCase() !== 'null') {
              let logoUrl = '';
              if (logoValue.startsWith('http://') || logoValue.startsWith('https://')) {
                logoUrl = logoValue;
              } else if (logoValue.startsWith('/storage/')) {
                logoUrl = `${PUBLIC_BASE_URL}${logoValue}`;
              } else {
                logoUrl = `${PUBLIC_BASE_URL}/storage/${logoValue}`;
              }
              setLogoPreview(logoUrl);
            } else {
              setLogoPreview(null);
            }
          } else {
            setError('Loja não encontrada');
          }
        } catch (err: any) {
          console.error('Erro ao carregar loja:', err);
          setError(err.response?.data?.message || err.message || 'Erro ao carregar dados da loja');
        } finally {
          setLoading(false);
        }
      };
      loadStore();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Limpar campos vazios e garantir tamanhos corretos
      const payload: any = {
        name: formData.name,
        unity: formData.unity || null,
        fancy_name: formData.fancy_name,
        cnpj: formData.cnpj,
        color: selectedColor,
        cep: formData.cep ? String(formData.cep).substring(0, 9) : '', // Limitar a 9 caracteres
        logradouro: formData.logradouro || '',
        numero: formData.numero || '',
        bairro: formData.bairro || '',
        cod_municipio: formData.cod_municipio ? String(formData.cod_municipio).substring(0, 7) : '', // Limitar a 7 caracteres
        municipio: formData.municipio || '',
        uf: formData.uf ? String(formData.uf).substring(0, 2).toUpperCase() : '', // Limitar a 2 caracteres
        cod_pais: formData.cod_pais,
        pais: formData.pais,
        active: formData.active,
      };

      // Adicionar campos opcionais apenas se não estiverem vazios
      if (formData.ie && formData.ie.trim()) {
        payload.ie = formData.ie;
      }
      if (formData.is_uf && formData.is_uf.trim()) {
        payload.is_uf = formData.is_uf;
      }
      if (formData.complemento && formData.complemento.trim()) {
        payload.complemento = formData.complemento;
      }
      if (formData.telefone && formData.telefone.trim()) {
        payload.telefone = formData.telefone;
      }
      if (formData.email && formData.email.trim()) {
        payload.email = formData.email;
      }
      if (formData.fax && formData.fax.trim()) {
        payload.fax = formData.fax;
      }

      if (logoFile) {
        payload.logo = logoFile;
      }

      if (isEditMode && id) {
        console.log('Atualizando loja:', id, payload);
        await updateStore(id, payload);
        showSuccess('Loja atualizada!', 'A loja foi atualizada com sucesso.');
      } else {
        console.log('Criando loja:', payload);
        await createStore(payload);
        showSuccess('Loja criada!', 'A loja foi criada com sucesso.');
      }

      navigate('/stores');
    } catch (err: any) {
      console.error('Erro ao salvar loja:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao salvar loja';
      setError(errorMessage);
      showError('Erro ao salvar loja', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (id) {
        await deleteStore(id);
        showSuccess('Loja excluída!', 'A loja foi excluída com sucesso.');
        navigate('/stores');
      }
    } catch (err: any) {
      console.error('Erro ao excluir loja:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir loja';
      showError('Erro ao excluir loja', errorMessage);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // Mostrar loading apenas se estiver carregando E em modo de edição
  if (isEditMode && loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--store-color)' }}></div>
      </div>
    );
  }

  // Se houver erro e estiver em modo de edição, mostrar erro
  if (isEditMode && error && !loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 lg:px-6">
        <div className="border rounded-xl p-6" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar loja</h2>
          <p style={{ color: 'var(--store-color)' }}>{error}</p>
          <button 
            onClick={() => navigate('/stores')}
            className="mt-4 px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--store-color)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--store-color-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--store-color)';
            }}
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            {isEditMode ? 'Editar Unidade' : 'Nova Unidade'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEditMode ? 'Atualize os dados da unidade' : 'Configure a identidade e os dados fiscais da filial.'}
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
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Cancelar
          </Button>
          <Button onClick={handleSubmit} className="px-8">
            <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Unidade
          </Button>
        </div>
      </div>

      {error && (
        <div className="border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <p className="font-medium" style={{ color: 'var(--store-color-dark)' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Dados e Endereço */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="Informações Fiscais" subtitle="Dados para emissão de notas e contratos">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <Input 
                    label="Nome Fantasia *" 
                    placeholder="Ex: Rei do Óculos - Maringá Centro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={(e) => {
                      const normalized = normalizeToTitleCase(e.target.value);
                      if (normalized !== e.target.value) setFormData({ ...formData, name: normalized });
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <Select 
                    label="Unidade" 
                    value={formData.unity}
                    onChange={(e) => setFormData({ ...formData, unity: e.target.value })}
                    options={[
                      { label: 'Selecione uma unidade', value: '' },
                      { label: 'Rei dos Oculos', value: 'Rei dos Oculos' },
                      { label: '99 Ótica', value: '99 Ótica' },
                    ]}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input 
                    label="Razão Social *" 
                    placeholder="Empresa Óptica LTDA"
                    value={formData.fancy_name}
                    onChange={(e) => setFormData({ ...formData, fancy_name: e.target.value })}
                    onBlur={(e) => {
                      const normalized = normalizeToTitleCase(e.target.value);
                      if (normalized !== e.target.value) setFormData({ ...formData, fancy_name: normalized });
                    }}
                  />
                </div>
                <Input 
                  label="CNPJ *" 
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
                <Input 
                  label="Inscrição Estadual" 
                  placeholder="999.999.999-99"
                  value={formData.ie}
                  onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                />
                <Input 
                  label="Inscrição Estadual na UF" 
                  placeholder="Opcional"
                  value={formData.is_uf}
                  onChange={(e) => setFormData({ ...formData, is_uf: e.target.value })}
                />
             </div>
          </Card>

          <Card title="Localização & Contato" subtitle="Endereço da loja física e canais de atendimento">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Input 
                  label="CEP *" 
                  placeholder="87000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                />
                <Input 
                  label="Logradouro *" 
                  placeholder="Avenida Brasil"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                />
                <Input 
                  label="Número *" 
                  placeholder="1234"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
                <Input 
                  label="Complemento" 
                  placeholder="Sala 101"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                />
                <Input 
                  label="Bairro *" 
                  placeholder="Centro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                />
                <Input 
                  label="Código do Município (IBGE) *" 
                  placeholder="4115200"
                  value={formData.cod_municipio}
                  onChange={(e) => setFormData({ ...formData, cod_municipio: e.target.value })}
                />
                <Input 
                  label="Município *" 
                  placeholder="Maringá"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                />
                <Input 
                  label="UF *" 
                  placeholder="PR"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
                <Input 
                  label="Telefone" 
                  placeholder="(44) 3025-1010"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
                <div className="md:col-span-2">
                  <Input 
                    label="E-mail da Unidade" 
                    placeholder="contato@unidade.com.br"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={(e) => {
                      const normalized = normalizeEmail(e.target.value);
                      if (normalized !== e.target.value) setFormData({ ...formData, email: normalized });
                    }}
                  />
                </div>
             </div>
          </Card>
        </div>

        {/* Coluna Lateral: Identidade Visual e Configurações */}
        <div className="space-y-8">
          <Card title="Identidade Visual">
             <div className="mt-4 space-y-6">
                <div>
                   <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">Logo da Unidade</label>
                   <label 
                     className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-white transition-all cursor-pointer group"
                     onMouseEnter={(e) => {
                       e.currentTarget.style.borderColor = 'var(--store-color-opacity-20)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.borderColor = '';
                     }}
                   >
                     <input
                       type="file"
                       accept="image/png,image/jpeg,image/svg+xml"
                       onChange={handleLogoChange}
                       className="hidden"
                     />
                     <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon 
                          size={24} 
                          className="text-slate-300"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--store-color-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '';
                          }}
                        />
                     </div>
                     <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Subir Logotipo</p>
                     <p className="text-[8px] text-slate-400 font-medium mt-1">PNG, JPG ou SVG (Máx 5MB)</p>
                   </label>
                   <div className="mt-4">
                     <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2">Preview</div>
                     {logoPreview ? (
                       <div className="relative">
                         <img 
                           src={logoPreview} 
                           alt="Logo preview" 
                           onError={() => setLogoPreview(null)}
                           className="w-full h-48 object-contain rounded-2xl border-2 border-slate-200 bg-white p-4"
                         />
                         <button
                           type="button"
                           onClick={handleRemoveLogo}
                           className="absolute top-2 right-2 p-2 text-white rounded-full transition-colors"
                           style={{ backgroundColor: 'var(--store-color)' }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.backgroundColor = 'var(--store-color-dark)';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.backgroundColor = 'var(--store-color)';
                           }}
                         >
                           <X size={16} />
                         </button>
                       </div>
                     ) : (
                       <div className="w-full h-48 rounded-2xl border-2 border-slate-200 bg-white/70 flex items-center justify-center">
                         <span className="text-xs text-slate-400 font-medium">Nenhuma logo carregada</span>
                       </div>
                     )}
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-3 block">Cor de Destaque *</label>
                  <div className="grid grid-cols-2 gap-3">
                     {['#dc2626', '#3F4EC6'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-full aspect-square rounded-xl transition-all ${
                            selectedColor === color ? 'ring-4 ring-offset-2 ring-slate-200 scale-90' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                   </div>
                   <div className="mt-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: selectedColor }}></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{selectedColor === '#dc2626' ? 'Vermelho' : 'Azul'}</span>
                   </div>
                </div>
             </div>
          </Card>

          <Card title="Configurações Rápidas">
             <div className="space-y-4 mt-4">
                <Select 
                  label="Status Inicial" 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    {label: 'Ativa (Disponível no PDV)', value: 'active'},
                    {label: 'Em Configuração', value: 'setup'},
                    {label: 'Desativada / Fechada', value: 'inactive'},
                  ]} 
                />
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                   <QrCode size={20} className="text-amber-600 shrink-0" />
                   <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                     Ao salvar, um <span className="font-bold">QR Code</span> único será gerado para esta unidade para acesso rápido ao catálogo.
                   </p>
                </div>
             </div>
          </Card>
        </div>
      </div>
      </form>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Excluir Unidade"
        message="Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        size="md"
      />
    </div>
  );
};
