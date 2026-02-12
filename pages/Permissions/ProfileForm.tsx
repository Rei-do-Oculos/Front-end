import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Shield, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Input } from '../../components/Common';
import { useRoles } from '../../services/hooks/useRoles';
import { usePlucks } from '../../services/hooks/usePlucks';
import { permissionsService } from '../../services/api/permissions';
import { translatePermission, translateResource } from '../../utils/translations';
import { useNotification } from '../../hooks/useNotification';

/** Setores na ordem da sidebar com seus módulos */
const SECTOR_ORDER: { label: string; modules: string[] }[] = [
  { label: 'Lojas', modules: ['stores'] },
  { label: 'Clientes', modules: ['clients'] },
  { label: 'Estoque', modules: ['frames', 'frame-types', 'store-frames'] },
  { label: 'Lentes', modules: ['lenses'] },
  { label: 'Laboratórios', modules: ['laboratories', 'laboratory-lenses'] },
  { label: 'Financeiro', modules: ['finance', 'expenses', 'service-orders-overdue'] },
  { label: 'Pedidos (OS)', modules: ['service-orders', 'service-orders-lab'] },
  { label: 'Sistema', modules: ['roles', 'permissions', 'users', 'audits', 'trash'] },
];

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
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
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

  // Toggle de expansão de setor
  const toggleSector = (sectorLabel: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorLabel)) {
        newSet.delete(sectorLabel);
      } else {
        newSet.add(sectorLabel);
      }
      return newSet;
    });
  };

  // Toggle de expansão de módulo (dentro do setor)
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

  // Módulos que não pertencem a nenhum setor (avulsos)
  const allSectorModules = useMemo(() => new Set(SECTOR_ORDER.flatMap(s => s.modules)), []);
  const standaloneModules = useMemo(() => {
    return Object.keys(permissionsByModule).filter(m => !allSectorModules.has(m));
  }, [permissionsByModule, allSectorModules]);

  // Setores com apenas os módulos que existem em permissionsByModule
  const sectorsWithData = useMemo(() => {
    return SECTOR_ORDER.map(sector => ({
      ...sector,
      modules: sector.modules.filter(m => permissionsByModule[m]?.length > 0),
    })).filter(s => s.modules.length > 0);
  }, [permissionsByModule]);

  // Contagem selecionada para setor
  const getSectorSelectedCount = (sectorLabel: string) => {
    const sector = SECTOR_ORDER.find(s => s.label === sectorLabel);
    if (!sector) return { selected: 0, total: 0 };
    let selected = 0, total = 0;
    sector.modules.forEach(m => {
      const perms = permissionsByModule[m] || [];
      total += perms.length;
      selected += perms.filter(p => formData.permissions.includes(p.id)).length;
    });
    return { selected, total };
  };

  // Selecionar todas as permissões de um setor
  const selectSectorPermissions = (sectorLabel: string) => {
    const sector = SECTOR_ORDER.find(s => s.label === sectorLabel);
    if (!sector) return;
    const moduleIds = sector.modules.flatMap(m => (permissionsByModule[m] || []).map(p => p.id));
    const sectorSelected = getSectorSelectedCount(sectorLabel);
    const isFullySelected = sectorSelected.selected === sectorSelected.total && sectorSelected.total > 0;
    if (isFullySelected) {
      setFormData(prev => ({ ...prev, permissions: prev.permissions.filter(id => !moduleIds.includes(id)) }));
    } else {
      setFormData(prev => ({ ...prev, permissions: [...new Set([...prev.permissions, ...moduleIds])] }));
    }
  };

  const isSectorFullySelected = (sectorLabel: string) => {
    const { selected, total } = getSectorSelectedCount(sectorLabel);
    return total > 0 && selected === total;
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
              <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-white">
                {/* Setores (ordem da sidebar) */}
                {sectorsWithData.map((sector) => {
                  const isSectorExpanded = expandedSectors.has(sector.label);
                  const { selected: sectorSelected, total: sectorTotal } = getSectorSelectedCount(sector.label);
                  const sectorFullySelected = isSectorFullySelected(sector.label);

                  return (
                    <div key={sector.label} className="border border-slate-100 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSector(sector.label)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
                          isSectorExpanded
                            ? 'text-white'
                            : sectorFullySelected
                            ? 'border-l-4'
                            : sectorSelected > 0
                            ? 'bg-slate-50'
                            : 'hover:bg-slate-50'
                        }`}
                        style={isSectorExpanded
                          ? { backgroundColor: 'var(--store-color)' }
                          : sectorFullySelected
                          ? { backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)', borderLeftColor: 'var(--store-color)' }
                          : undefined}
                      >
                        <span className="font-semibold text-sm">{sector.label}</span>
                        <span className="flex items-center gap-2">
                          {sectorTotal > 0 && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${isSectorExpanded ? 'bg-white/20' : ''}`}
                              style={!isSectorExpanded ? { backgroundColor: 'var(--store-color)', color: 'white' } : undefined}>
                              {sectorSelected}/{sectorTotal}
                            </span>
                          )}
                          {isSectorExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                      </button>

                      {isSectorExpanded && (
                        <div className="p-4 pt-2 bg-slate-50/50 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); selectSectorPermissions(sector.label); }}
                              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                              <div className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center ${sectorFullySelected ? '' : 'border-slate-300'}`}
                                style={sectorFullySelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}>
                                {sectorFullySelected && <Check size={10} className="text-white" />}
                              </div>
                              {sectorFullySelected ? 'Desmarcar setor' : 'Marcar todo o setor'}
                            </button>
                          </div>
                          <div className="space-y-3">
                            {sector.modules.map((module) => {
                              const modulePerms = permissionsByModule[module] || [];
                              const isModuleExpanded = expandedModules.has(module);
                              const isFullySelected = isModuleFullySelected(module);
                              const selectedCount = modulePerms.filter(p => formData.permissions.includes(p.id)).length;

                              return (
                                <div key={module} className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleModule(module)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                                      isModuleExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        role="button"
                                        tabIndex={0}
                                        className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center flex-shrink-0 cursor-pointer ${isFullySelected ? '' : 'border-slate-300'}`}
                                        style={isFullySelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}
                                        onClick={(e) => { e.stopPropagation(); selectModulePermissions(module); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectModulePermissions(module); } }}
                                      >
                                        {isFullySelected && <Check size={10} className="text-white" />}
                                      </div>
                                      <span className="font-medium text-slate-700">{translateResource(module)}</span>
                                      {selectedCount > 0 && (
                                        <span className="text-xs text-slate-400">({selectedCount}/{modulePerms.length})</span>
                                      )}
                                    </div>
                                    {isModuleExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </button>
                                  {isModuleExpanded && (
                                    <div className="px-3 py-2 pb-3 border-t border-slate-50">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 ml-5">
                                        {modulePerms.map((perm) => {
                                          const isSelected = formData.permissions.includes(perm.id);
                                          return (
                                            <label key={perm.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer" onClick={() => togglePermission(perm.id)}>
                                              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${isSelected ? '' : 'border-slate-300'}`}
                                                style={isSelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}>
                                                {isSelected && <Check size={10} className="text-white" />}
                                              </div>
                                              <span className="text-xs text-slate-700">{translatePermission(perm.name)}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Módulos avulsos (fora dos setores) */}
                {standaloneModules.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Outros</p>
                    <div className="flex flex-wrap gap-2">
                      {standaloneModules.map((module) => {
                        const modulePerms = permissionsByModule[module] || [];
                        const isExpanded = expandedModules.has(module);
                        const isFullySelected = isModuleFullySelected(module);
                        const selectedCount = modulePerms.filter(p => formData.permissions.includes(p.id)).length;
                        return (
                          <div key={module} className="flex-1 min-w-[140px]">
                            <button
                              type="button"
                              onClick={() => toggleModule(module)}
                              className={`w-full inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isExpanded ? 'text-white' : isFullySelected ? 'border-2' : selectedCount > 0 ? 'bg-slate-100 border-2 border-slate-200' : 'bg-white border-2 border-slate-200 hover:bg-slate-50'
                              }`}
                              style={isExpanded ? { backgroundColor: 'var(--store-color)' } : isFullySelected ? { backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}
                            >
                              {translateResource(module)}
                              {selectedCount > 0 && <span className="text-[10px]">{selectedCount}/{modulePerms.length}</span>}
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                {modulePerms.map((perm) => {
                                  const isSelected = formData.permissions.includes(perm.id);
                                  return (
                                    <label key={perm.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs">
                                      <div className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center ${isSelected ? '' : 'border-slate-300'}`}
                                        style={isSelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}
                                        onClick={() => togglePermission(perm.id)}>
                                        {isSelected && <Check size={8} className="text-white" />}
                                      </div>
                                      <span onClick={() => togglePermission(perm.id)}>{translatePermission(perm.name)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Clique nos setores para expandir e selecionar permissões por módulo
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
