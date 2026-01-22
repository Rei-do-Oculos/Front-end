
import React, { useState } from 'react';
import { Check, X, Lock, ChevronDown, ChevronRight, Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/Common';

interface CRUDPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface Module {
  id: string;
  name: string;
  route: string;
  description: string;
  profiles: {
    [key: string]: CRUDPermissions;
  };
}

const defaultPermissions: CRUDPermissions = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const modules: Module[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    route: '/',
    description: 'Visão geral do sistema',
    profiles: {
      'Administrador': { create: false, read: true, update: false, delete: false },
      'Gerente': { create: false, read: true, update: false, delete: false },
      'Vendedor': { create: false, read: true, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'pdv',
    name: 'PDV / Vendas',
    route: '/pdv',
    description: 'Ponto de venda e operações de caixa',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: true, read: true, update: true, delete: false },
      'Vendedor': { create: true, read: true, update: true, delete: false },
      'Caixa': { create: true, read: true, update: false, delete: false }
    }
  },
  {
    id: 'lojas',
    name: 'Lojas / Unidades',
    route: '/lojas',
    description: 'Gerenciamento de unidades',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: false, read: true, update: true, delete: false },
      'Vendedor': { create: false, read: false, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'clientes',
    name: 'Clientes',
    route: '/clientes',
    description: 'Cadastro e gestão de clientes',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: true, read: true, update: true, delete: false },
      'Vendedor': { create: true, read: true, update: true, delete: false },
      'Caixa': { create: false, read: true, update: false, delete: false }
    }
  },
  {
    id: 'vendedores',
    name: 'Vendedores',
    route: '/vendedores',
    description: 'Gestão de equipe de vendas',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: true, read: true, update: true, delete: false },
      'Vendedor': { create: false, read: true, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'estoque',
    name: 'Estoque',
    route: '/estoque',
    description: 'Controle de produtos e armações',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: true, read: true, update: true, delete: false },
      'Vendedor': { create: false, read: true, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'fornecedores',
    name: 'Fornecedores',
    route: '/fornecedores',
    description: 'Parceiros e fornecedores',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: true, read: true, update: true, delete: false },
      'Vendedor': { create: false, read: false, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    route: '/financeiro',
    description: 'Fluxo de caixa e inadimplências',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: false, read: true, update: false, delete: false },
      'Vendedor': { create: false, read: false, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'pedidos',
    name: 'Ordens de Serviço',
    route: '/pedidos',
    description: 'Gestão de OS e laboratório',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: true, read: true, update: true, delete: false },
      'Vendedor': { create: true, read: true, update: true, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'auditoria',
    name: 'Auditoria',
    route: '/auditoria',
    description: 'Logs e rastreabilidade',
    profiles: {
      'Administrador': { create: false, read: true, update: false, delete: false },
      'Gerente': { create: false, read: false, update: false, delete: false },
      'Vendedor': { create: false, read: false, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
  {
    id: 'permissoes',
    name: 'Permissões',
    route: '/permissoes',
    description: 'Gestão de acessos e perfis',
    profiles: {
      'Administrador': { create: true, read: true, update: true, delete: true },
      'Gerente': { create: false, read: false, update: false, delete: false },
      'Vendedor': { create: false, read: false, update: false, delete: false },
      'Caixa': { create: false, read: false, update: false, delete: false }
    }
  },
];

const profiles = ['Administrador', 'Gerente', 'Vendedor', 'Caixa'];

const crudLabels = {
  create: { 
    label: 'Criar', 
    icon: Plus, 
    enabledClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    disabledClass: 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
  },
  read: { 
    label: 'Visualizar', 
    icon: Eye, 
    enabledClass: 'bg-blue-50 border-blue-200 text-blue-700',
    disabledClass: 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
  },
  update: { 
    label: 'Editar', 
    icon: Edit, 
    enabledClass: 'bg-amber-50 border-amber-200 text-amber-700',
    disabledClass: 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
  },
  delete: { 
    label: 'Excluir', 
    icon: Trash2, 
    enabledClass: 'bg-red-50 border-red-200 text-red-700',
    disabledClass: 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
  },
};

export const Access: React.FC = () => {
  const [accessModules, setAccessModules] = useState<Module[]>(modules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleCRUD = (moduleId: string, profileName: string, crudType: keyof CRUDPermissions) => {
    setAccessModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          profiles: {
            ...module.profiles,
            [profileName]: {
              ...module.profiles[profileName],
              [crudType]: !module.profiles[profileName][crudType]
            }
          }
        };
      }
      return module;
    }));
  };

  const hasAnyAccess = (permissions: CRUDPermissions) => {
    return permissions.create || permissions.read || permissions.update || permissions.delete;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-950">Controle de Acessos CRUD</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie permissões granulares (Criar, Visualizar, Editar, Excluir) por módulo e perfil</p>
      </div>

      <div className="space-y-4">
        {accessModules.map((module) => {
          const isExpanded = expandedModules.has(module.id);
          
          return (
            <Card key={module.id} className="overflow-hidden">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-400" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-900">{module.name}</h3>
                      <code className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{module.route}</code>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profiles.map(profile => {
                    const hasAccess = hasAnyAccess(module.profiles[profile]);
                    return (
                      <div
                        key={profile}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
                          hasAccess
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {profile}
                      </div>
                    );
                  })}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                  <div className="space-y-6">
                    {profiles.map(profile => {
                      const permissions = module.profiles[profile];
                      const hasAccess = hasAnyAccess(permissions);
                      
                      return (
                        <div key={profile} className="bg-white rounded-xl p-4 border border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-900">{profile}</h4>
                            {hasAccess && (
                              <Badge variant="success">Com Acesso</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(Object.keys(crudLabels) as Array<keyof CRUDPermissions>).map((crudType) => {
                              const crudInfo = crudLabels[crudType];
                              const Icon = crudInfo.icon;
                              const isEnabled = permissions[crudType];
                              
                              return (
                                <button
                                  key={crudType}
                                  onClick={() => toggleCRUD(module.id, profile, crudType)}
                                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                    isEnabled ? crudInfo.enabledClass : crudInfo.disabledClass
                                  }`}
                                  title={isEnabled ? `Remover permissão de ${crudInfo.label}` : `Conceder permissão de ${crudInfo.label}`}
                                >
                                  <Icon size={16} />
                                  <span className="text-xs font-bold">{crudInfo.label}</span>
                                  {isEnabled ? (
                                    <Check size={14} className="ml-auto" />
                                  ) : (
                                    <X size={14} className="ml-auto" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Lock size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900 mb-1">Sobre o Controle de Acesso CRUD</p>
            <p className="text-xs text-amber-800 leading-relaxed mb-3">
              Configure permissões granulares para cada módulo. Um usuário pode ter acesso ao módulo mas não poder criar, editar ou excluir registros.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <Plus size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-amber-900">Criar: Adicionar novos registros</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-amber-900">Visualizar: Ver listagens e detalhes</span>
              </div>
              <div className="flex items-center gap-2">
                <Edit size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-900">Editar: Modificar registros existentes</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-red-600" />
                <span className="text-xs font-bold text-amber-900">Excluir: Remover registros</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
