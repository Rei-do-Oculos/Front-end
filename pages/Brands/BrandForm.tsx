
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { normalizeToTitleCase } from '../../utils/formatters';

// Mock de dados - substituir por chamada de API
const mockBrands = [
  { id: '1', name: 'Essilor' },
  { id: '2', name: 'Hoya' },
  { id: '3', name: 'Zeiss' },
];

export const BrandForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [name, setName] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const brand = mockBrands.find(b => b.id === id);
      if (brand) {
        setName(brand.name);
      }
    }
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria a lógica de salvar
    console.log(isEditMode ? 'Atualizando marca:' : 'Salvando marca:', name);
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta marca?')) {
      // Aqui seria a chamada da API para deletar
      console.log('Deletando marca:', id);
      navigate('/lenses');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-500 pb-20 px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            {isEditMode ? 'Editar Marca de Lente' : 'Nova Marca de Lente'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEditMode ? 'Atualize os dados da marca' : 'Cadastre uma nova marca de lente no sistema.'}
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
        </div>
      </div>

      <Card title="Dados da Marca" subtitle="Informações básicas da marca de lente">
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Input
              label="Nome da Marca *"
              placeholder="Ex: Essilor, Hoya, Zeiss..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeToTitleCase(e.target.value);
                if (normalized !== e.target.value) setName(normalized);
              }}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="shadow-red-600/20 px-8">
              <Save size={18} /> {isEditMode ? 'Atualizar' : 'Salvar'} Marca
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
