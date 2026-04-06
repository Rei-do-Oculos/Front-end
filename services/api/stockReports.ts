import { apiClient } from './client';

export interface FrameSoldItem {
  /** Null quando a linha vem só do código em texto na OS (sem cadastro em service_order_frame). */
  pivot_id: number | null;
  service_order_id: number;
  /** Null quando a linha vem só do código em texto na OS. */
  frame_id: number | null;
  os_number: number;
  completed_at: string;
  store_id: number;
  user_id?: number;
  frame_code: string;
  frame_description: string;
  frame_gender: string;
  frame_type_name: string | null;
  store_name: string | null;
  store_unity?: string | null;
  seller_name: string | null;
}

export interface FramesSoldListResponse {
  success: boolean;
  action: string;
  data: {
    frames_sold: FrameSoldItem[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      total_qty: number;
    };
  };
}

export interface FramesSoldExportResponse {
  success: boolean;
  action: string;
  data: {
    items: FrameSoldItem[];
    total_qty: number;
  };
}

export interface FramesSoldQueryParams {
  page?: number;
  per_page?: number;
  code?: string;
  description?: string;
  frame_type_id?: number[] | string;
  store_id?: number[] | string;
  gender?: string[] | string;
  date_from?: string;
  date_to?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

class StockReportsService {
  protected endpoint = '/v1/stock-reports';

  async listFramesSold(params?: FramesSoldQueryParams): Promise<{
    data: FrameSoldItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      perPage: number;
      totalItems: number;
      totalQty: number;
    };
  }> {
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.page) queryParams.page = params.page;
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.code) queryParams.code = params.code;
      if (params.description) queryParams.description = params.description;
      if (params.date_from) queryParams.date_from = params.date_from;
      if (params.date_to) queryParams.date_to = params.date_to;
      if (params.order_by) queryParams.order_by = params.order_by;
      if (params.order_dir) queryParams.order_dir = params.order_dir;
      if (params.frame_type_id) {
        queryParams.frame_type_id = Array.isArray(params.frame_type_id)
          ? params.frame_type_id.join(',')
          : params.frame_type_id;
      }
      if (params.store_id) {
        queryParams.store_id = Array.isArray(params.store_id)
          ? params.store_id.join(',')
          : params.store_id;
      }
      if (params.gender) {
        queryParams.gender = Array.isArray(params.gender)
          ? params.gender.join(',')
          : params.gender;
      }
    }

    const response = await apiClient.get<FramesSoldListResponse>(
      `${this.endpoint}/frames-sold`,
      { params: queryParams }
    );

    const d = response.data?.data;
    if (!response.data?.success || !d) {
      throw new Error('Resposta inválida da API');
    }

    // frames_sold pode vir como array ou objeto indexado (Laravel)
    let items = d.frames_sold;
    if (!Array.isArray(items)) {
      items = items && typeof items === 'object' ? Object.values(items) : [];
    }
    const pag = d.pagination || {};

    return {
      data: items,
      pagination: {
        currentPage: pag.current_page ?? 1,
        totalPages: pag.last_page ?? 1,
        perPage: pag.per_page ?? 15,
        totalItems: pag.total ?? 0,
        totalQty: pag.total_qty ?? 0,
      },
    };
  }

  async exportFramesSold(params?: Omit<FramesSoldQueryParams, 'page' | 'per_page'>): Promise<{
    items: FrameSoldItem[];
    total_qty: number;
  }> {
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.code) queryParams.code = params.code;
      if (params.description) queryParams.description = params.description;
      if (params.date_from) queryParams.date_from = params.date_from;
      if (params.date_to) queryParams.date_to = params.date_to;
      if (params.order_by) queryParams.order_by = params.order_by;
      if (params.order_dir) queryParams.order_dir = params.order_dir;
      if (params.frame_type_id) {
        queryParams.frame_type_id = Array.isArray(params.frame_type_id)
          ? params.frame_type_id.join(',')
          : params.frame_type_id;
      }
      if (params.store_id) {
        queryParams.store_id = Array.isArray(params.store_id)
          ? params.store_id.join(',')
          : params.store_id;
      }
      if (params.gender) {
        queryParams.gender = Array.isArray(params.gender)
          ? params.gender.join(',')
          : params.gender;
      }
    }

    const response = await apiClient.get<FramesSoldExportResponse>(
      `${this.endpoint}/frames-sold/export`,
      { params: queryParams }
    );

    const d = response.data?.data;
    if (!response.data?.success || !d) {
      throw new Error('Erro ao exportar');
    }

    // items pode vir como array ou objeto indexado (Laravel)
    let items = d.items;
    if (!Array.isArray(items)) {
      items = items && typeof items === 'object' ? Object.values(items) : [];
    }
    return {
      items,
      total_qty: d.total_qty ?? 0,
    };
  }
}

export const stockReportsService = new StockReportsService();
