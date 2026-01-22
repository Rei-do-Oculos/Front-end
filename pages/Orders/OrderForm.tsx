
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Upload, FileText, Smartphone, Beaker, Truck, CheckCircle2, DollarSign, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '../../components/Common';
import { useParams } from 'react-router-dom';

// Mock de dados - substituir por chamada de API
const mockOrders = [
  { id: '39832', client: 'Maria das Graças', doctor: 'Dr. João Silva', crm: '12345-PR', status: 'pendente' },
];

export const OrderForm: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const [status, setStatus] = useState('pendente');
  const [formData, setFormData] = useState({
    client: '',
    doctor: '',
    crm: '',
  });

  useEffect(() => {
    if (isEditMode) {
      const order = mockOrders.find(o => o.id === id);
      if (order) {
        setStatus(order.status);
        setFormData({
          client: order.client,
          doctor: order.doctor,
          crm: order.crm,
        });
      }
    }
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Atualizando pedido:' : 'Criando pedido:', { ...formData, status });
    window.history.back();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      console.log('Deletando pedido:', id);
      window.location.hash = '#/pedidos';
    }
  };

  const RxField = ({ label, side }: { label: string; side: string }) => (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{side}</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Esférico" placeholder="00,00" />
        <Input label="Cilíndrico" placeholder="00,00" />
        <Input label="Eixo" placeholder="00°" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32 px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            {isEditMode ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEditMode ? 'Atualize os dados da ordem de serviço' : 'Configure as lentes, armação e status da produção.'}
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
          <Button onClick={handleSubmit} className="shadow-red-600/20">
            <Save size={18} /> {isEditMode ? 'Atualizar' : 'Salvar'} Pedido
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Dados do Paciente">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input 
                    label="Cliente (Busca automática)" 
                    placeholder="Digite nome, CPF ou Celular..."
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  />
                </div>
                <Input 
                  label="Médico / Oftalmologista" 
                  placeholder="Dr. Nome do Médico"
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                />
                <Input 
                  label="CRM Médico" 
                  placeholder="000000-UF"
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                />
             </div>
          </Card>

          <Card title="Receituário (Longe / Perto)">
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RxField label="Longe OD" side="VISÃO LONGE - OD" />
                <RxField label="Longe OE" side="VISÃO LONGE - OE" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 pt-8">
                <RxField label="Perto OD" side="VISÃO PERTO - OD" />
                <RxField label="Perto OE" side="VISÃO PERTO - OE" />
              </div>
              <div className="flex gap-6 items-end justify-end">
                <div className="w-40"><Input label="Adição" placeholder="+0,00" /></div>
                <div className="w-40"><Input label="DNP Longe" placeholder="00/00" /></div>
                <div className="w-40"><Input label="DNP Perto" placeholder="00/00" /></div>
              </div>
            </div>
          </Card>

          <Card title="Armação e Lentes">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Input label="Código Armação Estoque" placeholder="Escaneie ou digite..." />
                  <div className="flex gap-4">
                     <div className="flex-1"><Input label="Marca" placeholder="Ray-Ban, Oakley..." /></div>
                     <div className="flex-1"><Input label="Cor" placeholder="Preto Fosco..." /></div>
                  </div>
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-red-50 hover:border-red-100 transition-all group">
                    <input type="checkbox" className="w-5 h-5 accent-red-600 rounded-lg cursor-pointer" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-red-600 transition-colors">Armação de Uso (Cliente)</span>
                  </label>
                </div>
                <div className="space-y-6">
                  <Select label="Material da Lente" options={[
                    {label: 'Resina 1.56', value: '156'},
                    {label: 'Policarbonato 1.59', value: '159'},
                    {label: 'Resina 1.67', value: '167'},
                    {label: 'Resina 1.74', value: '174'},
                    {label: 'Cristal', value: 'cristal'},
                  ]} />
                  <Select label="Tratamento" options={[
                    {label: 'Anti-Reflexo Simples', value: 'ar'},
                    {label: 'Crizal / Premium', value: 'crizal'},
                    {label: 'Blue Control (Filtro Azul)', value: 'blue'},
                    {label: 'Transitions / Fotocromática', value: 'trans'},
                  ]} />
                  <Input label="Preço Total OS" placeholder="R$ 0,00" className="text-red-600 font-black text-lg" />
                </div>
             </div>
          </Card>
        </div>

        {/* Sidebar do Formulário */}
        <div className="space-y-8">
          <Card title="Status do Pedido">
             <div className="space-y-3 mt-4">
                {[
                  { id: 'pendente', label: 'Aguardando Pagto', icon: DollarSign, color: 'slate' },
                  { id: 'laboratorio', label: 'Em Laboratório', icon: Beaker, color: 'sky' },
                  { id: 'entrega', label: 'A Caminho / Pronto', icon: Truck, color: 'amber' },
                  { id: 'entregue', label: 'Finalizado / Entregue', icon: CheckCircle2, color: 'emerald' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStatus(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      status === item.id 
                      ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-600/20' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
             </div>
          </Card>

          <Card title="OS Digitalizada">
            <div className="mt-4 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-red-400 transition-all cursor-pointer bg-slate-50/50">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-50 group-hover:border-red-100 transition-all">
                  <Upload size={24} className="text-slate-400 group-hover:text-red-600" />
               </div>
               <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Anexar Receita</p>
               <p className="text-[10px] text-slate-400 font-medium mt-1">PDF, JPG ou PNG (Máx 5MB)</p>
            </div>
          </Card>

          <Card title="Observações Internas">
             <textarea 
               className="w-full h-32 mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:bg-white focus:border-red-500 outline-none transition-all resize-none"
               placeholder="Detalhes para o montador, urgências ou avisos..."
             ></textarea>
          </Card>
        </div>
      </div>
    </div>
  );
};
