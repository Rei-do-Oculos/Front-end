
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Building2, User, Phone, Globe, Briefcase, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/Common';
import { useParams } from 'react-router-dom';

// Mock de dados - substituir por chamada de API
const mockSuppliers = [
  { id: '1', name: 'Laboratório Óptico Maringá', corporateName: 'Lab Óptico LTDA', cnpj: '12.345.678/0001-01', type: 'lab', stateRegistration: '', consultant: 'João Silva', phone: '(44) 99999-9999', email: 'comercial@lab.com', site: '', paymentTerm: '30d', discount: '10', address: '' },
];

export const SupplierForm: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [formData, setFormData] = useState({
    name: '',
    corporateName: '',
    cnpj: '',
    type: '',
    stateRegistration: '',
    consultant: '',
    phone: '',
    email: '',
    site: '',
    paymentTerm: '',
    discount: '',
    address: ''
  });

  useEffect(() => {
    if (isEditMode) {
      const supplier = mockSuppliers.find(s => s.id === id);
      if (supplier) {
        setFormData({
          name: supplier.name,
          corporateName: supplier.corporateName,
          cnpj: supplier.cnpj,
          type: supplier.type,
          stateRegistration: supplier.stateRegistration,
          consultant: supplier.consultant,
          phone: supplier.phone,
          email: supplier.email,
          site: supplier.site,
          paymentTerm: supplier.paymentTerm,
          discount: supplier.discount,
          address: supplier.address
        });
      }
    }
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Atualizando fornecedor:' : 'Criando fornecedor:', formData);
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      console.log('Deletando fornecedor:', id);
      window.location.hash = '#/fornecedores';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            {isEditMode ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEditMode ? 'Atualize os dados do fornecedor' : 'Cadastre laboratórios ou distribuidores parceiros.'}
          </p>
        </div>
        <div className="flex gap-3">
          {isEditMode && (
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 size={18} /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Voltar
          </Button>
          <Button onClick={handleSubmit} className="shadow-red-600/20 px-8">
            <Save size={18} /> {isEditMode ? 'Atualizar' : 'Salvar'} Fornecedor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card title="Dados Institucionais" subtitle="Informações fiscais e razão social">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <div className="md:col-span-2">
               <Input 
                 label="Nome Fantasia / Nome do Laboratório" 
                 placeholder="Ex: Laboratório Óptico Maringá"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               />
             </div>
             <Input 
               label="Razão Social" 
               placeholder="Razão Social LTDA"
               value={formData.corporateName}
               onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
             />
             <Input 
               label="CNPJ" 
               placeholder="00.000.000/0001-00"
               value={formData.cnpj}
               onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
             />
             <Select 
               label="Tipo de Fornecedor" 
               value={formData.type}
               onChange={(e) => setFormData({ ...formData, type: e.target.value })}
               options={[
                 {label: 'Laboratório de Lentes', value: 'lab'},
                 {label: 'Distribuidora de Armações', value: 'frame'},
                 {label: 'Insumos e Acessórios', value: 'supplies'},
                 {label: 'Maquinário', value: 'machinery'},
               ]} 
             />
             <Input 
               label="Inscrição Estadual" 
               placeholder="Opcional"
               value={formData.stateRegistration}
               onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
             />
          </div>
        </Card>

        <Card title="Contato & Consultoria" subtitle="Quem atende sua ótica neste fornecedor">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <Input 
               label="Nome do Consultor / Vendedor" 
               placeholder="Nome do contato principal"
               value={formData.consultant}
               onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
             />
             <Input 
               label="Telefone de Contato" 
               placeholder="(00) 00000-0000"
               value={formData.phone}
               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
             />
             <Input 
               label="E-mail Comercial" 
               placeholder="comercial@fornecedor.com.br"
               value={formData.email}
               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
             />
             <Input 
               label="Site / Portal de Pedidos" 
               placeholder="https://..."
               value={formData.site}
               onChange={(e) => setFormData({ ...formData, site: e.target.value })}
             />
          </div>
        </Card>

        <Card title="Financeiro & Logística" subtitle="Prazos e localização">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <Select 
               label="Prazo de Pagamento Padrão" 
               value={formData.paymentTerm}
               onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
               options={[
                 {label: 'À Vista', value: 'av'},
                 {label: '7 Dias', value: '7d'},
                 {label: '15 Dias', value: '15d'},
                 {label: '30 Dias (Mensalidade)', value: '30d'},
                 {label: 'Consignado', value: 'cons'},
               ]} 
             />
             <Input 
               label="Desconto Acordado (%)" 
               placeholder="Ex: 10%"
               value={formData.discount}
               onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
             />
             <div className="md:col-span-2">
               <Input 
                 label="Endereço Completo" 
                 placeholder="Rua, Número, Bairro, Cidade - UF"
                 value={formData.address}
                 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
               />
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
