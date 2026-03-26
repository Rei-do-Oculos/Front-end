import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from './Common';
import { translatePermission, translateResource } from '../utils/translations';

/** Setores na ordem da sidebar com seus módulos */
const SECTOR_ORDER: { label: string; modules: string[] }[] = [
  { label: 'Lojas', modules: ['stores'] },
  { label: 'Clientes', modules: ['clients', 'client-prescriptions'] },
  { label: 'Estoque', modules: ['frames', 'frame-types', 'store-frames', 'stock-reports'] },
  // Lentes oculto no front por enquanto
  // { label: 'Lentes', modules: ['lenses'] },
  { label: 'Laboratórios', modules: ['laboratories', 'laboratory-lenses'] },
  { label: 'Financeiro', modules: ['finance', 'expenses', 'expenses-admin', 'service-orders-overdue', 'invoices'] },
  { label: 'Pedidos (OS)', modules: ['service-orders', 'service-orders-lab'] },
  { label: 'PDV', modules: ['pdv'] },
  { label: 'Sistema', modules: ['roles', 'permissions', 'users', 'audits', 'trash'] },
];

const EXCLUDED_MODULES = ['model-has-permissions', 'model-has-roles', 'role-has-permissions'];
/** Módulos ocultos no front (ex.: Lentes) — não exibir em setores nem em OUTROS */
const HIDDEN_MODULES = ['lenses'];

export interface PermissionsSelectorProps {
  permissions: Array<{ id: number; name: string }>;
  value: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
  /** IDs de permissões vindas do perfil (para UserForm - mostra badge Do Perfil/Bloqueada) */
  permissionsFromRoles?: number[];
  /** Texto ou elemento extra abaixo do seletor (ex: explicação sobre permissões do perfil) */
  hint?: React.ReactNode;
}

export const PermissionsSelector: React.FC<PermissionsSelectorProps> = ({
  permissions,
  value,
  onChange,
  loading = false,
  permissionsFromRoles = [],
  hint,
}) => {
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const safePermissions = Array.isArray(permissions) ? permissions : [];

  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Array<{ id: number; name: string; action: string }>> = {};
    safePermissions.forEach((perm: any) => {
      const parts = (perm.name || '').split('.');
      if (parts.length >= 2) {
        const module = parts[0];
        const action = parts.slice(1).join('.');
        if (EXCLUDED_MODULES.includes(module)) return;
        if (!grouped[module]) grouped[module] = [];
        grouped[module].push({ id: perm.id, name: perm.name, action });
      }
    });
    return grouped;
  }, [safePermissions]);

  const allPermissionIds = useMemo(() => {
    return safePermissions
      .filter((p: any) => !EXCLUDED_MODULES.includes((p.name || '').split('.')[0]))
      .map((p: any) => p.id);
  }, [safePermissions]);

  const allSelected = useMemo(() => {
    return allPermissionIds.length > 0 && allPermissionIds.every((id: number) => value.includes(id));
  }, [allPermissionIds, value]);

  const isSelected = (id: number) => value.includes(id);
  const isFromRole = (id: number) => permissionsFromRoles.includes(id);


  const selectAll = () => {
    if (allSelected) onChange([]);
    else onChange([...allPermissionIds]);
  };

  const selectModule = (module: string) => {
    const modulePerms = permissionsByModule[module] || [];
    const moduleIds = modulePerms.map(p => p.id);
    const fullySelected = isModuleFullySelectedForSector(module);
    if (fullySelected) {
      onChange(value.filter(id => !moduleIds.includes(id)));
    } else {
      onChange([...new Set([...value, ...moduleIds])]);
    }
  };

  const selectSector = (sectorLabel: string) => {
    const sector = SECTOR_ORDER.find(s => s.label === sectorLabel);
    if (!sector) return;
    const moduleIds = sector.modules.flatMap(m => (permissionsByModule[m] || []).map(p => p.id));
    const { selected: count, total } = getSectorCount(sectorLabel);
    const fullySelected = total > 0 && count === total;
    if (fullySelected) {
      onChange(value.filter(id => !moduleIds.includes(id)));
    } else {
      onChange([...new Set([...value, ...moduleIds])]);
    }
  };

  const togglePermission = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter(x => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const toggleSector = (label: string) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const allSectorModules = useMemo(() => new Set(SECTOR_ORDER.flatMap(s => s.modules)), []);
  const standaloneModules = useMemo(() => {
    return Object.keys(permissionsByModule).filter(m => !allSectorModules.has(m) && !HIDDEN_MODULES.includes(m));
  }, [permissionsByModule, allSectorModules]);

  const sectorsWithData = useMemo(() => {
    return SECTOR_ORDER.map(sector => ({
      ...sector,
      modules: sector.modules.filter(m => (permissionsByModule[m] || []).length > 0),
    })).filter(s => s.modules.length > 0);
  }, [permissionsByModule]);

  const getSectorCount = (sectorLabel: string) => {
    const sector = SECTOR_ORDER.find(s => s.label === sectorLabel);
    if (!sector) return { selected: 0, total: 0 };
    let selected = 0, total = 0;
    sector.modules.forEach(m => {
      const perms = permissionsByModule[m] || [];
      total += perms.length;
      selected += perms.filter(p => value.includes(p.id) || permissionsFromRoles.includes(p.id)).length;
    });
    return { selected, total };
  };

  const isSectorFullySelected = (sectorLabel: string) => {
    const { selected, total } = getSectorCount(sectorLabel);
    return total > 0 && selected === total;
  };

  const isModuleFullySelectedForSector = (module: string) => {
    const modulePerms = permissionsByModule[module] || [];
    if (modulePerms.length === 0) return false;
    return modulePerms.every(perm => value.includes(perm.id) || permissionsFromRoles.includes(perm.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  if (Object.keys(permissionsByModule).length === 0) {
    return <p className="text-xs text-slate-400 text-center py-4">Nenhuma permissão disponível</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1 block">
          Permissões
        </label>
        <button
          type="button"
          onClick={selectAll}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg transition-colors"
          style={{ color: 'var(--store-color)' }}
        >
          <div
            className={`w-4 h-4 border-2 rounded flex items-center justify-center ${allSelected ? '' : 'border-slate-300'}`}
            style={allSelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}
          >
            {allSelected && <Check size={12} className="text-white" />}
          </div>
          Selecionar Todas
        </button>
      </div>

      <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-white">
        {sectorsWithData.map((sector) => {
          const isExpanded = expandedSectors.has(sector.label);
          const { selected, total } = getSectorCount(sector.label);
          const fullySelected = isSectorFullySelected(sector.label);

          return (
            <div key={sector.label} className="border border-slate-100 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSector(sector.label)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
                  isExpanded ? 'text-white' : fullySelected ? 'border-l-4' : selected > 0 ? 'bg-slate-50' : 'hover:bg-slate-50'
                }`}
                style={
                  isExpanded
                    ? { backgroundColor: 'var(--store-color)' }
                    : fullySelected
                    ? { backgroundColor: 'var(--store-color-light)', color: 'var(--store-color)', borderLeftColor: 'var(--store-color)' }
                    : undefined
                }
              >
                <span className="font-semibold text-sm">{sector.label}</span>
                <span className="flex items-center gap-2">
                  {total > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${isExpanded ? 'bg-white/20' : ''}`}
                      style={!isExpanded ? { backgroundColor: 'var(--store-color)', color: 'white' } : undefined}
                    >
                      {selected}/{total}
                    </span>
                  )}
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 pt-2 bg-slate-50/50 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); selectSector(sector.label); }}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-3"
                  >
                    <div
                      className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center ${fullySelected ? '' : 'border-slate-300'}`}
                      style={fullySelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}
                    >
                      {fullySelected && <Check size={10} className="text-white" />}
                    </div>
                    {fullySelected ? 'Desmarcar setor' : 'Marcar todo o setor'}
                  </button>
                  <div className="space-y-3">
                    {sector.modules.map((module) => {
                      const modulePerms = permissionsByModule[module] || [];
                      const modExpanded = expandedModules.has(module);
                      const modFullySelected = isModuleFullySelectedForSector(module);
                      const selCount = modulePerms.filter(p => value.includes(p.id)).length;
                      const fromRoleCount = modulePerms.filter(p => isFromRole(p.id)).length;

                      return (
                        <div key={module} className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleModule(module)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                              modExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                role="button"
                                tabIndex={0}
                                className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center flex-shrink-0 cursor-pointer ${modFullySelected ? '' : 'border-slate-300'}`}
                                style={modFullySelected ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' } : undefined}
                                onClick={(e) => { e.stopPropagation(); selectModule(module); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectModule(module); } }}
                              >
                                {modFullySelected && <Check size={10} className="text-white" />}
                              </div>
                              <span className="font-medium text-slate-700">{translateResource(module)}</span>
                              {(selCount > 0 || fromRoleCount > 0) && (
                                <span className="text-xs text-slate-400">
                                  ({selCount + fromRoleCount}/{modulePerms.length}
                                  {fromRoleCount > 0 && ` · ${fromRoleCount} do perfil`})
                                </span>
                              )}
                            </div>
                            {modExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          {modExpanded && (
                            <div className="px-3 py-2 pb-3 border-t border-slate-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 ml-5">
                                {modulePerms.map((perm) => {
                                  const sel = isSelected(perm.id);
                                  const fromRole = isFromRole(perm.id);

                                  return (
                                    <label
                                      key={perm.id}
                                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${
                                        fromRole ? '' : 'hover:bg-slate-50'
                                      }`}
                                      style={fromRole ? { backgroundColor: 'var(--store-color-light)' } : undefined}
                                      onClick={() => togglePermission(perm.id)}
                                    >
                                      <div
                                        className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                                          sel ? '' : fromRole ? 'border-slate-300' : 'border-slate-300'
                                        }`}
                                        style={
                                          sel
                                            ? { backgroundColor: 'var(--store-color)', borderColor: 'var(--store-color)' }
                                            : fromRole
                                            ? { borderColor: 'var(--store-color-opacity-40)', backgroundColor: 'var(--store-color-light)' }
                                            : undefined
                                        }
                                      >
                                        {sel && <Check size={10} className="text-white" />}
                                      </div>
                                      <span className={`text-xs flex-1 ${fromRole ? 'font-medium' : 'text-slate-700'}`} style={fromRole ? { color: 'var(--store-color)' } : undefined}>
                                        {translatePermission(perm.name)}
                                      </span>
                                      {permissionsFromRoles.length > 0 && (
                                        <>
                                          {fromRole && sel && (
                                            <Badge variant="info" className="text-[10px] text-white" style={{ backgroundColor: 'var(--store-color)' }}>
                                              Do Perfil
                                            </Badge>
                                          )}
                                          {fromRole && !sel && (
                                            <Badge variant="warning" className="text-[10px] bg-amber-500 text-white">
                                              Bloqueada
                                            </Badge>
                                          )}
                                          {sel && !fromRole && (
                                            <Badge variant="success" className="text-[10px]">
                                              Extra
                                            </Badge>
                                          )}
                                        </>
                                      )}
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

      </div>

      <p className="text-xs text-slate-400 mt-2">Clique nos setores para expandir e selecionar permissões por módulo</p>

      {hint && <div className="mt-2">{hint}</div>}
    </div>
  );
};
