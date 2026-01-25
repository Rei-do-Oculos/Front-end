import { BaseService, PaginatedResponse } from './base.service';
import { apiClient } from './client';

export interface Store {
  id: number;
  name: string;
  unity?: string | null;
  fancy_name: string;
  cnpj: string;
  ie?: string | null;
  is_uf?: string | null;
  logo?: string | null;
  color: string;
  cep: string;
  logradouro: string;
  complemento?: string | null;
  numero: string;
  bairro: string;
  cod_municipio: string;
  municipio: string;
  uf: string;
  cod_pais: number;
  pais: string;
  telefone?: string | null;
  email?: string | null;
  fax?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateStoreDto {
  name: string;
  unity?: string;
  fancy_name: string;
  cnpj: string;
  ie?: string;
  is_uf?: string;
  logo?: File | string | null;
  color: string;
  cep: string;
  logradouro: string;
  complemento?: string;
  numero: string;
  bairro: string;
  cod_municipio: string;
  municipio: string;
  uf: string;
  cod_pais?: number;
  pais?: string;
  telefone?: string;
  email?: string;
  fax?: string;
  active: boolean;
}

export interface UpdateStoreDto extends Partial<CreateStoreDto> {}

export interface StoresQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface LaravelPaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface StoresListResponse {
  success: boolean;
  action: string;
  data: {
    request: any;
    stores: LaravelPaginatedResponse<Store>;
  };
}

class StoresService extends BaseService<Store, CreateStoreDto, UpdateStoreDto, StoresQueryParams> {
  constructor() {
    super({ endpoint: '/v1/stores' });
  }

  async create(payload: CreateStoreDto): Promise<Store> {
    const formData = new FormData();
    
    // Adicionar todos os campos ao FormData
    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof CreateStoreDto];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'logo' && value instanceof File) {
          formData.append('logo', value);
        } else if (key === 'active') {
          formData.append(key, value ? '1' : '0');
        } else if (key === 'cod_pais' || key === 'cod_municipio') {
          // Garantir que códigos sejam strings
          formData.append(key, String(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const { data } = await apiClient.post<{ success: boolean; action: string; data: { store: Store } }>(`${this.endpoint}/create`, formData);

    if (!data.success || !data.data?.store) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.store;
  }

  async update(id: string, payload: UpdateStoreDto): Promise<Store> {
    const formData = new FormData();
    
    // Adicionar todos os campos ao FormData
    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof UpdateStoreDto];
      if (value !== undefined && value !== null) {
        if (key === 'logo' && value instanceof File) {
          formData.append('logo', value);
        } else if (key === 'active' && typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
        } else if (key === 'cod_pais') {
          // Garantir que código do país seja número
          formData.append(key, String(value));
        } else if (key === 'cod_municipio') {
          // Garantir que código do município seja string
          formData.append(key, String(value));
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Apenas adicionar strings não vazias
          formData.append(key, value);
        } else if (typeof value !== 'string') {
          // Adicionar outros tipos (number, boolean, etc)
          formData.append(key, String(value));
        }
      }
    });

    const { data } = await apiClient.put<{ success: boolean; action: string; data: { request?: any; store: Store } }>(`${this.endpoint}/${id}`, formData);

    if (!data.success || !data.data?.store) {
      throw new Error('Resposta inválida da API');
    }

    return data.data.store;
  }

  async getAll(params?: StoresQueryParams & { page?: number }): Promise<PaginatedResponse<Store>> {
    try {
      const response = await apiClient.get<StoresListResponse>(this.endpoint, {
        params,
      });
      
      const responseData = response.data;
      
      if (!responseData.success || !responseData.data?.stores) {
        // Se a rota não existir ainda, retorna array vazio
        return {
          data: [],
          meta: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
          },
        };
      }
      
      const laravelPagination = responseData.data.stores;
      
      // Converter data para array se for objeto (pode acontecer após sanitização)
      let storesData: Store[] = [];
      if (Array.isArray(laravelPagination.data)) {
        storesData = laravelPagination.data;
      } else if (laravelPagination.data && typeof laravelPagination.data === 'object') {
        storesData = Object.values(laravelPagination.data) as Store[];
      }
      
      return {
        data: storesData,
        meta: {
          currentPage: laravelPagination.current_page || 1,
          totalPages: laravelPagination.last_page || 1,
          totalItems: laravelPagination.total || 0,
        },
      };
    } catch (error: any) {
      // Se a rota não existir ainda (404), retorna array vazio
      if (error?.response?.status === 404) {
        return {
          data: [],
          meta: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
          },
        };
      }
      throw error;
    }
  }

  async getById(id: string): Promise<Store> {
    const { data } = await apiClient.get<{ success: boolean; action: string; data: { request?: any; store: any } }>(`${this.endpoint}/${id}`);
    
    if (!data.success || !data.data?.store) {
      throw new Error('Loja não encontrada');
    }

    const store = data.data.store;
    
    // Converter active de número para boolean se necessário
    if (typeof store.active === 'number') {
      store.active = store.active === 1;
    }

    return store as Store;
  }

  async plucks(): Promise<any[]> {
    try {
      console.log('[storesService.plucks] Fazendo requisição para:', `${this.endpoint}/plucks`);
      const response = await apiClient.get<{ success: boolean; data: { plucks: any[] } }>(`${this.endpoint}/plucks`);
      console.log('[storesService.plucks] Resposta completa:', response);
      console.log('[storesService.plucks] response.data:', response.data);
      console.log('[storesService.plucks] response.data.data:', response.data?.data);
      console.log('[storesService.plucks] response.data.data.plucks:', response.data?.data?.plucks);
      
      const { data } = response;
      
      if (!data.success) {
        console.error('[storesService.plucks] Resposta não teve sucesso:', data);
        return [];
      }
      
      if (!data.data) {
        console.error('[storesService.plucks] data.data não existe:', data);
        return [];
      }
      
      if (!data.data.plucks) {
        console.error('[storesService.plucks] data.data.plucks não existe:', data.data);
        return [];
      }
      
      // O backend pode retornar como objeto { 0: {...}, 1: {...} } em vez de array
      let plucks = data.data.plucks;
      
      // Se for objeto (não array), converter para array
      if (!Array.isArray(plucks) && typeof plucks === 'object' && plucks !== null) {
        console.log('[storesService.plucks] Convertendo objeto para array...');
        plucks = Object.values(plucks);
        console.log('[storesService.plucks] Convertido de objeto para array:', plucks.length);
      }
      
      // Garantir que seja um array
      if (!Array.isArray(plucks)) {
        console.error('[storesService.plucks] Não conseguiu converter para array:', plucks);
        return [];
      }
      
      console.log('[storesService.plucks] Plucks recebidos:', plucks.length, plucks);
      return plucks;
    } catch (error: any) {
      console.error('[storesService.plucks] Erro ao buscar plucks:', error);
      console.error('[storesService.plucks] Erro response:', error.response);
      console.error('[storesService.plucks] Erro status:', error.response?.status);
      console.error('[storesService.plucks] Erro data:', error.response?.data);
      return [];
    }
  }
}

export const storesService = new StoresService();
