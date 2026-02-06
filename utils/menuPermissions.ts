/**
 * Mapeamento de rotas para permissões necessárias
 * Cada rota precisa de pelo menos uma permissão de "list" ou "read" para aparecer no menu
 * 
 * Nota: Se uma rota não estiver mapeada, ela será considerada pública (acessível a todos)
 * Rotas que não têm permissões específicas ainda podem aparecer no menu
 */
export const routePermissionMap: Record<string, string[]> = {
  // Dashboard - público (sem permissão específica)
  // '/': [], // Dashboard é público
  
  // Clientes - usa permissões existentes
  '/clients': ['clients.list', 'clients.read'],
  '/clients/create': ['clients.create'],
  '/clients/:id/edit': ['clients.update'],
  '/clients/:id': ['clients.read'],
  
  // Permissões e Perfis - usa permissões existentes
  '/permissions': ['roles.list', 'permissions.list'],
  '/users': ['users.list', 'users.read'],
  '/users/create': ['users.create'],
  '/users/:id/edit': ['users.update'],
  '/audit': ['audits.list', 'audits.read'],
  
  // Lojas
  '/stores': ['stores.list'],
  '/stores/create': ['stores.create'],
  '/stores/:id/edit': ['stores.update'],
  
  // Sistema - rotas públicas por padrão (mas podem ter permissões específicas)
  '/trash': ['trash.list'],
  
  // Lentes
  '/lenses': ['lenses.list', 'lenses.read'],
  '/lenses/create': ['lenses.create'],
  '/lenses/:id/edit': ['lenses.update'],
  '/lenses/:id': ['lenses.read'],
  
  // Tipos de Armação
  '/frame-types': ['frame-types.list', 'frame-types.read'],
  '/frame-types/create': ['frame-types.create'],
  '/frame-types/:id/edit': ['frame-types.update'],
  
  // Armações
  '/frames': ['frames.list', 'frames.read'],
  '/frames/create': ['frames.create'],
  '/frames/:id/edit': ['frames.update'],
  
  // Transferências
  '/transferencias': ['store-frames.list', 'store-frames.read'],
  
  // Laboratórios
  '/laboratories': ['laboratories.list', 'laboratories.read'],
  '/laboratories/create': ['laboratories.create'],
  '/laboratories/:id/edit': ['laboratories.update'],
  
  // Lentes de Laboratório
  '/laboratory-lenses': ['laboratory-lenses.list', 'laboratory-lenses.read'],
  '/laboratory-lenses/create': ['laboratory-lenses.create'],
  '/laboratory-lenses/:id/edit': ['laboratory-lenses.update'],
  
  // Outros módulos - por enquanto sem permissões específicas (públicos)
  // Quando as permissões forem criadas no backend, adicionar aqui
  '/pdv': [], // Público por enquanto
  '/vendedores': [], // Público por enquanto
  '/estoque': [], // Público por enquanto
  '/fornecedores': [], // Público por enquanto
  '/finance': [], // Público por enquanto
  '/pedidos': [], // Público por enquanto
  '/chat': [], // Público por enquanto
};

/**
 * Verifica se o usuário tem APENAS o role 'superadmin' (não Admin nem equivalência por permissões).
 * Use para regras que exigem exclusivamente o role superadmin.
 */
export function hasSuperAdminRole(user: {
  roles?: Array<{ name?: string }> | any[];
} | null | undefined): boolean {
  if (!user?.roles) return false;
  const roles = Array.isArray(user.roles) ? user.roles : Object.values(user.roles || {});
  return roles.some((role: any) => (role?.name || '').toLowerCase() === 'superadmin');
}

/**
 * Verifica se o usuário é superadmin OU tem acesso equivalente (todas as permissões principais)
 * 
 * @param user Usuário com roles e permissions
 * @returns true se o usuário é superadmin ou tem acesso equivalente, false caso contrário
 */
export function isSuperAdmin(user: {
  roles?: Array<{ name?: string; id?: number; permissions?: Array<{ name: string }> }> | any[];
  permissions?: Array<{ name: string }>;
  id?: number;
  email?: string;
}): boolean {
  if (!user) {
    return false;
  }

  // Garantir que roles seja um array
  let roles: any[] = [];
  
  if (Array.isArray(user.roles)) {
    roles = user.roles;
  } else if (user.roles && typeof user.roles === 'object') {
    // Se for um objeto, tentar converter para array
    roles = Object.values(user.roles);
  }
  
  // Verificar se algum role tem o nome 'superadmin'
  const hasSuperAdminRole = roles.some(role => {
    const roleName = role?.name || (role as any)?.name || null;
    return roleName?.toLowerCase() === 'superadmin';
  });
  
  if (hasSuperAdminRole) {
    return true;
  }
  
  // Se não tem role superadmin, verificar se tem todas as permissões principais
  // Lista de permissões principais que indicam acesso total
  const mainPermissions = [
    'users.list', 'users.create', 'users.read', 'users.update', 'users.delete',
    'roles.list', 'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    'permissions.list', 'permissions.create', 'permissions.read', 'permissions.update', 'permissions.delete',
    'clients.list', 'clients.create', 'clients.read', 'clients.update', 'clients.delete',
    'stores.list', 'stores.create', 'stores.update', 'stores.delete',
    'audits.list', 'audits.read',
    'lenses.list', 'lenses.create', 'lenses.read', 'lenses.update', 'lenses.delete',
    'laboratories.list', 'laboratories.create', 'laboratories.read', 'laboratories.update', 'laboratories.delete',
    'trash.list', 'trash.restore',
  ];
  
  // Obter todas as permissões do usuário
  const allUserPermissions = getAllUserPermissions(user);
  const userPermNames = allUserPermissions.map(p => p.name);

  // Verificar se o usuário tem TODAS as permissões principais (não apenas um percentual)
  const hasAllMainPermissions = mainPermissions.every(perm => userPermNames.includes(perm));
  if (hasAllMainPermissions && mainPermissions.length > 0) {
    return true;
  }

  // NÃO usar verificação de percentual - era muito permissiva e causava bugs
  // Um usuário só é considerado superadmin se:
  // 1. Tem o role 'superadmin' explicitamente
  // 2. Tem TODAS as permissões principais listadas acima

  return false;
}

/**
 * Verifica se o usuário tem permissão para acessar uma rota
 * 
 * @param userPermissions Array de permissões do usuário (pode vir de roles ou diretas)
 * @param route Rota a verificar
 * @param user Usuário completo (para verificar se é superadmin)
 * @returns true se o usuário tem permissão, false caso contrário
 */
export function hasRoutePermission(
  userPermissions: Array<{ name: string } | string>,
  route: string,
  user?: { roles?: Array<{ name: string }> }
): boolean {
  if (user && isSuperAdmin(user)) {
    return true;
  }

  // Normalizar a rota (remover hash se presente, garantir que comece com /)
  let normalizedRoute = route;
  if (normalizedRoute.startsWith('#')) {
    normalizedRoute = normalizedRoute.substring(1);
  }
  if (!normalizedRoute.startsWith('/')) {
    normalizedRoute = '/' + normalizedRoute;
  }

  // Tentar match exato primeiro
  let requiredPermissions = routePermissionMap[normalizedRoute];
  
  // Se não encontrou match exato, tentar match com padrões dinâmicos
  if (!requiredPermissions || requiredPermissions.length === 0) {
      // Procurar por padrões que correspondam (ex: /clients/123/edit -> /clients/:id/edit)
      for (const [pattern, perms] of Object.entries(routePermissionMap)) {
        // Converter padrão para regex (ex: /clients/:id/edit -> /clients/\d+/edit)
      const regexPattern = pattern
        .replace(/:[^/]+/g, '\\d+') // Substituir :id, :param por \d+
        .replace(/\//g, '\\/'); // Escapar barras
      
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(normalizedRoute)) {
        requiredPermissions = perms;
        break;
      }
    }
  }
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Normalizar permissões do usuário para array de strings
  const userPermNames = userPermissions.map(perm => 
    typeof perm === 'string' ? perm : (perm.name || perm)
  );

  return requiredPermissions.some(requiredPerm => userPermNames.includes(requiredPerm));
}

/**
 * Obtém as permissões efetivas do usuário (fonte de verdade do backend).
 * Usar esta função para menu e proteção de rotas, pois reflete exatamente
 * o que o backend considera (inclui bloqueios por perfil).
 *
 * @param user Usuário com all_permissions (enviado por /me e login)
 * @returns Array com as permissões efetivas; [] se all_permissions não existir
 */
export function getEffectiveUserPermissions(user: {
  all_permissions?: Array<{ name: string; slug?: string }>;
  roles?: Array<{ permissions?: Array<{ name: string; slug?: string }> }>;
  permissions?: Array<{ name: string; slug?: string }>;
}): Array<{ name: string }> {
  // Tentar usar all_permissions primeiro
  if (user.all_permissions && Array.isArray(user.all_permissions) && user.all_permissions.length > 0) {
    const out: Array<{ name: string }> = [];
    const seen = new Set<string>();
    user.all_permissions.forEach(perm => {
      const name = perm.name || perm.slug;
      if (name && !seen.has(name)) {
        seen.add(name);
        out.push({ name });
      }
    });
    return out;
  }
  
  // Fallback: usar getAllUserPermissions (roles + permissions diretas)
  return getAllUserPermissions(user);
}

/**
 * Obtém todas as permissões do usuário (incluindo as dos roles)
 * Preferência: all_permissions (backend) > roles[].permissions + user.permissions
 *
 * @param user Usuário com roles e permissions
 * @returns Array com todas as permissões (do role + diretas)
 */
export function getAllUserPermissions(user: {
  roles?: Array<{ permissions?: Array<{ name: string; slug?: string }> }>;
  permissions?: Array<{ name: string; slug?: string }>;
  all_permissions?: Array<{ name: string; slug?: string }>;
}): Array<{ name: string }> {
  const allPermissions: Array<{ name: string }> = [];
  const permissionNames = new Set<string>();

  if (user.all_permissions && Array.isArray(user.all_permissions) && user.all_permissions.length > 0) {
    user.all_permissions.forEach(perm => {
      const permName = perm.name || perm.slug;
      if (permName && !permissionNames.has(permName)) {
        permissionNames.add(permName);
        allPermissions.push({ name: permName });
      }
    });
  } else {
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(perm => {
            const permName = perm.name || perm.slug;
            if (permName && !permissionNames.has(permName)) {
              permissionNames.add(permName);
              allPermissions.push({ name: permName });
            }
          });
        }
      });
    }
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach(perm => {
        const permName = perm.name || perm.slug;
        if (permName && !permissionNames.has(permName)) {
          permissionNames.add(permName);
          allPermissions.push({ name: permName });
        }
      });
    }
  }

  return allPermissions;
}

/**
 * Verifica se o usuário tem pelo menos uma permissão relacionada a um módulo específico
 * 
 * @param userPermissions Array de permissões do usuário
 * @param modulePrefix Prefixo do módulo (ex: 'clients', 'stores', 'lenses')
 * @returns true se o usuário tem pelo menos uma permissão do módulo, false caso contrário
 */
export function hasAnyModulePermission(
  userPermissions: Array<{ name: string; slug?: string } | string>,
  modulePrefix: string
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  const userPermNames = userPermissions.map(perm => {
    if (typeof perm === 'string') return perm;
    const p = perm as { name?: string; slug?: string };
    return p.name || p.slug || '';
  }).filter(name => name && name.length > 0);

  // Verificar se há pelo menos uma permissão que comece com o prefixo do módulo
  const matchingPermissions = userPermNames.filter(p => 
    p && typeof p === 'string' && p.startsWith(`${modulePrefix}.`)
  );
  
  return matchingPermissions.length > 0;
}
