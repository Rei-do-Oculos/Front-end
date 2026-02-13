/**
 * Sistema de tradução para rotas e permissões
 */

/**
 * Traduções para recursos (resources)
 */
const resourceTranslations: Record<string, string> = {
  'users': 'Usuários',
  'roles': 'Perfil',
  'permissions': 'Permissões',
  'clients': 'Clientes',
  'client-prescriptions': 'Receitas e Armações',
  'stores': 'Lojas',
  'lenses': 'Lentes',
  'audits': 'Auditorias',
  'trash': 'Lixeira',
  'orders': 'Pedidos',
  'suppliers': 'Fornecedores',
  'sellers': 'Vendedores',
  'stock': 'Estoque',
  'dashboard': 'Dashboard',
  'pdv': 'PDV',
  'finance': 'Financeiro',
  'expenses': 'Despesas',
  'frames': 'Armações',
  'frame-types': 'Tipos de Armação',
  'store-frames': 'Transferências',
  'laboratories': 'Laboratórios',
  'laboratory-lenses': 'Lentes de Laboratório',
  'service-orders': 'Ordens de Serviço',
  'service-orders-lab': 'OS Laboratório',
  'service-orders-overdue': 'Inadimplências',
};

/**
 * Traduções para ações (actions)
 */
const actionTranslations: Record<string, string> = {
  'create': 'Criar',
  'read': 'Visualizar',
  'update': 'Editar',
  'delete': 'Excluir',
  'list': 'Listar',
  'plucks': 'Listar Simplificado',
  'restore': 'Restaurar',
  'permissions.sync': 'Sincronizar Permissões',
  'login': 'Fazer Login',
  'logout': 'Fazer Logout',
  'me': 'Visualizar Perfil',
  'send': 'Enviar ao Lab',
  'arrived': 'Marcar Chegada',
  'completed': 'Marcar Retirada',
  'migrate': 'Migrar',
  'history': 'Histórico',
  'history-report': 'Relatório PDF',
  'dashboard': 'Dashboard',
  'revenue-by-store': 'Faturamento por Loja',
  'top-sellers': 'Ranking de Vendedores',
  'overdue-summary': 'Resumo de Inadimplências',
};

/**
 * Traduz o nome de uma permissão/rota para português
 * 
 * @param permissionName Nome da permissão no formato "resource.action" (ex: "users.create")
 * @returns Nome traduzido (ex: "Usuários - Criar")
 * 
 * @example
 * translatePermission('users.create') // "Usuários - Criar"
 * translatePermission('roles.plucks') // "Papéis - Listar Simplificado"
 * translatePermission('permissions.list') // "Permissões - Listar"
 */
export function translatePermission(permissionName: string): string {
  // Se já estiver traduzido ou não tiver o formato esperado, retorna como está
  if (!permissionName.includes('.')) {
    return permissionName;
  }

  const parts = permissionName.split('.');
  const resource = parts[0];
  const action = parts.slice(1).join('.'); // Pega tudo após o primeiro ponto (para casos como "permissions.sync")

  const translatedResource = resourceTranslations[resource] || resource;
  const translatedAction = actionTranslations[action] || action;

  return `${translatedResource} - ${translatedAction}`;
}

/**
 * Traduz apenas o recurso (resource)
 * 
 * @param resource Nome do recurso (ex: "users")
 * @returns Nome traduzido (ex: "Usuários")
 */
export function translateResource(resource: string): string {
  return resourceTranslations[resource] || resource;
}

/**
 * Traduz apenas a ação (action)
 * 
 * @param action Nome da ação (ex: "create")
 * @returns Nome traduzido (ex: "Criar")
 */
export function translateAction(action: string): string {
  return actionTranslations[action] || action;
}

/**
 * Traduz um array de permissões
 * 
 * @param permissions Array de nomes de permissões
 * @returns Array de objetos com nome original e traduzido
 */
export function translatePermissions(permissions: string[]): Array<{ original: string; translated: string }> {
  return permissions.map(permission => ({
    original: permission,
    translated: translatePermission(permission),
  }));
}

/**
 * Traduz um objeto de permissão (com id e name)
 * 
 * @param permission Objeto com id e name
 * @returns Objeto com name traduzido
 */
export function translatePermissionObject<T extends { id: number | string; name: string }>(
  permission: T
): T & { translatedName: string } {
  return {
    ...permission,
    translatedName: translatePermission(permission.name),
  };
}

/**
 * Traduz um array de objetos de permissão
 * 
 * @param permissions Array de objetos com id e name
 * @returns Array de objetos com name traduzido
 */
export function translatePermissionObjects<T extends { id: number | string; name: string }>(
  permissions: T[]
): Array<T & { translatedName: string }> {
  return permissions.map(permission => translatePermissionObject(permission));
}
