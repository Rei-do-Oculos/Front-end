
import React from 'react';
import { Save, ArrowLeft, Building2, User, Phone, Globe, Briefcase } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/Common';

export const SupplierForm: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Novo Fornecedor</h1>
          <p className="text-gray-500 font-medium mt-1">Cadastre laboratórios ou distribuidores parceiros.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Voltar
          </Button>
          <Button className="shadow-red-600/20 px-8">
            <Save size={18} /> Salvar Fornecedor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card title="Dados Institucionais" subtitle="Informações fiscais e razão social">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <div className="md:col-span-2">
               <Input label="Nome Fantasia / Nome do Laboratório" placeholder="Ex: Laboratório Óptico Maringá" />
             </div>
             <Input label="Razão Social" placeholder="Razão Social LTDA" />
             <Input label="CNPJ" placeholder="00.000.000/0001-00" />
             <Select label="Tipo de Fornecedor" options={[
               {label: 'Laboratório de Lentes', value: 'lab'},
               {label: 'Distribuidora de Armações', value: 'frame'},
               {label: 'Insumos e Acessórios', value: 'supplies'},
               {label: 'Maquinário', value: 'machinery'},
             ]} />
             <Input label="Inscrição Estadual" placeholder="Opcional" />
          </div>
        </Card>

        <Card title="Contato & Consultoria" subtitle="Quem atende sua ótica neste fornecedor">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <Input label="Nome do Consultor / Vendedor" placeholder="Nome do contato principal" />
             <Input label="Telefone de Contato" placeholder="(00) 00000-0000" />
             <Input label="E-mail Comercial" placeholder="comercial@fornecedor.com.br" />
             <Input label="Site / Portal de Pedidos" placeholder="https://..." />
          </div>
        </Card>

        <Card title="Financeiro & Logística" subtitle="Prazos e localização">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <Select label="Prazo de Pagamento Padrão" options={[
               {label: 'À Vista', value: 'av'},
               {label: '7 Dias', value: '7d'},
               {label: '15 Dias', value: '15d'},
               {label: '30 Dias (Mensalidade)', value: '30d'},
               {label: 'Consignado', value: 'cons'},
             ]} />
             <Input label="Desconto Acordado (%)" placeholder="Ex: 10%" />
             <div className="md:col-span-2">
               <Input label="Endereço Completo" placeholder="Rua, Número, Bairro, Cidade - UF" />
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
