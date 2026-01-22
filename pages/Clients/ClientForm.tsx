
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/Common';
import { useParams } from 'react-router-dom';

// Mock de dados - substituir por chamada de API
const mockClients = [
  { id: '39832', name: 'Maria das Graças dos Santos', cpf: '123.456.789-00', phone1: '(44) 99918-6060', phone2: '', note: '' },
  { id: '39831', name: 'Elisangela de oliveira batista', cpf: '041.771.539-07', phone1: '(43) 99933-5877', phone2: '', note: '' },
];

export const ClientForm: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone1: '',
    phone2: '',
    note: ''
  });

  useEffect(() => {
    if (isEditMode) {
      const client = mockClients.find(c => c.id === id);
      if (client) {
        setFormData({
          name: client.name,
          cpf: client.cpf,
          phone1: client.phone1,
          phone2: client.phone2 || '',
          note: client.note || ''
        });
      }
    }
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria a chamada da API
    console.log(isEditMode ? 'Atualizando cliente:' : 'Criando cliente:', formData);
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      // Aqui seria a chamada da API para deletar
      console.log('Deletando cliente:', id);
      window.location.hash = '#/clientes';
    }
  };

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
          {isEditMode && (
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 size={18} /> Excluir
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Voltar
          </Button>
        </div>
      </div>

      <Card title="Dados do cliente">
        <p className="text-xs text-gray-400 mb-6 italic">Utilize esta tela para cadastrar ou atualizar os dados básicos do cliente.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input 
                label="Nome *" 
                placeholder="Nome completo do cliente" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
            <Input 
              label="CPF" 
              placeholder="000.000.000-00" 
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            />
            <Input 
              label="Recado" 
              placeholder="Pessoa de contato ou observação" 
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
            <Input 
              label="Telefone 1 *" 
              placeholder="(00) 00000-0000" 
              value={formData.phone1}
              onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
              required 
            />
            <Input 
              label="Telefone 2" 
              placeholder="(00) 00000-0000" 
              value={formData.phone2}
              onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
            <Button variant="primary" type="submit" className="px-8">
              <Save size={18} /> {isEditMode ? 'Atualizar' : 'Salvar'} Cliente
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
