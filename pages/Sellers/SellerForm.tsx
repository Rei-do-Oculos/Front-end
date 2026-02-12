import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Phone, Mail, Target, Percent, Store, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/Common';
import { useParams } from 'react-router-dom';
import { normalizeEmail, normalizeToTitleCase } from '../../utils/formatters';

// Mock de dados - substituir por chamada de API
const mockSellers = [
  { id: 'v-102', name: 'Carla Nascimento', email: 'carla@email.com', phone: '(44) 99999-9999', cpf: '123.456.789-00', admissionDate: '2024-01-15', goal: 60000, commission: 2.5, ticket: 850, conversion: 65, store: 'maringa', status: 'ativo' },
];

export const SellerForm: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    admissionDate: '',
    goal: '',
    commission: '',
    ticket: '',
    conversion: '',
    store: '',
    status: 'ativo'
  });

  useEffect(() => {
    if (isEditMode) {
      const seller = mockSellers.find(s => s.id === id);
      if (seller) {
        setFormData({
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          cpf: seller.cpf,
          admissionDate: seller.admissionDate,
          goal: seller.goal.toString(),
          commission: seller.commission.toString(),
          ticket: seller.ticket.toString(),
          conversion: seller.conversion.toString(),
          store: seller.store,
          status: seller.status
        });
      }
    }
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Atualizando vendedor:' : 'Criando vendedor:', formData);
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este vendedor?')) {
      console.log('Deletando vendedor:', id);
      window.location.hash = '#/vendedores';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            {isEditMode ? 'Editar Vendedor' : 'Novo Vendedor'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEditMode ? 'Atualize os dados do vendedor' : 'Cadastre um vendedor e defina metas e comissão.'}
          </p>
        </div>
        <div className="flex gap-3">
          {isEditMode && (
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 size={18} /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Cancelar
          </Button>
          <Button onClick={handleSubmit} className="shadow-red-600/20 px-8">
            <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Vendedor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Dados do vendedor" subtitle="Informações pessoais e contato">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="md:col-span-2">
                <Input 
                  label="Nome completo *" 
                  placeholder="Ex: Carla Nascimento" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={(e) => {
                    const normalized = normalizeToTitleCase(e.target.value);
                    if (normalized !== e.target.value) setFormData({ ...formData, name: normalized });
                  }}
                  required 
                />
              </div>
              <Input 
                label="E-mail" 
                placeholder="nome@email.com" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={(e) => {
                  const normalized = normalizeEmail(e.target.value);
                  if (normalized !== e.target.value) setFormData({ ...formData, email: normalized });
                }}
              />
              <Input 
                label="Telefone" 
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input 
                label="CPF" 
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
              <Input 
                label="Data de admissão" 
                type="date"
                value={formData.admissionDate}
                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
              />
            </div>
          </Card>

          <Card title="Metas & comissão" subtitle="Indicadores usados para cálculo de performance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Input 
                label="Meta mensal (R$)" 
                placeholder="60000" 
                type="number"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              />
              <Input 
                label="Comissão (%)" 
                placeholder="2.5" 
                type="number" 
                step="0.1"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
              />
              <Input 
                label="Ticket médio desejado (R$)" 
                placeholder="850" 
                type="number"
                value={formData.ticket}
                onChange={(e) => setFormData({ ...formData, ticket: e.target.value })}
              />
              <Input 
                label="Meta de conversão (%)" 
                placeholder="65" 
                type="number"
                value={formData.conversion}
                onChange={(e) => setFormData({ ...formData, conversion: e.target.value })}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card title="Vínculo de unidade">
            <div className="space-y-6 mt-4">
              <Select
                label="Unidade"
                value={formData.store}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                options={[
                  { label: 'Selecione', value: '' },
                  { label: 'Maringá Centro', value: 'maringa' },
                  { label: 'Londrina Shopping', value: 'londrina' },
                  { label: 'Curitiba Batel', value: 'curitiba' },
                ]}
              />
              <Select
                label="Status inicial"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { label: 'Ativo', value: 'ativo' },
                  { label: 'Inativo', value: 'inativo' },
                ]}
              />
            </div>
          </Card>

          <Card title="Resumo rápido">
            <div className="space-y-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <User size={14} className="text-red-600" />
                Perfil completo melhora o acompanhamento da equipe.
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-red-600" />
                Utilize e-mail corporativo para comunicações internas.
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-red-600" />
                WhatsApp facilita o contato com a unidade.
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-red-600" />
                Metas bem definidas ajudam a elevar a performance.
              </div>
              <div className="flex items-center gap-2">
                <Percent size={14} className="text-red-600" />
                Comissão pode variar conforme campanhas do mês.
              </div>
              <div className="flex items-center gap-2">
                <Store size={14} className="text-red-600" />
                Defina a unidade principal do vendedor.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
