import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  TrendingUp, 
  Eye, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  ClipboardList, 
  Stethoscope, 
  Plus,
  AlertTriangle,
  Loader2,
  Building2,
  Trash2,
  PackageX
} from 'lucide-react';
import { Card, Button, Badge, Pagination, SortableHeader, SortDirection, Modal, SingleSelect } from '../../components/Common';
import { useClients } from '../../services/hooks/useClients';
import { usePermission } from '../../services/hooks/usePermission';
import { useNotification } from '../../hooks/useNotification';
import { Client, ClientUncollectedRecord } from '../../services/api/clients';
import { ServiceOrder } from '../../services/api/serviceOrders';
import { clientPrescriptionsService } from '../../services/api/clientPrescriptions';
import { ClientWhatsAppAvatar } from '../../components/ClientWhatsAppAvatar';
import { serviceOrdersService } from '../../services/api/serviceOrders';
import { useBackToList } from '../../hooks/useBackToList';
import { formatPhone } from '../../utils/formatters';

// Interface estendida para incluir dados do relacionamento
interface ClientWithRelationships extends Client {
  relationships?: {
    stores?: Array<{ id: number; name: string; unity?: string }>;
  };
}

type TabType = 'compras' | 'receitas' | 'nao_retiradas' | 'observacoes';

interface Statistics {
  total_spent: number;
  total_orders: number;
  average_ticket: number;
  last_purchase: string | null;
  is_overdue: boolean;
  overdue_count: number;
  overdue_total: number;
  has_uncollected?: boolean;
  uncollected_count?: number;
  uncollected_total?: number;
}

const PurchasesTab = ({ 
  orders, 
  loading, 
  pagination,
  onPageChange,
  sortBy,
  sortDirection,
  onSort,
  navigate,
}: { 
  orders: ServiceOrder[];
  loading: boolean;
  pagination: { currentPage: number; totalPages: number; totalItems: number } | null;
  onPageChange: (page: number) => void;
  sortBy: string | null;
  sortDirection: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
  navigate: (path: string) => void;
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Finalizada', variant: 'success' as const };
      case 'pending': return { label: 'Pendente', variant: 'warning' as const };
      case 'sent_to_lab': return { label: 'No Laboratório', variant: 'info' as const };
      case 'ready_for_pickup': return { label: 'Aguardando Retirada', variant: 'primary' as const };
      case 'overdue': return { label: 'Inadimplente', variant: 'danger' as const };
      case 'not_picked_up': return { label: 'Não retirada', variant: 'warning' as const };
      default: return { label: status, variant: 'info' as const };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatOsNumber = (osNumber: number) => {
    return String(osNumber).padStart(4, '0');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--store-color)' }} />
        <span className="ml-3 text-sm text-slate-500">Carregando histórico...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <ShoppingBag size={48} className="text-slate-200" />
        <p className="text-sm text-slate-500">Nenhuma ordem de serviço encontrada</p>
      </div>
    );
  }

  return (
    <div>
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
              <SortableHeader
                label="Nº OS"
                sortKey="os_number"
                currentSort={sortBy}
                currentDirection={sortDirection}
                onSort={onSort}
                className="px-6 py-4"
              />
              <SortableHeader
                label="Data"
                sortKey="created_at"
                currentSort={sortBy}
                currentDirection={sortDirection}
                onSort={onSort}
                className="px-6 py-4"
              />
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Ótica</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
            <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
            <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5">
                    <span className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                      {formatOsNumber(order.os_number)}
                    </span>
              </td>
              <td className="px-6 py-5">
                    <span className="text-sm text-slate-600">{formatDate(order.created_at)}</span>
              </td>
              <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {order.store?.name || '-'}
                    </p>
              </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>
                      {formatCurrency(order.price || 0)}
                    </p>
              </td>
                  <td className="px-6 py-5 text-center">
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </td>
              <td className="px-6 py-5">
                    <div className="flex items-center justify-center">
                  <button
                    title="Ver detalhes da OS"
                        onClick={() => navigate(`/service-orders/${order.id}`)}
                        className="p-2 text-slate-400 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--store-color-dark)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '';
                        }}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </td>
            </tr>
              );
            })}
        </tbody>
      </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          perPage={10}
          onPerPageChange={() => {}}
          onPageChange={onPageChange}
          itemName="ordens de serviço"
        />
      )}
    </div>
  );
};

interface ClientPrescription {
  id: number;
  client_id: number;
  service_order_id: number | null;
  file_path: string;
  description: string | null;
  created_at: string;
  service_order?: { id: number; os_number: number; is_lab: boolean };
}

interface OsOption {
  id: number;
  os_number: number;
  date: string;
  is_lab: boolean;
}

const PrescriptionsTab = ({ clientId, hasCreate, hasUpdate, hasDelete }: {
  clientId: number;
  hasCreate: boolean;
  hasUpdate: boolean;
  hasDelete: boolean;
}) => {
  const { showSuccess, showError } = useNotification();
  const [prescriptions, setPrescriptions] = useState<ClientPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [osOptions, setOsOptions] = useState<OsOption[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<ClientPrescription | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<ClientPrescription | null>(null);
  const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    service_order_id: '' as string | number,
    description: '',
    file: null as File | null,
  });

  const loadPrescriptions = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const result = await clientPrescriptionsService.getAll({ client_id: clientId, per_page: 50 });
      setPrescriptions(result.data);
    } catch (err: any) {
      console.error('Erro ao carregar receitas:', err);
      showError(err.message || 'Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  }, [clientId, showError]);

  const loadOsOptions = useCallback(async () => {
    if (!clientId) return;
    try {
      const plucks = await serviceOrdersService.plucks({ client_id: clientId });
      setOsOptions(plucks as OsOption[]);
    } catch {
      setOsOptions([]);
    }
  }, [clientId]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  useEffect(() => {
    if (formModalOpen) loadOsOptions();
  }, [formModalOpen, loadOsOptions]);

  const handleCreate = () => {
    setEditingPrescription(null);
    setFormData({ service_order_id: '', description: '', file: null });
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleEdit = (p: ClientPrescription) => {
    setEditingPrescription(p);
    setFormData({
      service_order_id: p.service_order_id ?? '',
      description: p.description ?? '',
      file: null,
    });
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingPrescription && !formData.file) {
      setFormError('Selecione um arquivo (PDF, JPG ou PNG)');
      return;
    }
    setSaving(true);
    try {
      if (editingPrescription) {
        const payload: any = {
          service_order_id: formData.service_order_id === '' ? null : Number(formData.service_order_id),
          description: formData.description || null,
        };
        if (formData.file) payload.file = formData.file;
        await clientPrescriptionsService.update(String(editingPrescription.id), payload);
        showSuccess('Foto (armação e receita) atualizada com sucesso!');
      } else {
        await clientPrescriptionsService.create({
          client_id: clientId,
          service_order_id: formData.service_order_id === '' ? null : Number(formData.service_order_id),
          description: formData.description || null,
          file: formData.file!,
        });
        showSuccess('Foto (armação e receita) cadastrada com sucesso!');
      }
      setFormModalOpen(false);
      loadPrescriptions();
    } catch (err: any) {
      const msg = err.response?.data?.data?.errors
        ? Object.values(err.response.data.data.errors).flat().join(', ')
        : err.message || 'Erro ao salvar';
      setFormError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (p: ClientPrescription) => {
    setPrescriptionToDelete(p);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!prescriptionToDelete) return;
    setDeleting(true);
    try {
      await clientPrescriptionsService.delete(String(prescriptionToDelete.id));
      setDeleteModalOpen(false);
      setPrescriptionToDelete(null);
      showSuccess('Foto excluída com sucesso!');
      loadPrescriptions();
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir receita');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      if (dateString.includes('/')) {
        const [d, m, y] = dateString.split(' ')[0].split('/');
        return `${d}/${m}/${y}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const getFileUrl = (path: string) => {
    if (!path) return '#';
    return path.startsWith('http') ? path : `/storage/${path}`;
  };

  const isPdf = (path: string) => /\.pdf$/i.test(path);

  const handleView = (path: string) => {
    setViewFileUrl(getFileUrl(path));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--store-color)' }} />
        <span className="ml-3 text-sm text-slate-500">Carregando receitas...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">{prescriptions.length} foto(s) de armação e receita</p>
        {hasCreate && (
          <Button onClick={handleCreate}>
            <Plus size={18} /> Nova foto (armação e receita)
          </Button>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--store-color-light)' }}>
            <Stethoscope size={40} style={{ color: 'var(--store-color)' }} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Nenhuma foto cadastrada</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Cadastre fotos da armação e da receita médica vinculadas às OS do cliente.
          </p>
          {hasCreate && (
            <Button onClick={handleCreate}>
              <Plus size={18} /> Cadastrar foto (armação e receita)
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <FileText size={24} style={{ color: 'var(--store-color)' }} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Foto armação e receita {p.service_order ? `- OS #${String(p.service_order.os_number).padStart(4, '0')}` : ''}
                      {p.service_order?.is_lab && (
                        <Badge variant="info" className="ml-2 text-[10px]">Lab</Badge>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(p.created_at)}</p>
                    {p.description && <p className="text-xs text-slate-600 mt-1">{p.description}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleView(p.file_path)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-[var(--store-color)] transition-colors"
                  title="Visualizar foto/documento"
                >
                  <Eye size={18} /> Visualizar
                </button>
              </div>
              <div className="flex items-center gap-2">
                {hasUpdate && (
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {hasDelete && (
                  <button
                    onClick={() => handleDeleteClick(p)}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => { if (!saving) { setFormModalOpen(false); setFormError(null); } }}
        title={editingPrescription ? 'Editar foto (armação e receita)' : 'Nova foto (armação e receita)'}
        message=""
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: 'var(--store-color-light)', borderColor: 'var(--store-color-opacity-20)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--store-color)' }}>{formError}</p>
            </div>
          )}

          <SingleSelect
            label="OS vinculada"
            value={formData.service_order_id === '' ? '' : String(formData.service_order_id)}
            onChange={(val) => setFormData({ ...formData, service_order_id: val === '' ? '' : Number(val) })}
            options={[
              { label: 'Nenhuma', value: '' },
              ...osOptions.map((os) => ({
                label: `OS #${String(os.os_number).padStart(4, '0')} - ${os.date}${os.is_lab ? ' (Lab)' : ''}`,
                value: String(os.id),
              })),
            ]}
            placeholder="Selecione..."
          />

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Descrição (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Ajuste de grau para perto"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[var(--store-color-opacity-20)] focus:border-[var(--store-color)]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Foto da armação e receita {editingPrescription ? '(deixe em branco para manter)' : '*'}
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] ?? null })}
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="text-xs text-slate-400 mt-1">PDF, JPG ou PNG. Máx 5MB. Será possível visualizar após cadastrar.</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => { setFormModalOpen(false); setFormError(null); }} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><FileText size={18} /> {editingPrescription ? 'Atualizar' : 'Cadastrar'}</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualizar foto/documento */}
      <Modal
        isOpen={!!viewFileUrl}
        onClose={() => setViewFileUrl(null)}
        title="Visualizar foto (armação e receita)"
        message=""
      >
        <div className="space-y-4">
          {viewFileUrl && (
            <>
              {isPdf(viewFileUrl) ? (
                <iframe
                  src={viewFileUrl}
                  title="Documento PDF"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50"
                  style={{ minHeight: '70vh', maxHeight: '75vh' }}
                />
              ) : (
                <div className="flex justify-center bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-auto" style={{ maxHeight: '75vh' }}>
                  <img
                    src={viewFileUrl}
                    alt="Foto armação e receita"
                    className="max-w-full h-auto object-contain rounded-lg"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <a
                  href={viewFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--store-color)' }}
                >
                  Abrir em nova aba
                </a>
                <Button type="button" variant="outline" onClick={() => setViewFileUrl(null)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Excluir */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { if (!deleting) { setDeleteModalOpen(false); setPrescriptionToDelete(null); } }}
        title="Excluir foto"
        message=""
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tem certeza que deseja excluir esta foto (armação e receita)?
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setPrescriptionToDelete(null); }} disabled={deleting}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <><Loader2 size={16} className="animate-spin" /> Excluindo...</> : <><Trash2 size={16} /> Excluir</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const UncollectedTab = ({
  records,
  navigate,
}: {
  records: ClientUncollectedRecord[];
  navigate: (path: string) => void;
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatOsNumber = (osNumber: number) => String(osNumber).padStart(4, '0');

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('pt-BR');
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageX size={48} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Nenhuma pendência de não retirada</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          Pendências registradas quando a OS é marcada como não retirada (permanece no histórico com o valor original).
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OS</th>
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loja</th>
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motivo</th>
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venda</th>
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total OS</th>
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendente</th>
            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-slate-50 hover:bg-amber-50/30">
              <td className="py-4">
                {record.service_order_id ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/service-orders/${record.service_order_id}`)}
                    className="font-bold text-left hover:underline"
                    style={{ color: 'var(--store-color)' }}
                    title="Abrir OS"
                  >
                    #{formatOsNumber(record.os_number)}
                  </button>
                ) : (
                  <div className="font-bold text-slate-900">#{formatOsNumber(record.os_number)}</div>
                )}
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mt-0.5">Não retirada</div>
              </td>
              <td className="py-4 text-sm text-slate-600">
                {record.relationships?.store?.name || '—'}
              </td>
              <td className="py-4 text-sm text-slate-600">
                {record.relationships?.reason_label || record.reason}
              </td>
              <td className="py-4 text-sm text-slate-600">{formatDate(record.sale_date)}</td>
              <td className="py-4 text-sm font-medium text-slate-700">{formatCurrency(Number(record.total_price) || 0)}</td>
              <td className="py-4 text-sm font-bold text-red-700">{formatCurrency(Number(record.amount_due) || 0)}</td>
              <td className="py-4">
                <Badge variant={record.status === 'open' ? 'danger' : 'success'}>
                  {record.relationships?.status_label || record.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.some((r) => r.notes) && (
        <div className="mt-6 space-y-3">
          {records.filter((r) => r.notes).map((record) => (
            <div key={`notes-${record.id}`} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
                {record.service_order_id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/service-orders/${record.service_order_id}`)}
                      className="hover:underline"
                      style={{ color: 'inherit' }}
                    >
                      OS #{formatOsNumber(record.os_number)}
                    </button>
                    {' '}— observações
                  </>
                ) : (
                  <>OS #{formatOsNumber(record.os_number)} — observações</>
                )}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NotesTab = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-amber-50">
        <ClipboardList size={40} className="text-amber-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Observações</h3>
      <p className="text-sm text-slate-500 text-center max-w-md">
        Módulo de observações será implementado em breve.
      </p>
      <Badge variant="info">Em breve</Badge>
    </div>
  );
};

export const ClientHistory: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canViewUncollected = hasPermission('clients.uncollected-records.list');
  const { getHistory } = useClients({ autoFetch: false });
  const { goBackToList } = useBackToList();

  const [client, setClient] = useState<ClientWithRelationships | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [uncollectedRecords, setUncollectedRecords] = useState<ClientUncollectedRecord[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('compras');
  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadHistory = useCallback(async (page = 1, params: any = {}) => {
    if (!id) return;

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingOrders(true);
    }

    try {
      const result = await getHistory(id, {
        page,
        per_page: 10,
        order_by: params.order_by || sortBy || 'created_at',
        order_dir: params.order_dir || sortDirection || 'desc',
      });

      // Processar cliente - stores podem vir em relationships ou diretamente
      const clientData = result.client as ClientWithRelationships;
      
      // Verificar se stores está em relationships
      if (clientData.relationships?.stores && (!clientData.stores || (Array.isArray(clientData.stores) && clientData.stores.length === 0))) {
        clientData.stores = clientData.relationships.stores;
      }
      // Converter stores de objeto para array se necessário
      if (clientData.stores && !Array.isArray(clientData.stores)) {
        clientData.stores = Object.values(clientData.stores);
      }
      
      setClient(clientData);
      setStatistics(result.statistics);

      let uncollectedArray: ClientUncollectedRecord[] = [];
      const rawUncollected = result.uncollected_records;
      if (Array.isArray(rawUncollected)) {
        uncollectedArray = rawUncollected;
      } else if (rawUncollected && typeof rawUncollected === 'object') {
        uncollectedArray = Object.values(rawUncollected) as ClientUncollectedRecord[];
      }
      setUncollectedRecords(uncollectedArray);

      // Processar service_orders
      const serviceOrdersData = result.service_orders;
      let ordersArray: ServiceOrder[] = [];
      
      if (serviceOrdersData?.data) {
        if (Array.isArray(serviceOrdersData.data)) {
          ordersArray = serviceOrdersData.data;
        } else if (typeof serviceOrdersData.data === 'object') {
          ordersArray = Object.values(serviceOrdersData.data) as ServiceOrder[];
        }
      }

      setOrders(ordersArray);
      
      if (serviceOrdersData) {
        setPagination({
          currentPage: serviceOrdersData.current_page || 1,
          totalPages: serviceOrdersData.last_page || 1,
          totalItems: serviceOrdersData.total || 0,
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
      setLoadingOrders(false);
    }
  }, [id, getHistory, sortBy, sortDirection]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDirection(direction);
    loadHistory(1, { order_by: key, order_dir: direction });
  };

  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined, showTime = false) => {
    if (!dateString) return '-';
    try {
      // O backend retorna no formato "d/m/Y H:i:s" (ex: "23/01/2026 14:30:00")
      // Precisamos converter para um formato que o JavaScript entenda
      let date: Date;
      
      if (dateString.includes('/')) {
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        
        date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      if (showTime) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      console.error('Erro ao formatar data:', e, dateString);
      return '-';
    }
  };

  // Pegar a primeira loja do cliente (onde foi cadastrado)
  const clientStore = client?.stores && Array.isArray(client.stores) && client.stores.length > 0
    ? client.stores[0]
    : null;

  useEffect(() => {
    if (!canViewUncollected && activeTab === 'nao_retiradas') {
      setActiveTab('compras');
    }
  }, [canViewUncollected, activeTab]);

  const tabs = [
    { id: 'compras' as TabType, label: 'Histórico de Compras', icon: ShoppingBag },
    { id: 'receitas' as TabType, label: 'Receitas e Armações', icon: Stethoscope },
    ...(canViewUncollected
      ? [{
          id: 'nao_retiradas' as TabType,
          label: statistics?.uncollected_count
            ? `Não retiradas (${statistics.uncollected_count})`
            : 'Não retiradas',
          icon: PackageX,
        }]
      : []),
    // { id: 'observacoes' as TabType, label: 'Observações', icon: ClipboardList }, // comentado por enquanto
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--store-color)' }} />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error || 'Cliente não encontrado'}</p>
        <Button variant="outline" onClick={() => goBackToList('/clients')}>
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => goBackToList('/clients')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 transition-all shadow-sm"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--store-color-dark)';
              e.currentTarget.style.borderColor = 'var(--store-color-opacity-20)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-950 tracking-tight">{client.name}</h1>
              {statistics?.is_overdue && (
                <Badge variant="danger">
                  <AlertTriangle size={12} className="mr-1" />
                  Inadimplente
                </Badge>
              )}
              {canViewUncollected && statistics?.has_uncollected && (
                <Badge variant="warning">
                  <PackageX size={12} className="mr-1" />
                  Não retirou
                </Badge>
              )}
            </div>
            <p className="text-gray-500 font-medium mt-1">Histórico completo do cliente</p>
          </div>
        </div>
        <div className="flex gap-3">
          {hasPermission('clients.update') && (
            <Button variant="outline" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <Edit size={18} /> Editar Cliente
          </Button>
          )}
          {hasPermission('service-orders.create') && (
            <Button onClick={() => navigate(`/service-orders/create?client_id=${client.id}`)}>
              <Plus size={18} /> Nova OS
          </Button>
          )}
        </div>
      </div>

      {/* Card de Informações do Cliente */}
      <Card className="border-l-4" style={{ borderLeftColor: statistics?.is_overdue ? '#ef4444' : canViewUncollected && statistics?.has_uncollected ? '#f59e0b' : 'var(--store-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-start gap-4">
              <ClientWhatsAppAvatar
                phone={client.phone}
                clientName={client.name}
                iconSize={28}
              />
              <div className="flex-1">
                <h2 className="text-2xl font-black text-slate-900">{client.name}</h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={16} style={{ color: 'var(--store-color)' }} />
                    {client.phone ? formatPhone(client.phone) : 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={16} style={{ color: 'var(--store-color)' }} />
                    {client.email || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={16} style={{ color: 'var(--store-color)' }} />
                    CPF: {client.document || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 size={16} style={{ color: 'var(--store-color)' }} />
                    Loja: {clientStore?.name || 'Não informada'}
                    {clientStore?.unity && ` (${clientStore.unity})`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                    <Calendar size={16} style={{ color: 'var(--store-color)' }} />
                    Cliente desde: {formatDate(client.created_at)}
                  </div>
                </div>
                {client.address && (
                  <div className="flex items-start gap-2 mt-3 text-sm text-slate-600">
                    <MapPin size={16} style={{ color: 'var(--store-color)' }} className="mt-0.5" />
                    {client.address}
                  </div>
                )}
                {client.observations && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
                      Observações
                    </p>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{client.observations}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Compras</p>
              <p className="text-2xl font-black text-slate-900">{statistics?.total_orders || 0}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Gasto</p>
              <p className="text-2xl font-black text-emerald-700">{formatCurrency(statistics?.total_spent || 0)}</p>
            </div>
            {canViewUncollected && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Saldo não retirada</p>
                <p className="text-2xl font-black text-amber-800">{formatCurrency(statistics?.uncollected_total || 0)}</p>
                {(statistics?.uncollected_count ?? 0) > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">
                    {statistics?.uncollected_count} pendência(s) aberta(s)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alerta de Inadimplência */}
        {statistics?.is_overdue && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  Cliente com {statistics.overdue_count} OS inadimplente(s)
                </p>
                <p className="text-xs text-red-600">
                  Valor total em atraso: {formatCurrency(statistics.overdue_total)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de não retiradas */}
        {canViewUncollected && statistics?.has_uncollected && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <PackageX size={24} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Cliente com {statistics.uncollected_count} pendência(s) de não retirada
                </p>
                <p className="text-xs text-amber-800">
                  Valor pendente registrado: {formatCurrency(statistics.uncollected_total || 0)}
                  {client.block_pickup_payment ? ' · Bloqueado para pagamento na retirada' : ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { title: 'Total Gasto', value: formatCurrency(statistics?.total_spent || 0), icon: DollarSign, accent: 'store' as const },
          { title: 'Total de Compras', value: String(statistics?.total_orders || 0), icon: ShoppingBag, accent: 'store' as const },
          ...(canViewUncollected
            ? [{
                title: 'Saldo não retirada',
                value: formatCurrency(statistics?.uncollected_total || 0),
                icon: PackageX,
                accent: 'amber' as const,
                subtitle: (statistics?.uncollected_count ?? 0) > 0
                  ? `${statistics?.uncollected_count} pendência(s)`
                  : undefined,
              }]
            : []),
          { title: 'Ticket Médio', value: formatCurrency(statistics?.average_ticket || 0), icon: TrendingUp, accent: 'store' as const },
          { title: 'Última Compra', value: statistics?.last_purchase ? formatDate(statistics.last_purchase) : 'Nenhuma', icon: Calendar, accent: 'store' as const },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const isAmber = stat.accent === 'amber';
          return (
            <div 
              key={index}
              className={`bg-white p-5 lg:p-8 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative ${
                isAmber ? 'border-amber-100 hover:shadow-amber-100/50' : 'border-gray-100 hover:shadow-gray-200/50'
              }`}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"
                style={{ backgroundColor: isAmber ? 'rgba(245, 158, 11, 0.1)' : 'var(--store-color-opacity-10)' }}
              />
              
              <div className="flex items-center justify-between mb-4 lg:mb-8">
                <div 
                  className="p-3 lg:p-4 rounded-xl"
                  style={isAmber ? {
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                  } : { 
                    backgroundColor: 'var(--store-color-light)',
                    color: 'var(--store-color)',
                  }}
                >
                  <Icon size={20} className="lg:w-6 lg:h-6" strokeWidth={2} />
                </div>
              </div>
              
              <div>
                <p className="text-[9px] lg:text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                <p className={`text-xl lg:text-2xl font-bold tracking-tight ${isAmber && (statistics?.uncollected_total ?? 0) > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                  {stat.value}
                </p>
                {'subtitle' in stat && stat.subtitle ? (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">{stat.subtitle}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Abas de Conteúdo */}
      <Card className="p-0 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-100">
          <div className="flex gap-1 p-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  style={activeTab === tab.id ? {
                    backgroundColor: 'var(--store-color)',
                    boxShadow: '0 10px 15px -3px var(--store-color-opacity-20)',
                  } : undefined}
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'compras' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Histórico de Compras</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {pagination?.totalItems || 0} ordens de serviço registradas
                </p>
              </div>
              <PurchasesTab
                orders={orders}
                loading={loadingOrders}
                pagination={pagination}
                onPageChange={handlePageChange}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
                navigate={navigate}
              />
            </div>
          )}
          {activeTab === 'receitas' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Receitas e Armações</h3>
                <p className="text-sm text-slate-500 mt-1">Fotos da armação e da receita médica vinculadas às OS</p>
              </div>
              <PrescriptionsTab
                clientId={Number(id)}
                hasCreate={hasPermission('client-prescriptions.create')}
                hasUpdate={hasPermission('client-prescriptions.update')}
                hasDelete={hasPermission('client-prescriptions.delete')}
              />
            </div>
          )}
          {canViewUncollected && activeTab === 'nao_retiradas' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Não retiradas</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Pendências registradas ao marcar OS como não retirada (valores preservados no histórico)
                </p>
              </div>
              <UncollectedTab records={uncollectedRecords} navigate={navigate} />
            </div>
          )}
          {/* Observações - comentado por enquanto
          {activeTab === 'observacoes' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Observações</h3>
                <p className="text-sm text-slate-500 mt-1">Anotações e observações sobre o cliente</p>
              </div>
              <NotesTab />
            </div>
          )}
          */}
        </div>
      </Card>
    </div>
  );
};
