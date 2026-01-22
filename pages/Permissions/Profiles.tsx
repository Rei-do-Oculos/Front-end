
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Store, Eye } from 'lucide-react';
import { Card, Button, Badge, Input } from '../../components/Common';

interface Profile {
  id: string;
  name: string;
  description: string;
  color: string;
  usersCount: number;
  stores: string[];
  permissions: string[];
}

const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acesso total ao sistema, todas as unidades',
    color: 'red',
    usersCount: 3,
    stores: ['Todas as unidades'],
    permissions: ['Todas as permissões']
  },
  {
    id: '2',
    name: 'Gerente',
    description: 'Acesso completo à unidade designada',
    color: 'blue',
    usersCount: 5,
    stores: ['Maringá Centro', 'Londrina Shopping'],
    permissions: ['Vendas', 'Estoque', 'Clientes', 'Relatórios']
  },
  {
    id: '3',
    name: 'Vendedor',
    description: 'Acesso a vendas e clientes da unidade',
    color: 'emerald',
    usersCount: 12,
    stores: ['Maringá Centro'],
    permissions: ['PDV', 'Clientes', 'Ordens de Serviço']
  },
  {
    id: '4',
    name: 'Caixa',
    description: 'Apenas operações de caixa e pagamentos',
    color: 'amber',
    usersCount: 4,
    stores: ['Todas as unidades'],
    permissions: ['PDV', 'Pagamentos']
  },
];

export const Profiles: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Perfis de Acesso</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie os perfis de usuário e suas permissões</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="shadow-red-600/20">
          <Plus size={18} /> Novo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="border-l-4" style={{ borderLeftColor: profile.color === 'red' ? '#ef4444' : profile.color === 'blue' ? '#3b82f6' : profile.color === 'emerald' ? '#10b981' : '#f59e0b' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  profile.color === 'red' ? 'bg-red-100 text-red-600' :
                  profile.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  profile.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{profile.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{profile.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  title="Editar perfil"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  onClick={() => setEditingId(profile.id)}
                >
                  <Edit size={16} />
                </button>
                <button
                  title="Excluir perfil"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-slate-400" />
                <span className="font-bold text-slate-900">{profile.usersCount}</span>
                <span className="text-slate-500">usuários</span>
              </div>

              <div className="flex items-start gap-2">
                <Store size={14} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Unidades</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.stores.map((store, idx) => (
                      <Badge key={idx} variant="info">{store}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Permissões</p>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((perm, idx) => (
                    <Badge key={idx} variant="success">{perm}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isCreating && (
        <Card className="border-2 border-red-200 bg-red-50/30">
          <h3 className="text-lg font-black text-slate-900 mb-4">Criar Novo Perfil</h3>
          <div className="space-y-4">
            <Input label="Nome do Perfil *" placeholder="Ex: Supervisor" />
            <Input label="Descrição" placeholder="Descreva o perfil..." />
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setIsCreating(false)} variant="outline">Cancelar</Button>
              <Button className="shadow-red-600/20">Criar Perfil</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
