
import React, { useState } from 'react';
import { Shield, Users, Key, UserCheck } from 'lucide-react';
import { Profiles } from './Profiles';
import { Access } from './Access';
import { UsersPermissions } from './UsersPermissions';

type TabType = 'profiles' | 'access' | 'users';

export const Permissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profiles');

  const tabs = [
    { id: 'profiles' as TabType, label: 'Perfis', icon: Shield },
    { id: 'access' as TabType, label: 'Acessos', icon: Key },
    { id: 'users' as TabType, label: 'Usuários', icon: UserCheck },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Permissões & Acessos</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Gestão de Roles • Controle de Acesso • Usuários</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'profiles' && <Profiles />}
          {activeTab === 'access' && <Access />}
          {activeTab === 'users' && <UsersPermissions />}
        </div>
      </div>
    </div>
  );
};
