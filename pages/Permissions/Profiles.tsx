
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Store, Eye, Save, X, Loader2, ChevronDown, ChevronRight, Check, CheckCircle2 } from 'lucide-react';
import { Card, Button, Badge, Input, Modal } from '../../components/Common';
import { useRoles } from '../../services/hooks/useRoles';
import { useUsers } from '../../services/hooks/useUsers';
import { Role } from '../../services/api/roles';
import { usePlucks } from '../../services/hooks/usePlucks';
import { permissionsService } from '../../services/api/permissions';
import { translatePermission, translateResource } from '../../utils/translations';
import { useNotification } from '../../hooks/useNotification';

const getProfileColor = (roleName: string): string => {
  const name = roleName.toLowerCase();
  if (name.includes('admin')) return 'red';
  if (name.includes('gerente') || name.includes('manager')) return 'blue';
  if (name.includes('vendedor') || name.includes('seller')) return 'emerald';
  if (name.includes('caixa') || name.includes('cashier')) return 'amber';
  return 'info';
};

export const Profiles: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { roles, loading, error, fetchRoles, createRole, updateRole, deleteRole, getRole } = useRoles({
    autoFetch: false,
  });
  
  const { users } = useUsers({
    autoFetch: true,
  });
  
  const { plucks: permissionsPlucks, loading: permissionsPlucksLoading } = usePlucks({
    service: permissionsService,
    autoFetch: true,
  });
  
  // Garantir que sempre seja um array
  const safePermissionsPlucks = Array.isArray(permissionsPlucks) ? permissionsPlucks : [];
  
  // Contar usuários por perfil
  const usersCountByRole = useMemo(() => {
    const count: Record<number, number> = {};
    
    if (users && Array.isArray(users)) {
      users.forEach((user) => {
        const userRoles = Array.isArray(user.roles) ? user.roles : [];
        userRoles.forEach((role) => {
          if (role && role.id) {
            count[role.id] = (count[role.id] || 0) + 1;
          }
        });
      });
    }
    return count;
  }, [users]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    guard_name: 'web',
    permissions: [] as number[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loadingRole, setLoadingRole] = useState(false);

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
    return allPermissionIds.length > 0 && allPermissionIds.every(id => formData.permissions.includes(id));
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
      setFormData(prev => ({ ...prev, permissions: [] }));
    } else {
      setFormData(prev => ({ ...prev, permissions: [...allPermissionIds] }));
    }
  };

  // Selecionar todas as permissões de um módulo
  const selectModulePermissions = (module: string) => {
    const modulePerms = permissionsByModule[module] || [];
    const moduleIds = modulePerms.map(p => p.id);
    const isFullySelected = isModuleFullySelected(module);
    
    if (isFullySelected) {
      // Desmarcar todas do módulo
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !moduleIds.includes(id)),
      }));
    } else {
      // Marcar todas do módulo
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

  useEffect(() => {
    fetchRoles(1, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpar erro quando fechar o modal
  useEffect(() => {
    if (!isCreating && !editingId) {
      setFormError(null);
    }
  }, [isCreating, editingId]);
  
  // Ref para evitar múltiplas execuções do useEffect
  const loadingRef = useRef(false);
  const currentEditingIdRef = useRef<number | null>(null);
  
  // Carregar dados do role quando editingId mudar
  useEffect(() => {
    // Resetar ref se editingId mudou ou foi limpo
    if (!editingId) {
      loadingRef.current = false;
      currentEditingIdRef.current = null;
      setLoadingRole(false);
      return;
    }
    
    // Se já está carregando o mesmo ID, não fazer nada
    if (loadingRef.current && currentEditingIdRef.current === editingId) {
      console.log('[Profiles] Já está carregando este role, ignorando');
      return;
    }
    
    // Não executar se estiver criando
    if (isCreating) {
      return;
    }
    
    if (editingId) {
      loadingRef.current = true;
      currentEditingIdRef.current = editingId;
      setLoadingRole(true);
      setFormError(null);
      
      const loadRoleData = async () => {
        const targetId = editingId; // Capturar o ID atual
        
        // Timeout de segurança (10 segundos)
        const timeoutId = setTimeout(() => {
          if (currentEditingIdRef.current === targetId && loadingRef.current) {
            setLoadingRole(false);
            loadingRef.current = false;
            
            // Tentar usar dados básicos se disponíveis
            const role = Array.isArray(roles) ? roles.find(r => r && r.id === targetId) : null;
            if (role) {
              setFormData({
                name: role.name,
                guard_name: role.guard_name || 'web',
                permissions: role.permissions?.map(p => p.id) || [],
              });
              setFormError('Tempo limite excedido. Algumas permissões podem estar ausentes.');
            } else {
              setFormError('Tempo limite excedido ao carregar perfil. Tente novamente.');
            }
          }
        }, 10000);
        
        try {
          // Tentar buscar dados básicos da lista primeiro (se disponível)
          let role = Array.isArray(roles) ? roles.find(r => r && r.id === targetId) : null;
          
          if (role) {
            // Extrair IDs das permissões de forma segura
            let permissionIds: number[] = [];
            if (role.permissions && Array.isArray(role.permissions)) {
              permissionIds = role.permissions.map((p: any) => {
                if (typeof p === 'object' && p !== null && 'id' in p) {
                  return p.id;
                } else if (typeof p === 'number') {
                  return p;
                }
                return null;
              }).filter((id: any): id is number => id !== null);
            }
            setFormData({
              name: role.name || '',
              guard_name: role.guard_name || 'web',
              permissions: permissionIds,
            });
            setLoadingRole(false);
            // Continuar carregando em background para buscar dados completos
          }
          const fullRole = await getRole(String(targetId));
          clearTimeout(timeoutId);
          
          // Verificar se ainda estamos editando o mesmo role (pode ter mudado durante o carregamento)
          if (currentEditingIdRef.current === targetId && fullRole && fullRole.id === targetId) {
            // Extrair IDs das permissões de forma segura
            let permissionIds: number[] = [];
            
            if (fullRole.permissions) {
              if (Array.isArray(fullRole.permissions)) {
                permissionIds = fullRole.permissions.map((p: any) => {
                  if (typeof p === 'object' && p !== null && 'id' in p) {
                    return p.id;
                  } else if (typeof p === 'number') {
                    return p;
                  }
                  return null;
                }).filter((id: any): id is number => id !== null);
              }
            }

            const newFormData = {
              name: fullRole.name || '',
              guard_name: fullRole.guard_name || 'web',
              permissions: permissionIds,
            };
            
            setFormData(newFormData);
            setFormError(null);
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          // Tentar usar dados básicos se disponíveis
          const role = Array.isArray(roles) ? roles.find(r => r && r.id === targetId) : null;
          if (role && currentEditingIdRef.current === targetId) {
            setFormData({
              name: role.name,
              guard_name: role.guard_name || 'web',
              permissions: role.permissions?.map(p => p.id) || [],
            });
            setFormError('Não foi possível carregar todas as permissões. Algumas podem estar ausentes.');
          } else if (currentEditingIdRef.current === targetId) {
            // Se não tiver dados básicos, mostrar erro mas manter modal aberto
            setFormError('Erro ao carregar perfil. Verifique sua conexão e tente novamente.');
            setFormData({
              name: '',
              guard_name: 'web',
              permissions: [],
            });
          }
        } finally {
          // Só resetar se ainda estamos editando o mesmo role
          if (currentEditingIdRef.current === targetId) {
            setLoadingRole(false);
            loadingRef.current = false;
          }
        }
      };
      
      loadRoleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, isCreating]);

  const handleCreate = () => {
    setFormData({ name: '', guard_name: 'web', permissions: [] });
    setFormError(null);
    setIsCreating(true);
    setEditingId(null);
  };

  const handleEdit = (role: Role) => {
    console.log('[Profiles] handleEdit chamado para role:', role);
    setFormError(null);
    setEditingId(role.id);
    setIsCreating(false);
    // O useEffect vai carregar os dados completos
  };

  const handleCancel = () => {
    if (loadingRole) return;
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', guard_name: 'web', permissions: [] });
    setFormError(null);
    setExpandedModules(new Set());
    setLoadingRole(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nome do perfil é obrigatório');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        guard_name: formData.guard_name,
        permissions: formData.permissions, // Enviar array de IDs diretamente, não objetos
      };

      if (editingId) {
        await updateRole(String(editingId), payload);
        showSuccess('Perfil atualizado com sucesso!');
      } else {
        await createRole(payload);
        showSuccess('Perfil criado com sucesso!');
      }

      await fetchRoles(1, {});
      handleCancel();
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.data?.message || err.message || 'Erro ao salvar perfil';
      showError('Erro ao salvar perfil', errorMessage);
    }
  };

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(String(roleToDelete));
        showSuccess('Perfil excluído!', 'O perfil foi excluído com sucesso.');
        await fetchRoles(1, {});
        setDeleteModalOpen(false);
        setRoleToDelete(null);
      } catch (err: any) {
        console.error('Erro ao excluir perfil:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir perfil';
        showError('Erro ao excluir perfil', errorMessage);
      }
    }
  };


  if (loading && (!roles || roles.length === 0) && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const editingRole = editingId && roles && Array.isArray(roles) ? roles.find(r => r && r.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Perfis de Acesso</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie os perfis de usuário e suas permissões</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={18} /> Novo Perfil
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 font-medium">Erro ao carregar perfis: {error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles && Array.isArray(roles) && roles.length > 0 ? (
          roles.map((role) => {
            if (!role || !role.id) return null;
            const color = getProfileColor(role.name);
            const colorClasses = {
              red: { bg: 'bg-red-100', text: 'text-red-600', border: 'var(--store-color)' },
              blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: '#3b82f6' },
              emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: '#10b981' },
              amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: '#f59e0b' },
              info: { bg: 'bg-slate-100', text: 'text-slate-600', border: '#64748b' },
            };
            const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.info;

            return (
              <Card key={role.id} className="border-l-4" style={{ borderLeftColor: colorClass.border }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass.bg} ${colorClass.text}`}>
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{role.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Guard: {role.guard_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      title="Editar perfil"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(role);
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      title="Excluir perfil"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(role.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-900">{usersCountByRole[role.id] || 0}</span>
                    <span className="text-slate-500">
                      {usersCountByRole[role.id] === 1 ? 'usuário' : 'usuários'}
                    </span>
                  </div>

                  <div>
                    {(() => {
                      // Garantir que permissions seja sempre um array
                      const permissions = Array.isArray(role.permissions) ? role.permissions : [];
                      const permissionsCount = permissions.length;
                      
                      return (
                        <>
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Permissões ({permissionsCount})</p>
                          <div className="flex flex-wrap gap-2">
                            {permissionsCount > 0 ? (
                              permissions.slice(0, 5).map((perm) => (
                                <Badge key={perm.id} variant="success" title={perm.name}>
                                  {translatePermission(perm.name)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Nenhuma permissão</span>
                            )}
                            {permissionsCount > 5 && (
                              <Badge variant="info">+{permissionsCount - 5} mais</Badge>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Card>
            );
          }).filter(Boolean)
        ) : (
          <Card>
            <p className="text-slate-400 text-sm text-center py-8">Nenhum perfil encontrado</p>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isCreating || !!editingId}
        onClose={() => {
          if (!loadingRole) handleCancel();
        }}
        title={editingId ? 'Editar Perfil' : 'Criar Novo Perfil'}
        message={editingId ? 'Edite as informações do perfil' : 'Preencha os dados para criar um novo perfil'}
        type="info"
        size="xl"
        showCancel={false}
        onConfirm={undefined}
        confirmText=""
      >
        {loadingRole && !formData.name && editingId ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--store-color)' }} />
            <span className="ml-3 text-slate-600">Carregando dados do perfil...</span>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Perfil *"
            placeholder="Ex: Supervisor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 block">
                Permissões
              </label>
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
              <div className="space-y-2 max-h-96 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-white">
                {/* Tags dos módulos */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-100">
                  {Object.keys(permissionsByModule).map((module) => {
                    const modulePerms = permissionsByModule[module];
                    const isExpanded = expandedModules.has(module);
                    const isFullySelected = isModuleFullySelected(module);
                    const selectedCount = modulePerms.filter(p => formData.permissions.includes(p.id)).length;
                    
                    return (
                      <button
                        key={module}
                        type="button"
                        onClick={() => toggleModule(module)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isExpanded
                            ? 'bg-red-600 text-white'
                            : isFullySelected
                            ? 'bg-red-50 text-red-600 border-2 border-red-200'
                            : selectedCount > 0
                            ? 'bg-slate-100 text-slate-700 border-2 border-slate-200'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {translateResource(module)}
                        {selectedCount > 0 && (
                          <span 
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isExpanded ? 'bg-white/20' : 'text-white'
                            }`}
                            style={!isExpanded ? {
                              backgroundColor: 'var(--store-color)',
                            } : undefined}
                          >
                            {selectedCount}/{modulePerms.length}
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
                    <div key={module} className="mb-4 last:mb-0">
                      {/* Header do módulo com checkbox "Selecionar todas" */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
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
                          {modulePerms.filter(p => formData.permissions.includes(p.id)).length} de {modulePerms.length} selecionadas
                        </span>
                      </div>
                      
                      {/* Lista de permissões do módulo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {modulePerms.map((perm) => {
                          const isSelected = formData.permissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(perm.id)}
                                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-slate-700">{translatePermission(perm.name)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Clique nos módulos para expandir e selecionar permissões específicas
            </p>
          </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <Button type="button" onClick={handleCancel} variant="outline">Cancelar</Button>
              <Button type="submit">
                <Save size={18} /> {editingId ? 'Atualizar' : 'Criar'} Perfil
              </Button>
            </div>
          </form>
          </>
        )}
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        type="danger"
        title="Excluir Perfil"
        message="Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        size="md"
      />
    </div>
  );
};
