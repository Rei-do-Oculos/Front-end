/**
 * Utilitário para obter módulos/rotas do sistema
 */

export interface AppModule {
  id: string;
  name: string;
  route: string;
  description: string;
}

/**
 * Lista de módulos baseada nas rotas reais do App.tsx
 */
export const getAppModules = (): AppModule[] => {
  return [
    {
      id: 'dashboard',
      name: 'Dashboard',
      route: '/',
      description: 'Visão geral do sistema',
    },
    {
      id: 'pdv',
      name: 'PDV / Vendas',
      route: '/pdv',
      description: 'Ponto de venda e operações de caixa',
    },
    {
      id: 'stores',
      name: 'Lojas / Unidades',
      route: '/stores',
      description: 'Gerenciamento de unidades',
    },
    {
      id: 'clientes',
      name: 'Clientes',
      route: '/clients',
      description: 'Cadastro e gestão de clientes',
    },
    {
      id: 'estoque',
      name: 'Estoque',
      route: '/stock',
      description: 'Controle de produtos e armações',
    },
    {
      id: 'fornecedores',
      name: 'Fornecedores',
      route: '/suppliers',
      description: 'Parceiros e fornecedores',
    },
    {
      id: 'lentes',
      name: 'Lentes',
      route: '/lenses',
      description: 'Gestão de lentes e insumos',
    },
    {
      id: 'finance',
      name: 'Financeiro',
      route: '/finance',
      description: 'Fluxo de caixa e inadimplências',
    },
    {
      id: 'pedidos',
      name: 'Ordens de Serviço',
      route: '/orders',
      description: 'Gestão de OS e laboratório',
    },
    {
      id: 'audit',
      name: 'Auditoria',
      route: '/audit',
      description: 'Logs e rastreabilidade',
    },
    {
      id: 'permissions',
      name: 'Permissões',
      route: '/permissions',
      description: 'Gestão de acessos e perfis',
    },
  ];
};
