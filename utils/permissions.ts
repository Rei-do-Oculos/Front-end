/**
 * Utilitários para gerenciamento de permissões
 */

export interface ModuleRoute {
  id: string;
  name: string;
  route: string;
  description: string;
}

export type CRUDAction = 'create' | 'read' | 'update' | 'delete';

/**
 * Gera o slug de permissão para um módulo e ação CRUD
 * Ex: 'clientes' + 'create' -> 'clientes.create'
 */
export function generatePermissionSlug(moduleId: string, action: CRUDAction): string {
  // Normaliza o ID do módulo (remove barras, espaços, etc)
  const normalizedModule = moduleId
    .replace(/^\//, '') // Remove barra inicial
    .replace(/\//g, '.') // Substitui barras por pontos
    .toLowerCase()
    .trim();
  
  return `${normalizedModule}.${action}`;
}

/**
 * Gera o nome legível da permissão
 * Ex: 'clientes' + 'create' -> 'Clientes - Criar'
 */
export function generatePermissionName(moduleName: string, action: CRUDAction): string {
  const actionNames: Record<CRUDAction, string> = {
    create: 'Criar',
    read: 'Visualizar',
    update: 'Editar',
    delete: 'Excluir',
  };
  
  return `${moduleName} - ${actionNames[action]}`;
}

/**
 * Extrai o módulo e ação de um slug de permissão
 * Ex: 'clientes.create' -> { module: 'clientes', action: 'create' }
 */
export function parsePermissionSlug(slug: string): { module: string; action: CRUDAction } | null {
  const parts = slug.split('.');
  if (parts.length < 2) return null;
  
  const action = parts[parts.length - 1] as CRUDAction;
  const module = parts.slice(0, -1).join('.');
  
  if (!['create', 'read', 'update', 'delete'].includes(action)) {
    return null;
  }
  
  return { module, action };
}

/**
 * Mapeia módulos para seus IDs de rota
 */
export function getModuleIdFromRoute(route: string): string {
  return route.replace(/^\//, '').replace(/\//g, '-') || 'dashboard';
}
