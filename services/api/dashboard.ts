import { apiClient } from './client';

export interface DashboardCards {
  sales_today_store: number;
  /** Legado (API antiga); mantido só para compatibilidade ao normalizar resposta */
  sales_today_user?: number;
  clients_today: number;
  os_today: number;
  os_lab: number;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export interface DashboardCharts {
  labels: string[];
  adimplencia: number[];
  inadimplencia: number[];
  clientes: number[];
  os: number[];
}

export async function getDashboardCards(): Promise<DashboardCards> {
  const response = await apiClient.get<{
    success: boolean;
    data: Partial<DashboardCards> & { sales_today_user?: number };
  }>('/v1/dashboard/cards');

  if (!response.data.success || !response.data.data) {
    throw new Error('Erro ao buscar dados do dashboard');
  }

  const raw = response.data.data;
  // Compat: backend novo manda sales_today_store; versões antigas mandavam sales_today_user
  const sales = toFiniteNumber(
    raw.sales_today_store ?? raw.sales_today_user,
    0
  );

  return {
    sales_today_store: sales,
    clients_today: toFiniteNumber(raw.clients_today, 0),
    os_today: toFiniteNumber(raw.os_today, 0),
    os_lab: toFiniteNumber(raw.os_lab, 0),
  };
}

function toArray<T>(value: T[] | Record<string, T> | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value) as T[];
  return [];
}

export async function getDashboardCharts(): Promise<DashboardCharts> {
  const response = await apiClient.get<{
    success: boolean;
    data: DashboardCharts | Record<string, unknown>;
  }>('/v1/dashboard/charts');

  if (!response.data.success || !response.data.data) {
    throw new Error('Erro ao buscar gráficos do dashboard');
  }

  const raw = response.data.data as Record<string, unknown>;
  return {
    labels: toArray<string>(
      raw.labels as string[] | Record<string, string> | null | undefined
    ),
    adimplencia: toArray<number>(
      raw.adimplencia as number[] | Record<string, number> | null | undefined
    ),
    inadimplencia: toArray<number>(
      raw.inadimplencia as number[] | Record<string, number> | null | undefined
    ),
    clientes: toArray<number>(
      raw.clientes as number[] | Record<string, number> | null | undefined
    ),
    os: toArray<number>(raw.os as number[] | Record<string, number> | null | undefined),
  };
}
