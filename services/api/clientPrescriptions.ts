import { apiClient } from './client';
import { PaginatedResponse } from './base.service';

export interface ClientPrescription {
  id: number;
  client_id: number;
  service_order_id: number | null;
  file_path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client?: { id: number; name: string };
  service_order?: {
    id: number;
    os_number: number;
    is_lab: boolean;
  };
}

export interface CreateClientPrescriptionDto {
  client_id: number;
  service_order_id?: number | null;
  description?: string | null;
  file: File;
}

export interface UpdateClientPrescriptionDto {
  client_id?: number;
  service_order_id?: number | null;
  description?: string | null;
  file?: File;
}

export interface ClientPrescriptionsQueryParams {
  page?: number;
  per_page?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  client_id?: number;
}

interface LaravelPaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
}

interface ClientPrescriptionsListResponse {
  success: boolean;
  data: {
    clientPrescriptions: LaravelPaginatedResponse<ClientPrescription>;
  };
}

interface ClientPrescriptionResponse {
  success: boolean;
  data: {
    clientPrescription: ClientPrescription;
  };
}

class ClientPrescriptionsService {
  protected endpoint = '/v1/client-prescriptions';

  async getAll(params?: ClientPrescriptionsQueryParams & { page?: number }): Promise<PaginatedResponse<ClientPrescription>> {
    const response = await apiClient.get<ClientPrescriptionsListResponse>(this.endpoint, { params: params ?? {} });
    const responseData = response.data;
    if (!responseData.success || !responseData.data?.clientPrescriptions) {
      throw new Error('Resposta inválida da API de receitas');
    }
    const pag = responseData.data.clientPrescriptions;
    const data: ClientPrescription[] = Array.isArray(pag.data) ? pag.data : (pag.data ? Object.values(pag.data) : []);
    return {
      data,
      meta: {
        currentPage: pag.current_page || 1,
        totalPages: pag.last_page || 1,
        totalItems: pag.total || 0,
      },
    };
  }

  async getById(id: string): Promise<ClientPrescription> {
    const { data } = await apiClient.get<ClientPrescriptionResponse>(`${this.endpoint}/${id}`);
    if (!data.success || !data.data?.clientPrescription) throw new Error('Receita não encontrada');
    return data.data.clientPrescription;
  }

  async create(payload: CreateClientPrescriptionDto): Promise<ClientPrescription> {
    const formData = new FormData();
    formData.append('client_id', String(payload.client_id));
    if (payload.service_order_id != null) {
      formData.append('service_order_id', String(payload.service_order_id));
    }
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('file', payload.file);

    const { data } = await apiClient.post<ClientPrescriptionResponse>(`${this.endpoint}/create`, formData);
    if (!data.success || !data.data?.clientPrescription) throw new Error('Erro ao criar receita');
    return data.data.clientPrescription;
  }

  async update(id: string, payload: UpdateClientPrescriptionDto): Promise<ClientPrescription> {
    const formData = new FormData();
    if (payload.client_id != null) formData.append('client_id', String(payload.client_id));
    if (payload.service_order_id !== undefined) {
      formData.append('service_order_id', payload.service_order_id == null ? '' : String(payload.service_order_id));
    }
    if (payload.description !== undefined) formData.append('description', payload.description ?? '');
    if (payload.file) formData.append('file', payload.file);

    const { data } = await apiClient.put<ClientPrescriptionResponse>(`${this.endpoint}/${id}`, formData);
    if (!data.success || !data.data?.clientPrescription) throw new Error('Erro ao atualizar receita');
    return data.data.clientPrescription;
  }

  async delete(id: string): Promise<void> {
    const { data } = await apiClient.delete<{ success: boolean }>(`${this.endpoint}/${id}`);
    if (!data.success) throw new Error('Erro ao excluir receita');
  }
}

export const clientPrescriptionsService = new ClientPrescriptionsService();
