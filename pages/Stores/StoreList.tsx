
import React, { useState, useEffect } from 'react';
import { Plus, Store, MapPin, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Modal, SortableHeader, SortDirection, Pagination, AccessDeniedCard } from '../../components/Common';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../../services/hooks/useStores';
import { useNotification } from '../../hooks/useNotification';
import { usePermission } from '../../services/hooks/usePermission';

export const StoreList: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = usePermission();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [perPage, setPerPage] = useState<number>(15);
  
  const { stores, loading, error, pagination, fetchStores, deleteStore } = useStores({
    autoFetch: false,
  });

  useEffect(() => {
    fetchStores(1, {
      order_by: sortBy || 'id',
      order_dir: sortDirection || 'desc',
      per_page: perPage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleSort = (key: string, direction: SortDirection) => {
    const newDirection = direction || 'asc';
    setSortBy(key);
    setSortDirection(newDirection);
    
    const params: any = {};
    params.order_by = key;
    params.order_dir = newDirection;
    params.per_page = perPage;
    
    fetchStores(pagination?.currentPage || 1, params);
  };

  const handlePerPageChange = async (newPerPage: number) => {
    setPerPage(newPerPage);
    try {
      const params: any = {
        per_page: newPerPage,
      };
      if (sortBy && sortDirection) {
        params.order_by = sortBy;
        params.order_dir = sortDirection;
      }
      await fetchStores(1, params);
    } catch (err) {
      console.error('Erro ao alterar itens por página:', err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setStoreToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (storeToDelete) {
      try {
        await deleteStore(String(storeToDelete));
        showSuccess('Loja excluída!', 'A loja foi excluída com sucesso.');
        await fetchStores(1, {
          order_by: sortBy || 'id',
          order_dir: sortDirection || 'desc',
          per_page: perPage,
        });
        setDeleteModalOpen(false);
        setStoreToDelete(null);
      } catch (err: any) {
        console.error('Erro ao excluir loja:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir loja';
        showError('Erro ao excluir loja', errorMessage);
      }
    }
  };

  const getCityDisplay = (store: any) => {
    if (store.municipio && store.uf) {
      return `${store.municipio} - ${store.uf}`;
    }
    return store.city || 'Não informado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--store-color)' }}></div>
      </div>
    );
  }

  if (error) {
    if ((error as any).status === 403) {
      return <AccessDeniedCard />;
    }
    return (
      <div className="p-8">
        <div className="border rounded-xl p-4" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
          <p className="font-medium" style={{ color: 'var(--store-color-dark)' }}>Erro ao carregar lojas: {error.message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Gestão de Unidades</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[9px] tracking-[0.25em]">Filiais • Franquias • Pontos de Venda</p>
        </div>
        {hasPermission('stores.create') && (
          <Button onClick={() => navigate('/stores/create')}>
            <Plus size={18} /> Nova Unidade
          </Button>
        )}
      </div>

      {/* Contagem de resultados e seletor de itens por página */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {pagination && (
            <p className="text-sm font-medium text-slate-600">
              {pagination.totalItems === 0 ? 'Nenhum resultado encontrado' : 
               pagination.totalItems === 1 ? '1 resultado encontrado' : 
               `${pagination.totalItems} resultados encontrados`}
            </p>
          )}
        </div>
        {pagination && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Mostrar:
            </label>
            <select
              value={String(perPage)}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-5)]"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Localização</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <p className="text-slate-400 font-medium">Nenhuma loja encontrada</p>
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr 
                    key={store.id} 
                    className="group transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--store-color-opacity-5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-400">#{store.id}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                          style={{ backgroundColor: store.color || '#3F4EC6' }}
                        >
                          <Store size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none">{store.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">{store.cnpj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <MapPin size={14} style={{ color: 'var(--store-color)' }} /> {getCityDisplay(store)}
                        </div>
                        {store.telefone && (
                          <p className="text-[10px] font-medium text-slate-400 ml-5">{store.telefone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant={store.active ? 'success' : 'danger'}>
                        {store.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('stores.update') && (
                          <button
                            title="Editar unidade"
                            onClick={() => navigate(`/stores/${store.id}/edit`)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--store-color-dark)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {hasPermission('stores.delete') && (
                          <button
                            title="Excluir unidade"
                            onClick={() => handleDeleteClick(store.id)}
                            className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--store-color-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '';
                          }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={(page) => {
              const params: any = {};
              if (sortBy && sortDirection) {
                params.order_by = sortBy;
                params.order_dir = sortDirection;
              }
              params.per_page = perPage;
              fetchStores(page, params);
            }}
            itemName="lojas"
          />
        )}
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStoreToDelete(null);
        }}
        type="danger"
        title="Excluir Loja"
        message="Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        size="md"
      />
    </div>
  );
};
