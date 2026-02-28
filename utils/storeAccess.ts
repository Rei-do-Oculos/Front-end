/**
 * Utilitário para verificar se o usuário tem acesso à loja.
 * Usado para validar geração de NF-e (só permite se a loja da OS está vinculada ao usuário).
 */

export function userHasAccessToStore(
  storeId: number | string | null | undefined,
  user: {
    roles?: Array<{ name?: string }> | any[];
    stores?: Array<{ id: number | string }>;
  } | null | undefined
): boolean {
  if (!storeId || storeId === '' || storeId === 0) return false;
  if (!user) return false;

  const storeIdNum = Number(storeId);

  // Superadmin tem acesso a todas as lojas
  const roles = Array.isArray(user.roles) ? user.roles : (user.roles && typeof user.roles === 'object' ? Object.values(user.roles) : []);
  if (roles.some((r: any) => (r?.name || r)?.toLowerCase?.() === 'superadmin')) {
    return true;
  }

  // Verificar se a loja está vinculada ao usuário
  const stores = Array.isArray(user.stores)
    ? user.stores
    : user.stores && typeof user.stores === 'object'
      ? Object.values(user.stores)
      : [];

  return stores.some((s: any) => s && Number(s?.id) === storeIdNum);
}
