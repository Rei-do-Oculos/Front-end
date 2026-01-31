import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/Common';
import { useRoles } from '../../services/hooks/useRoles';
import { useUsers } from '../../services/hooks/useUsers';
import { Role } from '../../services/api/roles';
import { translatePermission } from '../../utils/translations';
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
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { roles, loading, error, fetchRoles, deleteRole } = useRoles({
    autoFetch: false,
  });
  
  const { users } = useUsers({
    autoFetch: true,
  });
  
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchRoles(1, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    navigate('/profiles/create');
  };

  const handleEdit = (role: Role) => {
    navigate(`/profiles/${role.id}/edit`);
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
