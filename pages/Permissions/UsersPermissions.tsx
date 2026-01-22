
import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Shield, Store, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Badge, Input, Select, FilterSection } from '../../components/Common';

interface UserPermission {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string;
  stores: string[];
  status: 'active' | 'inactive';
  lastAccess?: string;
}

const mockUsers: UserPermission[] = [
  {
    id: '1',
    name: 'Rodrigo Paduin',
    email: 'rodrigo@reidooculos.com.br',
    phone: '(44) 99999-9999',
    profile: 'Administrador',
    stores: ['Todas as unidades'],
    status: 'active',
    lastAccess: '21/01/2026 17:30'
  },
  {
    id: '2',
    name: 'Ana Beatriz Silva',
    email: 'ana@reidooculos.com.br',
    phone: '(44) 98888-8888',
    profile: 'Gerente',
    stores: ['Maringá Centro', 'Londrina Shopping'],
    status: 'active',
    lastAccess: '21/01/2026 16:45'
  },
  {
    id: '3',
    name: 'Ricardo Santos',
    email: 'ricardo@reidooculos.com.br',
    phone: '(44) 97777-7777',
    profile: 'Vendedor',
    stores: ['Maringá Centro'],
    status: 'active',
    lastAccess: '21/01/2026 15:20'
  },
  {
    id: '4',
    name: 'Juliana Costa',
    email: 'juliana@reidooculos.com.br',
    phone: '(44) 96666-6666',
    profile: 'Vendedor',
    stores: ['Londrina Shopping'],
    status: 'active',
    lastAccess: '20/01/2026 18:10'
  },
  {
    id: '5',
    name: 'Marcos Paulo',
    email: 'marcos@reidooculos.com.br',
    phone: '(44) 95555-5555',
    profile: 'Caixa',
    stores: ['Curitiba Batel'],
    status: 'inactive',
    lastAccess: '19/01/2026 14:00'
  },
];

export const UsersPermissions: React.FC = () => {
  const [users, setUsers] = useState<UserPermission[]>(mockUsers);
  const [isCreating, setIsCreating] = useState(false);

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case 'Administrador': return 'danger';
      case 'Gerente': return 'primary';
      case 'Vendedor': return 'success';
      case 'Caixa': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Usuários e Permissões</h2>
          <p className="text-sm text-slate-500 mt-1">Associe usuários a perfis e unidades</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="shadow-red-600/20">
          <Plus size={18} /> Novo Usuário
        </Button>
      </div>

      <FilterSection>
        <Input label="Nome" placeholder="Buscar por nome..." />
        <Input label="E-mail" placeholder="Buscar por e-mail..." />
        <Select label="Perfil" options={[
          { label: 'TODOS', value: '' },
          { label: 'Administrador', value: 'admin' },
          { label: 'Gerente', value: 'gerente' },
          { label: 'Vendedor', value: 'vendedor' },
          { label: 'Caixa', value: 'caixa' },
        ]} />
        <Select label="Status" options={[
          { label: 'TODOS', value: '' },
          { label: 'Ativo', value: 'active' },
          { label: 'Inativo', value: 'inactive' },
        ]} />
      </FilterSection>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Contato</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Perfil</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidades</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Último Acesso</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-400">#{user.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">{user.name}</p>
                        {user.lastAccess && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Último acesso: {user.lastAccess}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={12} />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={12} />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={getProfileColor(user.profile) as any}>{user.profile}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {user.stores.map((store, idx) => (
                        <Badge key={idx} variant="info">{store}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {user.status === 'active' ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle size={16} />
                        <span className="text-xs font-bold">Ativo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <XCircle size={16} />
                        <span className="text-xs font-bold">Inativo</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-500">{user.lastAccess || 'Nunca'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Editar usuário"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        title="Excluir usuário"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
      </Card>

      {isCreating && (
        <Card className="border-2 border-red-200 bg-red-50/30">
          <h3 className="text-lg font-black text-slate-900 mb-4">Criar Novo Usuário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome Completo *" placeholder="Nome do usuário" />
            <Input label="E-mail *" type="email" placeholder="usuario@reidooculos.com.br" />
            <Input label="Telefone *" placeholder="(00) 00000-0000" />
            <Input label="Senha *" type="password" placeholder="Mínimo 8 caracteres" />
            <Select label="Perfil *" options={[
              { label: 'Selecione um perfil', value: '' },
              { label: 'Administrador', value: 'admin' },
              { label: 'Gerente', value: 'gerente' },
              { label: 'Vendedor', value: 'vendedor' },
              { label: 'Caixa', value: 'caixa' },
            ]} />
            <Select label="Unidade *" options={[
              { label: 'Selecione a unidade', value: '' },
              { label: 'Todas as unidades', value: 'all' },
              { label: 'Maringá Centro', value: 'maringa' },
              { label: 'Londrina Shopping', value: 'londrina' },
              { label: 'Curitiba Batel', value: 'curitiba' },
            ]} />
          </div>
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button onClick={() => setIsCreating(false)} variant="outline">Cancelar</Button>
            <Button className="shadow-red-600/20">Criar Usuário</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
