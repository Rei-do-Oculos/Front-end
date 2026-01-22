
import React from 'react';
import { Search, Edit, Plus, FileText, Eye, Trash2, Smartphone } from 'lucide-react';
import { Card, Button, Input, FilterSection } from '../../components/Common';

export const ClientList: React.FC = () => {
  const clients = [
    { id: '39832', name: 'Maria das Gareas dos Santos', cpf: '', phone: '(44) 99918-6060', date: '21/01/2026 17:23:21' },
    { id: '39831', name: 'Elisangela de oliveira batista', cpf: '041.771.539-07', phone: '(43) 99933-5877', date: '21/01/2026 15:07:19' },
    { id: '39830', name: 'Maria Eduarda Simão', cpf: '117.255.439-07', phone: '(43) 99917-4870', date: '21/01/2026 15:05:04' },
    { id: '39829', name: 'Jackline Virgínia', cpf: '469.801.448-40', phone: '(43) 99629-7502', date: '21/01/2026 15:01:50' },
    { id: '39828', name: 'Sem nome', cpf: '', phone: '', date: '21/01/2026 14:59:44' },
    { id: '39827', name: 'Sem nome', cpf: '', phone: '', date: '21/01/2026 14:58:28' },
    { id: '39826', name: 'Lucas dos santos', cpf: '', phone: '(44) 98805-1118', date: '21/01/2026 14:26:24' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Clientes</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie sua base de clientes e histórico de compras.</p>
        </div>
        <Button onClick={() => window.location.hash = '#/clientes/novo'} className="shadow-red-600/20">
          <Plus size={18} /> Novo Cliente
        </Button>
      </div>

      <FilterSection>
        <Input label="Nome do Cliente" placeholder="Buscar por nome..." />
        <Input label="CPF" placeholder="000.000.000-00" />
        <Input label="Telefone" placeholder="(00) 00000-0000" />
        <Input label="Data de Cadastro" type="date" />
      </FilterSection>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome do Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">CPF</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Contato</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cadastro</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map((client) => (
                <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">#{client.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">{client.name}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{client.cpf || '---'}</td>
                  <td className="px-6 py-4">
                    {client.phone ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                        <Smartphone size={14} /> {client.phone}
                      </div>
                    ) : (
                      <span className="text-slate-300 italic text-xs">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-medium text-slate-400">{client.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        title="Editar cliente"
                        onClick={() => window.location.hash = `#/clientes/${client.id}/editar`}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button title="Ver histórico" className="p-2 text-slate-400 hover:text-sky-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <FileText size={16} />
                      </button>
                      <button 
                        title="Ver histórico"
                        onClick={() => window.location.hash = `#/clientes/${client.id}`}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        title="Excluir cliente"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
                            // Aqui seria a chamada da API para deletar
                            console.log('Deletando cliente:', client.id);
                            alert('Cliente excluído com sucesso!');
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
           <div className="flex items-center gap-2">
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xs">1</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 font-bold text-xs">2</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 font-bold text-xs">3</button>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página 1 de 142</p>
        </div>
      </Card>
    </div>
  );
};
