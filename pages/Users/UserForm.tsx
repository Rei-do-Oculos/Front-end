import React, { useState, useEffect, useMemo } from 'react';
import { Save, ArrowLeft, Loader2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Input, MultiSelect, Badge } from '../../components/Common';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsers } from '../../services/hooks/useUsers';
import { usePlucks } from '../../services/hooks/usePlucks';
import { usersService } from '../../services/api/users';
import { rolesService } from '../../services/api/roles';
import { permissionsService } from '../../services/api/permissions';
import { storesService } from '../../services/api/stores';
import { translatePermission, translateResource } from '../../utils/translations';
import { useNotification } from '../../hooks/useNotification';

export const UserForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  
  const { createUser, updateUser, loading } = useUsers({
    autoFetch: false,
  });
  
  const { plucks: rolesPlucks, loading: rolesPlucksLoading } = usePlucks({
    service: rolesService,
    autoFetch: true,
  });

  const { plucks: permissionsPlucks, loading: permissionsPlucksLoading } = usePlucks({
    service: permissionsService,
    autoFetch: true,
  });

  const { plucks: storesPlucks, loading: storesPlucksLoading } = usePlucks({
    service: storesService,
    autoFetch: true,
  });
  
  // Garantir que sempre sejam arrays
  const safeRolesPlucks = Array.isArray(rolesPlucks) ? rolesPlucks : [];
  const safePermissionsPlucks = Array.isArray(permissionsPlucks) ? permissionsPlucks : [];
  const safeStoresPlucks = Array.isArray(storesPlucks) ? storesPlucks : [];
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [permissionsFromRoles, setPermissionsFromRoles] = useState<number[]>([]);
  
  // Formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [] as number[],
    permissions: [] as number[],
    stores: [] as number[],
    active: true,
  });

  // Verificar se SuperAdmin está selecionado
  const isSuperAdminSelected = useMemo(() => {
    const superAdminRole = safeRolesPlucks.find((r: any) => 
      r.name?.toLowerCase() === 'superadmin' || r.name?.toLowerCase() === 'super_admin'
    );
    return superAdminRole ? formData.roles.includes(superAdminRole.id) : false;
  }, [formData.roles, safeRolesPlucks]);

  // Agrupar permissões por módulo
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Array<{ id: number; name: string; action: string }>> = {};
    
    safePermissionsPlucks.forEach((perm: any) => {
      const parts = perm.name.split('.');
      if (parts.length >= 2) {
        const module = parts[0];
        const action = parts.slice(1).join('.');
        
        // Filtrar permissões de modelo (são relacionamentos técnicos, não módulos)
        if (module === 'model-has-permissions' || module === 'model-has-roles' || module === 'role-has-permissions') {
          return;
        }
        
        if (!grouped[module]) {
          grouped[module] = [];
        }
        
        grouped[module].push({
          id: perm.id,
          name: perm.name,
          action: action,
        });
      }
    });
    
    return grouped;
  }, [safePermissionsPlucks]);

  // Obter todos os IDs de permissões
  const allPermissionIds = useMemo(() => {
    return safePermissionsPlucks.map((p: any) => p.id);
  }, [safePermissionsPlucks]);

  // Verificar se todas as permissões estão selecionadas
  const allSelected = useMemo(() => {
    if (allPermissionIds.length === 0) return false;
    return allPermissionIds.every(id => formData.permissions.includes(id));
  }, [allPermissionIds, formData.permissions]);

  // Verificar se todas as permissões de um módulo estão selecionadas
  const isModuleFullySelected = (module: string) => {
    const modulePerms = permissionsByModule[module] || [];
    if (modulePerms.length === 0) return false;
    return modulePerms.every(perm => formData.permissions.includes(perm.id));
  };

  // Selecionar todas as permissões
  const selectAllPermissions = () => {
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: [],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...allPermissionIds],
      }));
    }
  };

  // Selecionar todas as permissões de um módulo
  const selectModulePermissions = (module: string) => {
    const modulePerms = permissionsByModule[module] || [];
    const moduleIds = modulePerms.map(p => p.id);
    const isFullySelected = isModuleFullySelected(module);
    
    if (isFullySelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !moduleIds.includes(id)),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...moduleIds])],
      }));
    }
  };

  // Toggle de uma permissão individual
  const togglePermission = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  // Toggle de expansão de módulo
  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  // Carregar dados do usuário se estiver editando
  useEffect(() => {
    if (isEditMode && id) {
      const loadUser = async () => {
        setLoadingUser(true);
        setFormError(null);
        try {
          const user = await usersService.getById(String(id));
          
          const userRoles = Array.isArray(user.roles) ? user.roles : [];
          const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
          const userStores = Array.isArray(user.stores) ? user.stores : [];
          
          // Buscar permissões de todos os perfis do usuário
          const rolePermissions: number[] = [];
          
          for (const role of userRoles) {
            try {
              const fullRole = await rolesService.getById(String(role.id));
              
              if (fullRole.permissions && Array.isArray(fullRole.permissions)) {
                const permIds = fullRole.permissions.map((p: any) => {
                  if (typeof p === 'object' && p !== null && 'id' in p) {
                    return Number(p.id);
                  } else if (typeof p === 'number') {
                    return p;
                  }
                  return null;
                }).filter((id: any): id is number => id !== null);
                rolePermissions.push(...permIds);
              }
            } catch (err: any) {
              if (role.permissions && Array.isArray(role.permissions)) {
                const permIds = role.permissions.map((p: any) => {
                  if (typeof p === 'object' && p !== null && 'id' in p) {
                    return Number(p.id);
                  } else if (typeof p === 'number') {
                    return p;
                  }
                  return null;
                }).filter((id: any): id is number => id !== null);
                rolePermissions.push(...permIds);
              }
            }
          }
          
          const uniqueRolePermissions = [...new Set(rolePermissions.map(id => Number(id)))];
          setPermissionsFromRoles(uniqueRolePermissions);
          
          const userPermissionIds = userPermissions.map(p => Number(p.id));
          const allUserPermissions = [...new Set([...uniqueRolePermissions, ...userPermissionIds])];
          
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            roles: userRoles.map(r => r.id),
            permissions: allUserPermissions,
            stores: userStores.map((s: any) => s.id),
            active: user.active !== undefined ? user.active : true, // Usar campo active, default true
          });
        } catch (err: any) {
          console.error('Erro ao carregar usuário:', err);
          showError('Erro ao carregar usuário', err.response?.data?.message || err.message || 'Erro ao carregar usuário');
        } finally {
          setLoadingUser(false);
        }
      };
      
      loadUser();
    }
  }, [id, isEditMode, permissionsPlucks]);

  // Efeito para pré-selecionar todas as lojas quando SuperAdmin for selecionado
  useEffect(() => {
    if (isSuperAdminSelected && safeStoresPlucks.length > 0) {
      const allStoreIds = safeStoresPlucks.map((s: any) => s.id);
      // Só atualiza se não estiver com todas as lojas já selecionadas
      if (formData.stores.length !== allStoreIds.length) {
        setFormData(prev => ({
          ...prev,
          stores: allStoreIds,
        }));
      }
    }
  }, [isSuperAdminSelected, safeStoresPlucks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      setFormError('E-mail é obrigatório');
      return;
    }

    if (!isEditMode && !formData.password) {
      setFormError('Senha é obrigatória para novos usuários');
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      setFormError('As senhas não coincidem');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setFormError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    // Validação: usuários não-SuperAdmin devem ter pelo menos uma loja vinculada
    if (!isSuperAdminSelected && formData.stores.length === 0) {
      setFormError('Usuários que não são SuperAdmin devem ter pelo menos uma loja vinculada');
      return;
    }

    try {
      const storesArray = Array.isArray(formData.stores) ? formData.stores : [];
      
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        roles: formData.roles.map(id => ({ id })),
        permissions: formData.permissions.map(id => ({ id })),
        stores: storesArray.map(id => ({ id })),
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      // Se estiver editando, adicionar campo active para ativar/desativar
      if (isEditMode) {
        payload.active = formData.active;
      }

      if (isEditMode) {
        await updateUser(String(id), payload);
        showSuccess('Usuário atualizado!', 'O usuário foi atualizado com sucesso.');
      } else {
        await createUser(payload);
        showSuccess('Usuário criado!', 'O usuário foi criado com sucesso.');
      }

      navigate('/users');
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao salvar usuário';
      setFormError(errorMessage);
      showError('Erro ao salvar usuário', errorMessage);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">
            {isEditMode ? 'Edite as informações do usuário' : 'Cadastre um novo usuário no sistema'}
          </p>
        </div>
        <Button onClick={() => navigate('/users')} variant="outline">
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>

      <Card>
        {formError && (
          <div className="mb-6 border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--store-color-dark)' }}>{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo *"
              placeholder="Nome do usuário"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="E-mail *"
              type="email"
              placeholder="usuario@reidooculos.com.br"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {!isEditMode && (
              <>
                <Input
                  label="Senha *"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Input
                  label="Confirmar Senha *"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  required
                />
              </>
            )}
            {isEditMode && (
              <>
                <Input
                  label="Nova Senha (opcional)"
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                />
              </>
            )}
            {isEditMode && (
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">
                  Status
                </label>
                <label 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    setFormData({ ...formData, active: !formData.active });
                  }}
                >
                  <div 
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                      formData.active ? '' : 'border-slate-300'
                    }`}
                    style={formData.active ? {
                      backgroundColor: 'var(--store-color)',
                      borderColor: 'var(--store-color)',
                    } : undefined}
                  >
                    {formData.active && <Check size={14} className="text-white" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-red-600 transition-colors">
                      {formData.active ? 'Usuário Ativo' : 'Usuário Inativo'}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formData.active ? 'O usuário pode acessar o sistema' : 'O usuário não pode acessar o sistema'}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">
              Perfil *
            </label>
            <MultiSelect
              options={safeRolesPlucks.map((r: any) => ({ 
                label: r.name,
                value: String(r.id) 
              }))}
              value={formData.roles.map(String)}
              onChange={async (values) => {
                const newRoles = values.map(Number);
                
                console.log('[UserForm] Perfis selecionados:', newRoles);
                
                const rolePermissions: number[] = [];
                for (const roleId of newRoles) {
                  try {
                    // Tentar usar POST em vez de GET (alguns endpoints podem requerer POST)
                    let fullRole;
                    try {
                      fullRole = await rolesService.getById(String(roleId));
                    } catch (getError: any) {
                      // Se GET falhar, tentar buscar via listagem
                      console.log(`[UserForm] GET falhou, tentando buscar via listagem para role ${roleId}`);
                      const { data: rolesList } = await rolesService.getAll({ page: 1, per_page: 1000 });
                      const foundRole = rolesList.find((r: any) => r.id === roleId);
                      if (foundRole) {
                        fullRole = foundRole;
                      } else {
                        throw new Error(`Role ${roleId} não encontrado na listagem`);
                      }
                    }
                    
                    console.log(`[UserForm] Perfil ${roleId} carregado:`, fullRole);
                    if (fullRole.permissions && Array.isArray(fullRole.permissions)) {
                      const permIds = fullRole.permissions.map((p: any) => {
                        if (typeof p === 'object' && p !== null && 'id' in p) {
                          return Number(p.id);
                        } else if (typeof p === 'number') {
                          return p;
                        }
                        return null;
                      }).filter((id: any): id is number => id !== null);
                      console.log(`[UserForm] Permissões do perfil ${roleId}:`, permIds);
                      rolePermissions.push(...permIds);
                    }
                  } catch (err: any) {
                    console.warn(`[UserForm] Erro ao buscar permissões do perfil ${roleId}:`, err);
                    console.warn(`[UserForm] Detalhes do erro:`, err.response?.data);
                  }
                }
                
                const uniqueRolePermissions = [...new Set(rolePermissions.map(id => Number(id)))];
                console.log('[UserForm] Permissões únicas dos perfis:', uniqueRolePermissions);
                setPermissionsFromRoles(uniqueRolePermissions);
                
                // Identificar permissões que eram dos perfis antigos mas não estão mais nos novos perfis
                const oldRolePermissions = permissionsFromRoles;
                const removedRolePermissions = oldRolePermissions.filter(
                  oldPermId => !uniqueRolePermissions.includes(oldPermId)
                );
                
                // Manter apenas permissões extras (que não vêm de nenhum perfil) e permissões dos novos perfis
                const currentExtraPermissions = formData.permissions.filter(
                  permId => {
                    const permIdNum = Number(permId);
                    // Manter se não está nas permissões dos perfis antigos OU se está nos novos perfis
                    return !oldRolePermissions.includes(permIdNum) || uniqueRolePermissions.includes(permIdNum);
                  }
                );
                
                // Remover permissões que eram dos perfis removidos
                const filteredExtraPermissions = currentExtraPermissions.filter(
                  permId => {
                    const permIdNum = Number(permId);
                    return !removedRolePermissions.includes(permIdNum);
                  }
                );
                
                const allPermissions = [...new Set([...uniqueRolePermissions, ...filteredExtraPermissions])];
                console.log('[UserForm] Todas as permissões a serem definidas:', allPermissions);
                console.log('[UserForm] Permissões removidas dos perfis:', removedRolePermissions);
                
                setFormData(prev => ({ 
                  ...prev, 
                  roles: newRoles,
                  permissions: allPermissions
                }));
              }}
              placeholder={rolesPlucksLoading ? "Carregando perfis..." : "Selecione um ou mais perfis"}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block">
              Lojas {!isSuperAdminSelected && <span className="text-red-500">*</span>}
            </label>
            {isSuperAdminSelected ? (
              <div className="p-4 rounded-xl border-2" style={{ 
                backgroundColor: 'var(--store-color-light)', 
                borderColor: 'var(--store-color-opacity-20)' 
              }}>
                <p className="text-sm font-medium" style={{ color: 'var(--store-color-dark)' }}>
                  SuperAdmin tem acesso a todas as lojas automaticamente
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--store-color)' }}>
                  {safeStoresPlucks.length} loja(s) vinculada(s)
                </p>
              </div>
            ) : (
              <>
                <MultiSelect
                  options={safeStoresPlucks.map((s: any) => ({ 
                    label: s.fancy_name || s.name, 
                    value: String(s.id) 
                  }))}
                  value={Array.isArray(formData.stores) ? formData.stores.map(String) : []}
                  onChange={(values) => {
                    const newStores = values.map(Number);
                    setFormData({ ...formData, stores: newStores });
                  }}
                  placeholder={storesPlucksLoading ? "Carregando lojas..." : "Selecione uma ou mais lojas"}
                />
                <p className="text-xs text-slate-400 mt-2">
                  Usuários devem ter pelo menos uma loja vinculada para acesso ao sistema
                </p>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 block">
                  Permissões
                </label>
                {permissionsFromRoles.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    {permissionsFromRoles.length} permissões vêm do(s) perfil(is) selecionado(s). 
                    Você pode desmarcar para bloquear apenas para este usuário (o perfil não será alterado).
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={selectAllPermissions}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <div 
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    allSelected ? '' : 'border-slate-300'
                  }`}
                  style={allSelected ? {
                    backgroundColor: 'var(--store-color)',
                    borderColor: 'var(--store-color)',
                  } : undefined}
                >
                  {allSelected && <Check size={12} className="text-white" />}
                </div>
                Selecionar Todas
              </button>
            </div>

            {permissionsPlucksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              </div>
            ) : Object.keys(permissionsByModule).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma permissão disponível</p>
            ) : (
              <div className="space-y-4 border border-slate-200 rounded-xl p-6 bg-white">
                {/* Tags dos módulos */}
                <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-100">
                  {Object.keys(permissionsByModule).map((module) => {
                    const modulePerms = permissionsByModule[module];
                    const isExpanded = expandedModules.has(module);
                    const isFullySelected = isModuleFullySelected(module);
                    const selectedCount = modulePerms.filter(p => {
                      const pid = Number(p.id);
                      return formData.permissions.some(id => Number(id) === pid);
                    }).length;
                    const fromRoleCount = modulePerms.filter(p => {
                      const pid = Number(p.id);
                      return permissionsFromRoles.some(id => Number(id) === pid);
                    }).length;
                    const totalActiveCount = modulePerms.filter(p => {
                      const pid = Number(p.id);
                      return formData.permissions.some(id => Number(id) === pid) || 
                             permissionsFromRoles.some(id => Number(id) === pid);
                    }).length;
                    
                    return (
                      <button
                        key={module}
                        type="button"
                        onClick={() => toggleModule(module)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isExpanded
                            ? 'bg-red-600 text-white'
                            : isFullySelected || totalActiveCount > 0
                            ? 'border-2'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
                        }`}
                        style={isFullySelected || totalActiveCount > 0 ? {
                          backgroundColor: 'var(--store-color-light)',
                          color: 'var(--store-color-dark)',
                          borderColor: 'var(--store-color-opacity-20)',
                        } : undefined}
                      >
                        {translateResource(module)}
                        {totalActiveCount > 0 && (
                          <span 
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isExpanded ? 'bg-white/20' : 'text-white'
                            }`}
                            style={!isExpanded ? {
                              backgroundColor: 'var(--store-color)',
                            } : undefined}
                          >
                            {totalActiveCount}/{modulePerms.length}
                            {fromRoleCount > 0 && ` (${fromRoleCount} do perfil)`}
                          </span>
                        )}
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    );
                  })}
                </div>

                {/* Permissões expandidas por módulo */}
                {Object.keys(permissionsByModule).map((module) => {
                  if (!expandedModules.has(module)) return null;
                  
                  const modulePerms = permissionsByModule[module];
                  const isFullySelected = isModuleFullySelected(module);
                  
                  return (
                    <div key={module} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => selectModulePermissions(module)}
                          className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-red-600 transition-colors"
                        >
                          <div 
                            className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                              isFullySelected ? '' : 'border-slate-300'
                            }`}
                            style={isFullySelected ? {
                              backgroundColor: 'var(--store-color)',
                              borderColor: 'var(--store-color)',
                            } : undefined}
                          >
                            {isFullySelected && <Check size={12} className="text-white" />}
                          </div>
                          {translateResource(module)}
                        </button>
                        <span className="text-xs text-slate-400">
                          {modulePerms.filter(p => {
                            const pid = Number(p.id);
                            return formData.permissions.some(id => Number(id) === pid) || 
                                   permissionsFromRoles.some(id => Number(id) === pid);
                          }).length} de {modulePerms.length} ativas
                          {modulePerms.filter(p => {
                            const pid = Number(p.id);
                            return permissionsFromRoles.some(id => Number(id) === pid);
                          }).length > 0 && (
                            <span className="ml-1" style={{ color: 'var(--store-color)' }}>
                              ({modulePerms.filter(p => {
                                const pid = Number(p.id);
                                return permissionsFromRoles.some(id => Number(id) === pid);
                              }).length} do perfil)
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {modulePerms.map((perm) => {
                          const permId = Number(perm.id);
                          const isSelected = formData.permissions.some(id => {
                            const formPermId = Number(id);
                            return formPermId === permId;
                          });
                          const isFromRole = permissionsFromRoles.some(id => {
                            const rolePermId = Number(id);
                            return rolePermId === permId;
                          });
                          
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                isFromRole 
                                  ? 'cursor-pointer' 
                                  : 'hover:bg-slate-50 cursor-pointer'
                              }`}
                              style={isFromRole ? {
                                backgroundColor: 'var(--store-color-light)',
                              } : undefined}
                              onMouseEnter={isFromRole ? (e) => {
                                e.currentTarget.style.backgroundColor = 'var(--store-color-opacity-20)';
                              } : undefined}
                              onMouseLeave={isFromRole ? (e) => {
                                e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
                              } : undefined}
                              onClick={() => togglePermission(permId)}
                            >
                              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? isFromRole
                                    ? ''
                                    : 'bg-red-600 border-red-600'
                                  : isFromRole
                                    ? ''
                                    : 'border-slate-300'
                              }`}
                              style={isSelected && isFromRole ? {
                                backgroundColor: 'var(--store-color)',
                                borderColor: 'var(--store-color)',
                              } : isFromRole && !isSelected ? {
                                borderColor: 'var(--store-color-opacity-40)',
                                backgroundColor: 'var(--store-color-light)',
                              } : undefined}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                              <span className={`text-sm flex-1 ${
                                isFromRole ? 'font-medium' : 'text-slate-700'
                              }`}
                              style={isFromRole ? {
                                color: 'var(--store-color-dark)',
                              } : undefined}>
                                {translatePermission(perm.name)}
                              </span>
                              {isFromRole && isSelected && (
                                <Badge variant="info" className="text-[10px] text-white" style={{
                                  backgroundColor: 'var(--store-color)',
                                }}>
                                  Do Perfil
                                </Badge>
                              )}
                              {isFromRole && !isSelected && (
                                <Badge variant="warning" className="text-[10px] bg-orange-500 text-white">
                                  Bloqueada
                                </Badge>
                              )}
                              {isSelected && !isFromRole && (
                                <Badge variant="success" className="text-[10px]">
                                  Extra
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-4">
              Permissões marcadas em <span style={{ color: 'var(--store-color)' }}>vermelho</span> vêm do(s) perfil(is) selecionado(s). 
              Você pode desmarcar para bloquear apenas para este usuário (o perfil não será alterado). 
              Você também pode adicionar permissões extras além das do perfil.
            </p>
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
            <Button type="button" onClick={() => navigate('/users')} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} /> {isEditMode ? 'Atualizar' : 'Criar'} Usuário
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
