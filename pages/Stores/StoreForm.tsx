
import React, { useState } from 'react';
import { Save, ArrowLeft, Store, Building2, Palette, Image as ImageIcon, MapPin, Phone, Mail, QrCode } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/Common';

export const StoreForm: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#dc2626');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Nova Unidade</h1>
          <p className="text-gray-500 font-medium mt-1">Configure a identidade e os dados fiscais da filial.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Cancelar
          </Button>
          <Button className="shadow-red-600/20 px-8">
            <Save size={18} /> Criar Unidade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Dados e Endereço */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="Informações Fiscais" subtitle="Dados para emissão de notas e contratos">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <Input label="Nome Fantasia *" placeholder="Ex: Rei do Óculos - Maringá Centro" />
                </div>
                <Input label="Razão Social" placeholder="Empresa Óptica LTDA" />
                <Input label="CNPJ *" placeholder="00.000.000/0001-00" />
                <Input label="Inscrição Estadual" placeholder="999.999.999-99" />
                <Input label="Inscrição Municipal" placeholder="Opcional" />
             </div>
          </Card>

          <Card title="Localização & Contato" subtitle="Endereço da loja física e canais de atendimento">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <Input label="Endereço Completo" placeholder="Rua, Número, Bairro, Complemento" />
                </div>
                <Input label="Cidade / UF" placeholder="Maringá - PR" />
                <Input label="CEP" placeholder="87000-000" />
                <Input label="Telefone Fixo" placeholder="(00) 0000-0000" />
                <Input label="WhatsApp Loja" placeholder="(00) 99999-9999" />
                <div className="md:col-span-2">
                  <Input label="E-mail da Unidade" placeholder="contato@unidade.com.br" />
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
                   <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center bg-slate-50/50 hover:border-red-400 hover:bg-white transition-all cursor-pointer group">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                         <ImageIcon size={24} className="text-slate-300 group-hover:text-red-600" />
                      </div>
                      <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Subir Logotipo</p>
                      <p className="text-[8px] text-slate-400 font-medium mt-1">PNG ou SVG (Fundo Transparente)</p>
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-3 block">Cor de Destaque</label>
                   <div className="grid grid-cols-5 gap-3">
                      {['#dc2626', '#334155', '#059669', '#2563eb', '#7c3aed'].map((color) => (
                        <button
                          key={color}
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
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{selectedColor}</span>
                   </div>
                </div>
             </div>
          </Card>

          <Card title="Configurações Rápidas">
             <div className="space-y-4 mt-4">
                <Select label="Status Inicial" options={[
                  {label: 'Ativa (Disponível no PDV)', value: 'active'},
                  {label: 'Em Configuração', value: 'setup'},
                  {label: 'Desativada / Fechada', value: 'inactive'},
                ]} />
                <Select label="Tabelas de Preço" options={[
                  {label: 'Tabela Padrão (Varejo)', value: 'default'},
                  {label: 'Tabela Promoção Inauguração', value: 'promo'},
                ]} />
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
    </div>
  );
};
