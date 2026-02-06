import React, { useState, useMemo } from 'react';
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
  QrCode,
  Mail,
  Phone,
  MapPin,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/Common';
import { useNotification } from '../../hooks/useNotification';

// Mock de dados completo - em produção, buscar por ID da API
const getMockInvoice = (id: string) => {
  const mockInvoices = [
    {
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
      storePhone: '(44) 3025-1234',
      accessKey: '35260112345678000123550000000000012345678901',
      protocol: '123456789012345',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=35260112345678000123550000000000012345678901',
      items: [
        {
          description: 'Lentes Varilux Comfort 1.67',
          ncm: '9001.50.00',
          quantity: 1,
          unitValue: 850.00,
          totalValue: 850.00
        },
        {
          description: 'Armação Ray-Ban RB2140',
          ncm: '9003.11.00',
          quantity: 1,
          unitValue: 600.00,
          totalValue: 600.00
        }
      ],
      paymentMethod: 'Cartão de Crédito',
      installments: 3,
      installmentValue: 483.33,
      taxes: {
        baseIcms: 1450.00,
        icms: 0.00,
        baseIcmsSt: 0.00,
        icmsSt: 0.00,
        totalProducts: 1450.00,
        totalFreight: 0.00,
        totalInsurance: 0.00,
        totalDiscount: 0.00,
        totalII: 0.00,
        totalIPI: 0.00,
        totalPIS: 0.00,
        totalCOFINS: 0.00,
        totalOtherTaxes: 0.00,
        totalInvoice: 1450.00,
      }
    },
    {
      id: '2',
      invoiceNumber: '000002',
      series: '001',
      osNumber: '39830',
      client: 'Maria Eduarda Simão',
      clientCpf: '987.654.321-00',
      clientEmail: 'maria.eduarda@email.com',
      clientPhone: '(43) 98888-8888',
      date: '21/01/2026',
      time: '15:10:22',
      value: 2100.00,
      status: 'Autorizada',
      store: 'Londrina Shopping',
      storeCnpj: '12.345.678/0001-23',
      storeAddress: 'Av. Higienópolis, 2000 - Londrina - PR, 86020-000',
      storePhone: '(43) 3025-5678',
      accessKey: '35260112345678000123550000000000012345678902',
      protocol: '123456789012346',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=35260112345678000123550000000000012345678902',
      items: [
        {
          description: 'Lentes Transitions XTRActive 1.59',
          ncm: '9001.50.00',
          quantity: 1,
          unitValue: 1200.00,
          totalValue: 1200.00
        },
        {
          description: 'Armação Oakley OO9208',
          ncm: '9003.11.00',
          quantity: 1,
          unitValue: 900.00,
          totalValue: 900.00
        }
      ],
      paymentMethod: 'PIX',
      installments: 1,
      installmentValue: 2100.00,
      taxes: {
        baseIcms: 2100.00,
        icms: 0.00,
        baseIcmsSt: 0.00,
        icmsSt: 0.00,
        totalProducts: 2100.00,
        totalFreight: 0.00,
        totalInsurance: 0.00,
        totalDiscount: 0.00,
        totalII: 0.00,
        totalIPI: 0.00,
        totalPIS: 0.00,
        totalCOFINS: 0.00,
        totalOtherTaxes: 0.00,
        totalInvoice: 2100.00,
      }
    },
  ];

  return mockInvoices.find(inv => inv.id === id) || mockInvoices[0];
};

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const invoice = getMockInvoice(id || '1');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copiado!', `${label} copiado para a área de transferência.`);
  };

  const getStatusIcon = () => {
    switch (invoice.status) {
      case 'Autorizada': return <CheckCircle2 size={24} className="text-emerald-600" />;
      case 'Cancelada': return <XCircle size={24} className="text-red-600" />;
      case 'Rejeitada': return <XCircle size={24} className="text-red-600" />;
      case 'Pendente': return <Clock size={24} className="text-amber-600" />;
      default: return <AlertCircle size={24} className="text-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (invoice.status) {
      case 'Autorizada': return 'border-l-emerald-500 bg-emerald-50/50';
      case 'Cancelada': return 'border-l-red-500 bg-red-50/50';
      case 'Rejeitada': return 'border-l-red-500 bg-red-50/50';
      case 'Pendente': return 'border-l-amber-500 bg-amber-50/50';
      default: return 'border-l-slate-500 bg-slate-50/50';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/notas-fiscais')}
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
          {invoice.status === 'Autorizada' && (
            <>
              <Button 
                variant="outline" 
                className="border-slate-200 text-slate-600 bg-white"
                onClick={() => showSuccess('Download', 'XML será baixado em breve.')}
              >
                <Download size={18} /> XML
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-200 text-slate-600 bg-white"
                onClick={() => showSuccess('Impressão', 'DANFE será impresso em breve.')}
              >
                <Printer size={18} /> DANFE
              </Button>
            </>
          )}
          {invoice.accessKey && (
            <Button 
              onClick={() => window.open(`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConteudo=XbSeqxE8pl8=`, '_blank')}
              className="shadow-red-600/20 bg-red-600"
            >
              <ExternalLink size={18} /> Consultar SEFAZ
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-l-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Status: {invoice.status}</p>
              {invoice.protocol && (
                <p className="text-xs text-slate-600 mt-1">
                  Protocolo: {invoice.protocol} • Emitida em {invoice.date} às {invoice.time}
                </p>
              )}
              {!invoice.protocol && (
                <p className="text-xs text-slate-600 mt-1">
                  Emitida em {invoice.date} às {invoice.time}
                </p>
              )}
            </div>
          </div>
          <Badge variant={invoice.status === 'Autorizada' ? 'success' : invoice.status === 'Pendente' ? 'warning' : 'danger'}>
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
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.client}</p>
                  <p className="text-xs text-slate-500 mt-0.5">CPF: {invoice.clientCpf}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OS Relacionada</p>
                  <button 
                    onClick={() => window.location.hash = `#/service-orders/${invoice.osNumber}`}
                    className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline mt-1"
                  >
                    OS #{invoice.osNumber}
                  </button>
                </div>
              </div>
              {invoice.clientEmail && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{invoice.clientEmail}</p>
                  </div>
                </div>
              )}
              {invoice.clientPhone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Phone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{invoice.clientPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Itens da Nota Fiscal */}
          <Card title="Itens da Nota Fiscal">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">NCM</th>
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
                      <td className="px-4 py-4">
                        <p className="text-xs font-mono text-slate-500">{item.ncm}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm font-bold text-slate-700">{item.quantity}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(item.unitValue)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(item.totalValue)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={4} className="px-4 py-4 text-right">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-lg font-black text-red-600">{formatCurrency(invoice.value)}</p>
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
                <div className="flex items-center gap-3 flex-1">
                  <FileCode size={18} className="text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave de Acesso</p>
                    <p className="text-xs font-mono text-slate-700 mt-1 break-all">{invoice.accessKey || 'Aguardando autorização...'}</p>
                  </div>
                </div>
                {invoice.accessKey && (
                  <button 
                    onClick={() => copyToClipboard(invoice.accessKey, 'Chave de acesso')}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all flex-shrink-0"
                    title="Copiar chave"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.protocol && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Autorização</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{invoice.protocol}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Emissão</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.date} às {invoice.time}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Informações Tributárias */}
          {invoice.taxes && (
            <Card title="Informações Tributárias">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base ICMS</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(invoice.taxes.baseIcms)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ICMS</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(invoice.taxes.icms)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Produtos</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(invoice.taxes.totalProducts)}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          {invoice.qrCode && (
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
          )}

          {/* Informações de Pagamento */}
          <Card title="Pagamento">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <CreditCard size={18} className="text-slate-400" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{invoice.paymentMethod}</p>
                  {invoice.installments && invoice.installments > 1 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {invoice.installments}x de {formatCurrency(invoice.installmentValue)}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Valor Total</p>
                    <p className="text-xl font-black text-red-600 mt-1">{formatCurrency(invoice.value)}</p>
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
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{invoice.store}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 mt-0.5" />
                      <p className="text-xs text-slate-500">{invoice.storeAddress}</p>
                    </div>
                    <p className="text-xs text-slate-500">CNPJ: {invoice.storeCnpj}</p>
                    {invoice.storePhone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        <p className="text-xs text-slate-500">{invoice.storePhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
