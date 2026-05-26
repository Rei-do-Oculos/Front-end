import { formatPhoneForDisplay } from './phoneInternational';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Converte texto digitado em valor numérico (moeda BRL).
 * Aceita formato BR ("50,00", "1.234,56") e ponto como decimal ("50.00", "1234.56").
 * Evita que "50.00" vire 5000 ao remover pontos como se fossem milhar.
 */
export function parseMoneyBrInput(value: string): number {
  if (!value) return 0;
  const s = value.trim();
  if (s.includes(',')) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
  }
  const parts = s.split('.');
  if (parts.length === 1) {
    return parseFloat(parts[0]) || 0;
  }
  if (parts.length === 2) {
    const dec = parts[1];
    if (dec.length <= 2) {
      return parseFloat(`${parts[0]}.${dec}`) || 0;
    }
    if (dec.length === 3 && /^\d+$/.test(parts[0]) && /^\d{3}$/.test(dec)) {
      return parseFloat(parts[0] + dec) || 0;
    }
  }
  return parseFloat(s.replace(/\./g, '')) || 0;
}

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/** Máscara de CPF para input (formata enquanto digita): 000.000.000-00 */
export const maskCpfInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

export const formatPhone = (phone: string): string => {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return formatPhoneForDisplay(phone);
};

/** Máscara de telefone para input (formata enquanto digita) */
export const maskPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) {
    return cleaned ? `(${cleaned}` : '';
  }
  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

/** Máscara de CNPJ para input (formata enquanto digita): 00.000.000/0001-00 */
export const maskCnpjInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) {
    return cleaned;
  }
  if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  }
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  }
  if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};

export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return maskCnpjInput(cleaned);
};

/**
 * Palavras que permanecem em minúsculo no meio de nomes (exceto no início)
 */
const PT_LOWER_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma']);

/**
 * Normaliza texto para formato título (primeira letra maiúscula em cada palavra).
 * Evita nomes em MAIÚSCULAS. Palavras como "de", "da", "do" ficam minúsculas no meio.
 * Ex: "JOÃO DA SILVA" → "João da Silva"
 */
export const normalizeToTitleCase = (value: string): string => {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && PT_LOWER_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Normaliza e-mail para consistência de cadastro.
 * Remove espaços nas pontas e converte para minúsculo.
 */
export const normalizeEmail = (value: string): string => {
  if (!value || typeof value !== 'string') return value;
  return value.trim().toLowerCase();
};
