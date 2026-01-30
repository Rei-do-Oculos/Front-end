
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail } from 'lucide-react';
import { Card, Button, Badge, Input, Select, FilterSection, Modal, ActiveFiltersBadge } from '../../components/Common';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../services/hooks/useUsers';
import { usePlucks } from '../../services/hooks/usePlucks';
import { rolesService } from '../../services/api/roles';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../services/hooks/useAuth';
import { useActiveFilters } from '../../hooks/useActiveFilters';

export const UsersPermissions: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { users, loading, error, fetchUsers, deleteUser } = useUsers({
    autoFetch: false,
  });
  
  const { plucks: rolesPlucks, loading: rolesPlucksLoading } = usePlucks({
    service: rolesService,
    autoFetch: true,
  });
  
  const safeRolesPlucks = Array.isArray(rolesPlucks) ? rolesPlucks : [];
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
  // Filtros
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Calcular quantidade de filtros ativos usando hook padronizado
  const activeFilters = useActiveFilters({
    searchName,
    searchEmail,
    filterRole,
    filterStatus,
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        await fetchUsers(1, {});
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
      }
    };
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    navigate('/users/create');
  };

  const handleEdit = (userId: number) => {
    navigate(`/users/${userId}/edit`);
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await deleteUser(String(userToDelete));
        showSuccess('Usuário excluído!', 'O usuário foi excluído com sucesso.');
        await fetchUsers(1, {});
        setDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (err: any) {
        console.error('Erro ao excluir usuário:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir usuário';
        showError('Erro ao excluir usuário', errorMessage);
      }
    }
  };

  const handleApplyFilters = async () => {
    const params: any = {};
    if (searchName) params.search = searchName;
    if (searchEmail) params.email = searchEmail;
    if (filterRole) params.role_id = filterRole;
    if (filterStatus) params.status = filterStatus;
    
    await fetchUsers(1, params);
  };


  const handleClearFilters = async () => {
    setSearchName('');
    setSearchEmail('');
    setFilterRole('');
    setFilterStatus('');
    await fetchUsers(1, {});
  };

  const getProfileColor = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'danger';
    if (name.includes('gerente') || name.includes('manager')) return 'primary';
    if (name.includes('vendedor') || name.includes('seller')) return 'success';
    if (name.includes('caixa') || name.includes('cashier')) return 'warning';
    return 'info';
  };

  const filteredUsers = (users || []).filter(user => {
    if (!user) return false;
    if (currentUser && user.id === currentUser.id) return false;
    if (searchName && !user.name?.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchEmail && !user.email?.toLowerCase().includes(searchEmail.toLowerCase())) return false;
    if (filterRole) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [];
      const hasRole = userRoles.some(r => String(r.id) === filterRole);
      if (!hasRole) return false;
    }
    return true;
  });

  if (loading && (!users || users.length === 0) && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--store-color)' }}></div>
      </div>
    );
  }

  if (error && (!users || users.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <p className="font-medium" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar usuários: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Usuários e Permissões</h2>
            <p className="text-sm text-slate-500 mt-1">Associe usuários a perfis e permissões extras</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="shadow-red-600/20">
          <Plus size={18} /> Novo Usuário
        </Button>
      </div>

      {error && (
        <div className="border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <p className="font-medium" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar usuários: {error.message}</p>
        </div>
      )}

      <FilterSection onApply={handleApplyFilters} onClear={handleClearFilters}>
        <Input
          label="Nome"
          placeholder="Buscar por nome..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          label="E-mail"
          placeholder="Buscar por e-mail..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <Select
          label="Perfil"
          options={[
            { label: 'TODOS', value: '' },
            ...safeRolesPlucks.map((r: any) => ({ label: r.name, value: String(r.id) })),
          ]}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        />
        <Select
          label="Status"
          options={[
            { label: 'TODOS', value: '' },
            { label: 'Ativo', value: 'active' },
            { label: 'Inativo', value: 'inactive' },
          ]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        />
      </FilterSection>

      {/* Contagem de resultados e badge de filtros ativos */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-slate-600">
            {users.length === 0 ? 'Nenhum resultado encontrado' : 
             users.length === 1 ? '1 resultado encontrado' : 
             `${users.length} resultados encontrados`}
          </p>
          {activeFilters > 0 && (
            <ActiveFiltersBadge count={activeFilters} />
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Perfis</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cadastro</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-slate-400 text-sm">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  return (
                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-400">#{user.id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '';
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <User size={18} />
                          </div>
                          <div>
                            <p 
                              className="text-sm font-bold text-slate-900 transition-colors cursor-pointer"
                              style={{ color: 'var(--store-color-dark)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--store-color)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--store-color-dark)';
                              }}
                            >
                              {user.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail size={12} />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Garantir que roles seja sempre um array
                            const userRoles = Array.isArray(user.roles) ? user.roles : [];
                            
                            if (userRoles.length > 0) {
                              return userRoles.map((role) => (
                                <Badge key={role.id} variant={getProfileColor(role.name) as any}>
                                  {role.name}
                                </Badge>
                              ));
                            } else {
                              return <span className="text-xs text-slate-400">Nenhum perfil</span>;
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge 
                          variant={user.active !== false ? 'success' : 'danger'}
                        >
                          {user.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          {(() => {
                            if (!user.created_at) {
                              return <span className="text-slate-400">-</span>;
                            }
                            
                            try {
                              let date: Date;
                              
                              if (user.created_at.includes('/') && user.created_at.includes(' ')) {
                                const [datePart, timePart] = user.created_at.split(' ');
                                const [day, month, year] = datePart.split('/');
                                date = new Date(`${year}-${month}-${day} ${timePart}`);
                              } else {
                                date = new Date(user.created_at);
                              }
                              
                              if (isNaN(date.getTime())) {
                                return <span className="text-slate-400">-</span>;
                              }
                              
                              return (
                                <span>
                                  {date.toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })} {date.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              );
                            } catch (error) {
                              console.warn('Erro ao formatar data:', user.created_at, error);
                              return <span className="text-slate-400">-</span>;
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="Editar usuário"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            onClick={() => handleEdit(user.id)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            title="Excluir usuário"
                            className="p-2 text-slate-400 rounded-xl transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                              e.currentTarget.style.backgroundColor = 'var(--store-color-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                              e.currentTarget.style.backgroundColor = '';
                            }}
                            onClick={() => handleDeleteClick(user.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        type="danger"
        title="Excluir Usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        size="md"
      />
    </div>
  );
};
