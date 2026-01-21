
import React from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Card, Button, Input } from '../../components/Common';

export const ClientForm: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Novo Cliente</h1>
          <p className="text-gray-500 text-sm">Cadastre um novo cliente no sistema</p>
        </div>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>

      <Card title="Dados do cliente">
        <p className="text-xs text-gray-400 mb-6 italic">Utilize esta tela para cadastrar ou atualizar os dados básicos do cliente.</p>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input label="Nome *" placeholder="Nome completo do cliente" required />
            </div>
            <Input label="CPF" placeholder="000.000.000-00" />
            <Input label="Recado" placeholder="Pessoa de contato ou observação" />
            <Input label="Telefone 1 *" placeholder="(00) 00000-0000" required />
            <Input label="Telefone 2" placeholder="(00) 00000-0000" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
            <Button variant="primary" type="submit" className="px-8">
              <Save size={18} /> Salvar Cliente
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
