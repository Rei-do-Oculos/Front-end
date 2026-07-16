import { validateInternationalPhone } from './phoneInternational';

/**
 * Utilitários de Segurança
 * 
 * IMPORTANTE: Nunca exponha informações sensíveis no front-end.
 * Todas as validações aqui são apenas para UX. A segurança real está no backend.
 */

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'string') {
        return sanitizeInput(item) as any;
      }
      if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item as Record<string, any>);
      }
      return item;
    }) as T;
  }

  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]) as any;
    }
  }
  
  return sanitized;
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const validateId = (id: string | undefined | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 100;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validatePhone = (phone: string): boolean => {
  return validateInternationalPhone(phone);
};

export const validateCpf = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};

export const validateStringLength = (str: string, min: number, max: number): boolean => {
  if (typeof str !== 'string') return false;
  return str.length >= min && str.length <= max;
};

export const validateNumberRange = (num: number, min: number, max: number): boolean => {
  if (typeof num !== 'number' || isNaN(num)) return false;
  return num >= min && num <= max;
};

export const isSafeInteger = (value: any): boolean => {
  return Number.isSafeInteger(value);
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
};

export const detectXssAttempt = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

export const validateRequestPayload = <T>(payload: T, schema: Record<string, (value: any) => boolean>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [key, validator] of Object.entries(schema)) {
    if (!(key in payload)) {
      errors.push(`Campo obrigatório ausente: ${key}`);
      continue;
    }
    
    if (!validator((payload as any)[key])) {
      errors.push(`Validação falhou para o campo: ${key}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
