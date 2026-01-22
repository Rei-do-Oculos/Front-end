
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Store, Building2, Palette, Image as ImageIcon, MapPin, Phone, Mail, QrCode, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/Common';
import { useParams } from 'react-router-dom';

// Mock de dados - substituir por chamada de API
const mockStores = [
  { id: '1', name: 'Maringá Centro', fancyName: 'Rei do Óculos - Matriz', cnpj: '12.345.678/0001-01', city: 'Maringá - PR', phone: '(44) 3025-1010', color: '#dc2626', status: 'active' },
  { id: '2', name: 'Londrina Shopping', fancyName: 'Rei do Óculos - Catuaí', cnpj: '12.345.678/0002-02', city: 'Londrina - PR', phone: '(43) 3322-4455', color: '#334155', status: 'active' },
];

export const StoreForm: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [selectedColor, setSelectedColor] = useState('#dc2626');
  const [formData, setFormData] = useState({
    fancyName: '',
    corporateName: '',
    cnpj: '',
    stateRegistration: '',
    municipalRegistration: '',
    address: '',
    city: '',
    cep: '',
    phone: '',
    whatsapp: '',
    email: '',
    status: 'active',
    priceTable: 'default'
  });

  useEffect(() => {
    if (isEditMode) {
      const store = mockStores.find(s => s.id === id);
      if (store) {
        setSelectedColor(store.color);
        setFormData({
          fancyName: store.fancyName,
          corporateName: '',
          cnpj: store.cnpj,
          stateRegistration: '',
          municipalRegistration: '',
          address: '',
          city: store.city,
          cep: '',
          phone: store.phone,
          whatsapp: '',
          email: '',
          status: store.status,
          priceTable: 'default'
        });
      }
    }
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Atualizando loja:' : 'Criando loja:', { ...formData, color: selectedColor });
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta unidade?')) {
      console.log('Deletando loja:', id);
      window.location.hash = '#/lojas';
    }
  };

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
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 size={18} /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Cancelar
          </Button>
          <Button onClick={handleSubmit} className="shadow-red-600/20 px-8">
            <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Unidade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Dados e Endereço */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="Informações Fiscais" subtitle="Dados para emissão de notas e contratos">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <Input 
                    label="Nome Fantasia *" 
                    placeholder="Ex: Rei do Óculos - Maringá Centro"
                    value={formData.fancyName}
                    onChange={(e) => setFormData({ ...formData, fancyName: e.target.value })}
                  />
                </div>
                <Input 
                  label="Razão Social" 
                  placeholder="Empresa Óptica LTDA"
                  value={formData.corporateName}
                  onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                />
                <Input 
                  label="CNPJ *" 
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
                <Input 
                  label="Inscrição Estadual" 
                  placeholder="999.999.999-99"
                  value={formData.stateRegistration}
                  onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                />
                <Input 
                  label="Inscrição Municipal" 
                  placeholder="Opcional"
                  value={formData.municipalRegistration}
                  onChange={(e) => setFormData({ ...formData, municipalRegistration: e.target.value })}
                />
             </div>
          </Card>

          <Card title="Localização & Contato" subtitle="Endereço da loja física e canais de atendimento">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <Input 
                    label="Endereço Completo" 
                    placeholder="Rua, Número, Bairro, Complemento"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <Input 
                  label="Cidade / UF" 
                  placeholder="Maringá - PR"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input 
                  label="CEP" 
                  placeholder="87000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                />
                <Input 
                  label="Telefone Fixo" 
                  placeholder="(00) 0000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input 
                  label="WhatsApp Loja" 
                  placeholder="(00) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
                <div className="md:col-span-2">
                  <Input 
                    label="E-mail da Unidade" 
                    placeholder="contato@unidade.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <Select 
                  label="Tabelas de Preço" 
                  value={formData.priceTable}
                  onChange={(e) => setFormData({ ...formData, priceTable: e.target.value })}
                  options={[
                    {label: 'Tabela Padrão (Varejo)', value: 'default'},
                    {label: 'Tabela Promoção Inauguração', value: 'promo'},
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
    </div>
  );
};
