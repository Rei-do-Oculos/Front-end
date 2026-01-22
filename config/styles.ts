/**
 * Sistema de Design Centralizado
 * Alterar os valores aqui afeta todos os componentes do sistema
 */

export const borderRadius = {
  sm: 'rounded-md',      // 6px - Botões pequenos, badges
  md: 'rounded-lg',      // 8px - Botões padrão, cards pequenos
  lg: 'rounded-xl',      // 12px - Cards médios, inputs
  xl: 'rounded-2xl',     // 16px - Cards grandes, modais
  full: 'rounded-full',  // 100% - Avatares, badges circulares
} as const;

export const buttonRadius = borderRadius.md; // Botões padrão
export const cardRadius = borderRadius.md;    // Cards padrão
export const inputRadius = borderRadius.md;   // Inputs padrão
export const badgeRadius = borderRadius.full; // Badges (circular)

// Para uso em className do Tailwind
export const styles = {
  button: {
    default: buttonRadius,
    small: borderRadius.sm,
    large: borderRadius.lg,
  },
  card: {
    default: cardRadius,
    small: borderRadius.sm,
    large: borderRadius.lg,
    xlarge: borderRadius.xl,
  },
  input: {
    default: inputRadius,
    small: borderRadius.sm,
  },
  badge: {
    default: badgeRadius,
  },
} as const;
