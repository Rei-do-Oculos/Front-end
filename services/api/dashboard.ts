import { apiClient } from './client';

export interface DashboardCards {
  sales_today_user: number;
  clients_today: number;
  os_today: number;
  os_lab: number;
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
    data: DashboardCards;
  }>('/v1/dashboard/cards');

  if (!response.data.success || !response.data.data) {
    throw new Error('Erro ao buscar dados do dashboard');
  }

  return response.data.data;
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

  const raw = response.data.data;
  return {
    labels: toArray<string>(raw.labels),
    adimplencia: toArray<number>(raw.adimplencia),
    inadimplencia: toArray<number>(raw.inadimplencia),
    clientes: toArray<number>(raw.clientes),
    os: toArray<number>(raw.os),
  };
}
