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
  '/stores': ['stores.list', 'stores.read'],
  '/stores/create': ['stores.create'],
  '/stores/:id/edit': ['stores.update'],
  '/stores/:id': ['stores.read'],
  
  // Sistema - rotas públicas por padrão (mas podem ter permissões específicas)
  '/trash': [], // Público por enquanto
  
  // Lentes
  '/lenses': ['lenses.list', 'lenses.read'],
  '/lenses/create': ['lenses.create'],
  '/lenses/:id/edit': ['lenses.update'],
  '/lenses/:id': ['lenses.read'],
  
  // Outros módulos - por enquanto sem permissões específicas (públicos)
  // Quando as permissões forem criadas no backend, adicionar aqui
  '/pdv': [], // Público por enquanto
  '/vendedores': [], // Público por enquanto
  '/estoque': [], // Público por enquanto
  '/fornecedores': [], // Público por enquanto
  '/financeiro': [], // Público por enquanto
  '/pedidos': [], // Público por enquanto
  '/chat': [], // Público por enquanto
};

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
    console.log('[isSuperAdmin] ❌ Usuário não fornecido');
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
  
  console.log('[isSuperAdmin] Verificando roles:', {
    rolesCount: roles.length,
    roles: roles.map(r => ({ name: r?.name, id: r?.id })),
  });
  
  // Verificar se algum role tem o nome 'superadmin'
  const hasSuperAdminRole = roles.some(role => {
    // Tentar diferentes formas de acessar o nome do role
    const roleName = role?.name || (role as any)?.name || null;
    const isSuperAdmin = roleName?.toLowerCase() === 'superadmin';
    if (isSuperAdmin) {
      console.log(`[isSuperAdmin] ✅ Role superadmin encontrado: ${roleName}`);
    }
    return isSuperAdmin;
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
    'stores.list', 'stores.create', 'stores.read', 'stores.update', 'stores.delete',
    'audits.list', 'audits.read',
    'lenses.list', 'lenses.create', 'lenses.read', 'lenses.update', 'lenses.delete',
  ];
  
  // Obter todas as permissões do usuário
  const allUserPermissions = getAllUserPermissions(user);
  const userPermNames = allUserPermissions.map(p => p.name);
  
  console.log('[isSuperAdmin] Verificando permissões principais:', {
    mainPermissionsCount: mainPermissions.length,
    userPermissionsCount: userPermNames.length,
    userPermissions: userPermNames,
  });
  
  // Verificar se o usuário tem todas as permissões principais
  const hasAllMainPermissions = mainPermissions.every(perm => userPermNames.includes(perm));
  
  // Se tem todas as permissões principais, considerar como superadmin equivalente
  if (hasAllMainPermissions && mainPermissions.length > 0) {
    console.log('[isSuperAdmin] ✅ Usuário tem todas as permissões principais - considerado superadmin');
    return true;
  }
  
  // Se tem muitas permissões (mais de 80% das principais), também considerar como superadmin
  const hasMostPermissions = (userPermNames.length / mainPermissions.length) >= 0.8;
  if (hasMostPermissions && userPermNames.length >= 20) {
    console.log('[isSuperAdmin] ✅ Usuário tem mais de 80% das permissões principais - considerado superadmin');
    return true;
  }
  
  console.log('[isSuperAdmin] ❌ Usuário não é superadmin');
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
  // Superadmin tem acesso a tudo
  if (user && isSuperAdmin(user)) {
    console.log(`[hasRoutePermission] ✅ Superadmin - acesso liberado para: ${route}`);
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
  
  // Se não há mapeamento para a rota, permite acesso (rota pública)
  if (!requiredPermissions || requiredPermissions.length === 0) {
    console.log(`[hasRoutePermission] ✅ Rota pública - acesso liberado para: ${normalizedRoute} (original: ${route})`);
    return true; // Rotas sem mapeamento são públicas
  }

  // Se o usuário não tem permissões, nega acesso apenas para rotas que requerem permissão
  if (!userPermissions || userPermissions.length === 0) {
    console.log(`[hasRoutePermission] ❌ Usuário sem permissões - acesso negado para: ${normalizedRoute} (requer: ${requiredPermissions.join(', ')})`);
    return false; // Rotas com mapeamento requerem permissão
  }

  // Normalizar permissões do usuário para array de strings
  const userPermNames = userPermissions.map(perm => 
    typeof perm === 'string' ? perm : (perm.name || perm)
  );

  // Verificar se o usuário tem pelo menos uma das permissões necessárias
  const hasPermission = requiredPermissions.some(requiredPerm => 
    userPermNames.includes(requiredPerm)
  );

  console.log(`[hasRoutePermission] Verificando rota "${normalizedRoute}" (original: ${route}):`, {
    requiredPermissions,
    userPermNames,
    hasPermission,
  });

  return hasPermission;
}

/**
 * Obtém todas as permissões do usuário (incluindo as dos roles)
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

  // Debug: Log da estrutura do usuário
  console.log('[getAllUserPermissions] Estrutura do usuário:', {
    hasRoles: !!user.roles,
    rolesIsArray: Array.isArray(user.roles),
    rolesLength: Array.isArray(user.roles) ? user.roles.length : 0,
    hasPermissions: !!user.permissions,
    permissionsIsArray: Array.isArray(user.permissions),
    permissionsLength: Array.isArray(user.permissions) ? user.permissions.length : 0,
    hasAllPermissions: !!user.all_permissions,
    allPermissionsIsArray: Array.isArray(user.all_permissions),
    allPermissionsLength: Array.isArray(user.all_permissions) ? user.all_permissions.length : 0,
    userRoles: user.roles,
    userPermissions: user.permissions,
    userAllPermissions: user.all_permissions,
  });

  // PRIORIDADE 1: Se o backend forneceu all_permissions, usar isso (mais confiável)
  if (user.all_permissions && Array.isArray(user.all_permissions) && user.all_permissions.length > 0) {
    console.log('[getAllUserPermissions] ✅ Usando all_permissions do backend (método mais confiável)', {
      totalAllPermissions: user.all_permissions.length,
      allPermissions: user.all_permissions.map(p => p.name || p.slug),
    });
    user.all_permissions.forEach(perm => {
      const permName = perm.name || perm.slug;
      if (permName && !permissionNames.has(permName)) {
        permissionNames.add(permName);
        allPermissions.push({ name: permName });
        console.log(`[getAllUserPermissions] ✅ Adicionada permissão de all_permissions: ${permName}`);
      }
    });
  } else {
    console.warn('[getAllUserPermissions] ⚠️ all_permissions não disponível ou vazio, usando fallback (roles + diretas)');
    // FALLBACK: Adicionar permissões dos roles
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role, roleIndex) => {
        console.log(`[getAllUserPermissions] Processando role ${roleIndex}:`, {
          roleName: role.name || role.id,
          role,
          hasPermissions: !!role.permissions,
          permissionsIsArray: Array.isArray(role.permissions),
          permissionsLength: Array.isArray(role.permissions) ? role.permissions.length : 0,
          permissions: role.permissions,
        });

        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(perm => {
            // Usar name ou slug como identificador
            const permName = perm.name || perm.slug;
            if (permName && !permissionNames.has(permName)) {
              permissionNames.add(permName);
              allPermissions.push({ name: permName });
              console.log(`[getAllUserPermissions] ✅ Adicionada permissão do role "${role.name || role.id}": ${permName}`);
            }
          });
        } else {
          console.warn(`[getAllUserPermissions] ⚠️ Role "${role.name || role.id}" não tem permissões ou não está no formato esperado`);
        }
      });
    }

    // Adicionar permissões diretas do usuário
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach(perm => {
        // Usar name ou slug como identificador
        const permName = perm.name || perm.slug;
        if (permName && !permissionNames.has(permName)) {
          permissionNames.add(permName);
          allPermissions.push({ name: permName });
          console.log(`[getAllUserPermissions] ✅ Adicionada permissão direta: ${permName}`);
        }
      });
    }
  }

  console.log('[getAllUserPermissions] 📊 Resumo:', {
    totalPermissoes: allPermissions.length,
    permissoes: allPermissions.map(p => p.name),
    usandoAllPermissions: !!(user.all_permissions && Array.isArray(user.all_permissions) && user.all_permissions.length > 0),
  });

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
  userPermissions: Array<{ name: string } | string>,
  modulePrefix: string
): boolean {
  // Se não há permissões, retornar false imediatamente
  if (!userPermissions || userPermissions.length === 0) {
    console.log(`[hasAnyModulePermission] ❌ Nenhuma permissão fornecida para módulo "${modulePrefix}"`);
    return false;
  }

  // Normalizar permissões do usuário para array de strings
  const userPermNames = userPermissions.map(perm => {
    if (typeof perm === 'string') {
      return perm;
    }
    // Tentar name primeiro, depois slug, depois qualquer propriedade que possa ser string
    return perm.name || perm.slug || (typeof perm === 'object' && perm !== null ? String(perm) : '');
  }).filter(name => name && name.length > 0); // Remover strings vazias

  // Verificar se há pelo menos uma permissão que comece com o prefixo do módulo
  const matchingPermissions = userPermNames.filter(p => 
    p && typeof p === 'string' && p.startsWith(`${modulePrefix}.`)
  );
  
  const hasPermission = matchingPermissions.length > 0;

  console.log(`[hasAnyModulePermission] Verificando módulo "${modulePrefix}":`, {
    totalPermissions: userPermNames.length,
    userPermNames,
    hasPermission,
    matchingPermissions,
    modulePrefix,
    searchPattern: `${modulePrefix}.`,
  });

  return hasPermission;
}
