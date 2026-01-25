import { useState, useEffect } from 'react';

/**
 * Hook para calcular quantidade de filtros ativos
 * Aceita um objeto com os valores dos filtros
 */
export const useActiveFilters = (filters: Record<string, any>): number => {
  const [activeFilters, setActiveFilters] = useState<number>(0);

  useEffect(() => {
    let count = 0;
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      // Se for array, verificar se tem itens (e não incluir 'all')
      if (Array.isArray(value)) {
        if (value.length > 0 && !value.includes('all')) {
          count++;
        }
      }
      // Se for string, verificar se não está vazia
      else if (typeof value === 'string') {
        if (value.trim() !== '') {
          count++;
        }
      }
      // Se for número, verificar se é maior que 0
      else if (typeof value === 'number') {
        if (value > 0) {
          count++;
        }
      }
      // Se for boolean, verificar se é true
      else if (typeof value === 'boolean') {
        if (value) {
          count++;
        }
      }
    });
    
    setActiveFilters(count);
  }, [filters]);

  return activeFilters;
};
