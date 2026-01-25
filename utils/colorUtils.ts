/**
 * Utilitários para trabalhar com cores do sistema
 */

/**
 * Converte uma cor HEX para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converte RGB para HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Escurece uma cor HEX
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return rgbToHex(Math.max(0, r), Math.max(0, g), Math.max(0, b));
}

/**
 * Clareia uma cor HEX
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);

  return rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
}

/**
 * Adiciona transparência a uma cor HEX
 */
export function addOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Gera variáveis CSS para uma cor do sistema
 */
export function generateColorVariables(baseColor: string): Record<string, string> {
  return {
    '--store-color': baseColor,
    '--store-color-light': lightenColor(baseColor, 90), // Para backgrounds claros
    '--store-color-lighter': lightenColor(baseColor, 95), // Para backgrounds muito claros
    '--store-color-dark': darkenColor(baseColor, 20), // Para hover states
    '--store-color-darker': darkenColor(baseColor, 30), // Para estados ativos
    '--store-color-opacity-5': addOpacity(baseColor, 0.05),
    '--store-color-opacity-10': addOpacity(baseColor, 0.1),
    '--store-color-opacity-20': addOpacity(baseColor, 0.2),
    '--store-color-opacity-50': addOpacity(baseColor, 0.5),
  };
}
