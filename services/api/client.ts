import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { sanitizeObject, validateId, generateRequestId, detectXssAttempt } from '../../utils/security';

// Sempre usa VITE_API_URL. Em dev passa pelo proxy /api (evita CORS); em prod usa direto.
const API_BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? '');

class ApiClient {
  private client: AxiosInstance;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: false,
      // Serializar arrays como stores[]=1&stores[]=2 para compatibilidade com Laravel
      paramsSerializer: (params) => {
        if (!params || Object.keys(params).length === 0) {
          return '';
        }
        
        // Debug: log dos parâmetros antes de serializar
        if (process.env.NODE_ENV === 'development') {
          console.log('[apiClient] Parâmetros antes de serializar:', params);
        }
        
        const parts: string[] = [];
        
        Object.keys(params).forEach(key => {
          const value = params[key];
          if (Array.isArray(value)) {
            // Para arrays, usar formato stores[]=1&stores[]=2
            value.forEach(item => {
              if (item !== null && item !== undefined && item !== '') {
                parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
              }
            });
          } else if (value !== null && value !== undefined && value !== '') {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
          }
        });
        
        return parts.join('&');
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Debug: mostra URL completa de cada requisição
        const fullUrl = (config.baseURL || '') + (config.url || '');
        console.log('[apiClient] Requisição:', config.method?.toUpperCase(), fullUrl);

        const token = this.getAuthToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Contexto de loja para escopo multi-loja
        const storeId = localStorage.getItem('selectedStoreId');
        if (storeId) {
          config.headers['X-Store-ID'] = storeId;
        }

        config.headers['X-Request-ID'] = generateRequestId();

        // Não sanitiza FormData (usado para upload de arquivos)
        if (config.data && !(config.data instanceof FormData)) {
          const sanitized = this.sanitizeRequestData(config.data);
          
          if (this.detectSecurityThreats(sanitized)) {
            return Promise.reject(new Error('Dados inválidos detectados'));
          }
          
          config.data = sanitized;
        }
        
        // Se for FormData, remove Content-Type para o browser definir automaticamente com boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }

        if (config.params) {
          config.params = this.sanitizeQueryParams(config.params);
        }

        // Não sanitiza URL para rotas de autenticação
        if (config.url && !config.url.includes('/auth/')) {
          config.url = this.sanitizeUrl(config.url);
        }

        return config;
      },
      (error) => {
        this.logSecurityEvent('request_error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        if (response.data) {
          response.data = this.sanitizeResponseData(response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status;
        const config = error.config as InternalAxiosRequestConfig & { __retryCount?: number };

        // Não trata 401 em rotas de auth (login retorna 401 para credenciais inválidas; me/logout são tratadas pelo AuthContext)
        if (status === 401 && !config?.url?.includes('/auth/')) {
          this.handleUnauthorized();
          return Promise.reject(error);
        }

        if (status === 403) {
          this.logSecurityEvent('forbidden_access', { url: config?.url });
          
          // Extrair mensagem de erro da resposta se disponível
          const errorMessage = error.response?.data?.data?.errors?.message 
            || error.response?.data?.message 
            || 'Você não tem permissão para realizar esta ação.';
          
          const customError = new Error(errorMessage);
          (customError as any).status = 403;
          (customError as any).response = error.response;
          
          return Promise.reject(customError);
        }

        if (status === 429) {
          this.logSecurityEvent('rate_limit', { url: config?.url });
          return Promise.reject(new Error('Muitas requisições. Tente novamente mais tarde.'));
        }

        if (status && status >= 500 && config && (!config.__retryCount || config.__retryCount < this.maxRetries)) {
          config.__retryCount = (config.__retryCount || 0) + 1;
          
          await this.delay(this.retryDelay * config.__retryCount);
          
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('authToken');
    } catch {
      return null;
    }
  }

  private sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return sanitizeObject({ value: data }).value;
    }
    
    if (typeof data === 'object' && data !== null) {
      return sanitizeObject(data);
    }
    
    return data;
  }

  private sanitizeResponseData(data: any): any {
    if (typeof data === 'string') {
      return sanitizeObject({ value: data }).value;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      return sanitizeObject(data);
    }
    
    return data;
  }

  private sanitizeQueryParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeObject({ value }).value;
      } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    // Não valida IDs para rotas de autenticação
    if (url.includes('/auth/')) {
      return url;
    }
    
    const parts = url.split('?');
    const path = parts[0];
    const lastSegment = path.split('/').pop() || '';
    
    // Valida ID apenas se o último segmento for numérico
    if (lastSegment && !isNaN(Number(lastSegment))) {
      if (!validateId(lastSegment)) {
        this.logSecurityEvent('invalid_url', { url });
        throw new Error('URL inválida');
      }
    }
    
    return url;
  }

  private detectSecurityThreats(data: any): boolean {
    if (typeof data === 'string') {
      return detectXssAttempt(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      for (const value of Object.values(data)) {
        if (this.detectSecurityThreats(value)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private handleUnauthorized(): void {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
      sessionStorage.clear();
      
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 100);
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }
  }

  private logSecurityEvent(event: string, data?: Record<string, any>): void {
    if (import.meta.env.DEV) {
      console.warn(`[Security Event] ${event}`, data);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get<T>(url: string, config?: any) {
    // Não valida ID para listagens (quando há query params) ou rotas especiais
    const lastSegment = url.split('/').filter(s => s).pop() || '';
    const hasQueryParams = config?.params && Object.keys(config.params).length > 0;
    const segments = url.split('/').filter(s => s);
    
    // Não valida para rotas especiais, listagens ou quando há query params
    if (hasQueryParams || 
        lastSegment === 'me' || 
        lastSegment === 'login' || 
        lastSegment === 'logout' || 
        lastSegment === 'plucks' || 
        lastSegment === 'audits' ||
        lastSegment === 'roles' ||
        lastSegment === 'permissions' ||
        lastSegment === 'users' ||
        url.endsWith('/') ||
        segments.length <= 2) {
      return this.client.get<T>(url, config);
    }
    
    // Valida ID apenas se o último segmento for um número
    if (lastSegment && !isNaN(Number(lastSegment))) {
      if (!validateId(lastSegment)) {
        return Promise.reject(new Error('ID inválido'));
      }
    }
    
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    if (!validateId(url.split('/').pop() || '')) {
      return Promise.reject(new Error('ID inválido'));
    }
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    if (!validateId(url.split('/').pop() || '')) {
      return Promise.reject(new Error('ID inválido'));
    }
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
