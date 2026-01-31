import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Shield, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Input } from '../../components/Common';
import { useRoles } from '../../services/hooks/useRoles';
import { usePlucks } from '../../services/hooks/usePlucks';
import { permissionsService } from '../../services/api/permissions';
import { translatePermission, translateResource } from '../../utils/translations';
import { useNotification } from '../../hooks/useNotification';

export const ProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const { showSuccess, showError } = useNotification();
  const { createRole, updateRole, getRole } = useRoles({ autoFetch: false });
  
  const { plucks: permissionsPlucks, loading: permissionsPlucksLoading } = usePlucks({
    service: permissionsService,
    autoFetch: true,
  });
  
  const safePermissionsPlucks = Array.isArray(permissionsPlucks) ? permissionsPlucks : [];
  
  const [formData, setFormData] = useState({
    name: '',
    guard_name: 'web',
    permissions: [] as number[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Agrupar permissões por módulo
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Array<{ id: number; name: string; action: string }>> = {};
    
    safePermissionsPlucks.forEach((perm: any) => {
      const parts = perm.name.split('.');
      if (parts.length >= 2) {
        const module = parts[0];
        const action = parts.slice(1).join('.');
        
        // Filtrar permissões técnicas
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
    return safePermissionsPlucks
      .filter((p: any) => {
        const module = p.name.split('.')[0];
        return !['model-has-permissions', 'model-has-roles', 'role-has-permissions'].includes(module);
      })
      .map((p: any) => p.id);
  }, [safePermissionsPlucks]);

  // Verificar se todas as permissões estão selecionadas
  const allSelected = useMemo(() => {
    return allPermissionIds.length > 0 && allPermissionIds.every((id: number) => formData.permissions.includes(id));
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

  // Carregar dados do perfil ao editar
  useEffect(() => {
    if (isEditing && id) {
      setLoadingRole(true);
      getRole(id)
        .then((role) => {
          if (role) {
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
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar perfil:', err);
          showError('Erro', 'Não foi possível carregar os dados do perfil');
        })
        .finally(() => {
          setLoadingRole(false);
        });
    }
  }, [id, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do perfil é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        guard_name: formData.guard_name,
        permissions: formData.permissions,
      };
      
      if (isEditing && id) {
        await updateRole(id, payload);
        showSuccess('Perfil atualizado com sucesso!');
      } else {
        await createRole(payload);
        showSuccess('Perfil criado com sucesso!');
      }
      
      navigate('/profiles');
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.data?.message || err.message || 'Erro ao salvar perfil';
      showError('Erro ao salvar perfil', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRole) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--store-color)' }} />
        <span className="ml-3 text-slate-600">Carregando dados do perfil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/profiles')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--store-color-light)' }}
          >
            <Shield size={24} style={{ color: 'var(--store-color)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
            </h1>
            <p className="text-sm text-slate-500">
              {isEditing ? 'Atualize as informações do perfil' : 'Preencha os dados para criar um novo perfil'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do Perfil"
            placeholder="Ex: Supervisor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            error={errors.name}
          />

          {/* Permissões */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 block">
                Permissões
              </label>
              <button
                type="button"
                onClick={selectAllPermissions}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                style={{ color: 'var(--store-color)' }}
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
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--store-color)' }} />
              </div>
            ) : Object.keys(permissionsByModule).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma permissão disponível</p>
            ) : (
              <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-white">
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
                            ? 'text-white'
                            : isFullySelected
                            ? 'border-2'
                            : selectedCount > 0
                            ? 'bg-slate-100 text-slate-700 border-2 border-slate-200'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
                        }`}
                        style={isExpanded ? {
                          backgroundColor: 'var(--store-color)',
                        } : isFullySelected ? {
                          backgroundColor: 'var(--store-color-light)',
                          color: 'var(--store-color)',
                          borderColor: 'var(--store-color)',
                        } : undefined}
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
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => selectModulePermissions(module)}
                          className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:opacity-80 transition-colors"
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                        {modulePerms.map((perm) => {
                          const isSelected = formData.permissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                            >
                              <div 
                                className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${
                                  isSelected ? '' : 'border-slate-300'
                                }`}
                                style={isSelected ? {
                                  backgroundColor: 'var(--store-color)',
                                  borderColor: 'var(--store-color)',
                                } : undefined}
                                onClick={() => togglePermission(perm.id)}
                              >
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
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

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/profiles')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isEditing ? 'Atualizar Perfil' : 'Criar Perfil'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
