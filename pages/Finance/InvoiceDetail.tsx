
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  ExternalLink,
  FileText,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  FileCode,
  Copy,
  QrCode
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/Common';

// Mock de dados - substituir por chamada de API
const mockInvoice = {
  id: '1',
  invoiceNumber: '000001',
  series: '001',
  osNumber: '39832',
  client: 'Maria das Graças dos Santos',
  clientCpf: '123.456.789-00',
  clientEmail: 'maria.gracas@email.com',
  clientPhone: '(44) 99999-9999',
  date: '21/01/2026',
  time: '17:30:45',
  value: 1450.00,
  status: 'Autorizada',
  store: 'Maringá Centro',
  storeCnpj: '12.345.678/0001-23',
  storeAddress: 'Av. Brasil, 1234 - Centro, Maringá - PR, 87010-000',
  accessKey: '35260112345678000123550000000000012345678901',
  protocol: '123456789012345',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=35260112345678000123550000000000012345678901',
  items: [
    {
      description: 'Lentes Varilux Comfort 1.67',
      quantity: 1,
      unitValue: 850.00,
      totalValue: 850.00
    },
    {
      description: 'Armação Ray-Ban RB2140',
      quantity: 1,
      unitValue: 600.00,
      totalValue: 600.00
    }
  ],
  paymentMethod: 'Cartão de Crédito',
  installments: 3,
  installmentValue: 483.33
};

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = mockInvoice; // Em produção, buscar por ID

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="border-slate-200 text-slate-600 bg-white"
          >
            <ArrowLeft size={18} /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">NF-e #{invoice.invoiceNumber}</h1>
            <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Série {invoice.series} • {invoice.status}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Download size={18} /> XML
          </Button>
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Printer size={18} /> DANFE
          </Button>
          <Button 
            onClick={() => window.open(`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConteudo=XbSeqxE8pl8=`, '_blank')}
            className="shadow-red-600/20 bg-red-600"
          >
            <ExternalLink size={18} /> Consultar SEFAZ
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-l-4 ${
        invoice.status === 'Autorizada' ? 'border-l-emerald-500 bg-emerald-50/50' :
        invoice.status === 'Cancelada' ? 'border-l-red-500 bg-red-50/50' :
        'border-l-amber-500 bg-amber-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {invoice.status === 'Autorizada' && <CheckCircle2 size={24} className="text-emerald-600" />}
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Status: {invoice.status}</p>
              <p className="text-xs text-slate-600 mt-1">
                Protocolo: {invoice.protocol} • Emitida em {invoice.date} às {invoice.time}
              </p>
            </div>
          </div>
          <Badge variant={invoice.status === 'Autorizada' ? 'success' : 'danger'}>
            {invoice.status}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <Card title="Dados do Cliente">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.client}</p>
                  <p className="text-xs text-slate-500 mt-0.5">CPF: {invoice.clientCpf}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OS Relacionada</p>
                  <button 
                    onClick={() => window.location.hash = `#/pedidos/${invoice.osNumber}/editar`}
                    className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline mt-1"
                  >
                    OS #{invoice.osNumber}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Itens da Nota Fiscal */}
          <Card title="Itens da Nota Fiscal">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Qtd</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">{item.description}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm font-bold text-slate-700">{item.quantity}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-slate-700">R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="px-4 py-4 text-right">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-lg font-black text-red-600">R$ {invoice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Informações Fiscais */}
          <Card title="Informações Fiscais">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <FileCode size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave de Acesso</p>
                    <p className="text-xs font-mono text-slate-700 mt-1">{invoice.accessKey}</p>
                  </div>
                </div>
                <button 
                  onClick={() => copyToClipboard(invoice.accessKey)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="Copiar chave"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Autorização</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.protocol}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Emissão</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.date} às {invoice.time}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card title="QR Code">
            <div className="flex flex-col items-center justify-center p-6">
              <img 
                src={invoice.qrCode} 
                alt="QR Code NF-e" 
                className="w-48 h-48 border-2 border-slate-200 rounded-xl"
              />
              <p className="text-[10px] font-bold text-slate-400 mt-4 text-center">
                Escaneie para consultar a NF-e na SEFAZ
              </p>
            </div>
          </Card>

          {/* Informações de Pagamento */}
          <Card title="Pagamento">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <CreditCard size={18} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.paymentMethod}</p>
                  {invoice.installments > 1 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {invoice.installments}x de R$ {invoice.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Valor Total</p>
                    <p className="text-xl font-black text-red-600 mt-1">R$ {invoice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <DollarSign size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Dados da Loja */}
          <Card title="Loja Emitente">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 size={18} className="text-slate-400 mt-1" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{invoice.store}</p>
                  <p className="text-xs text-slate-500 mt-1">{invoice.storeAddress}</p>
                  <p className="text-xs text-slate-500 mt-0.5">CNPJ: {invoice.storeCnpj}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
