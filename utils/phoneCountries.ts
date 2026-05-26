export interface PhoneCountry {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
  nationalMinLength: number;
  nationalMaxLength: number;
  placeholder: string;
}

const brMask = (digits: string): string => {
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const usMask = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const genericMask = (digits: string): string => digits;

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'BR', name: 'Brasil', dialCode: '55', flag: '🇧🇷', nationalMinLength: 10, nationalMaxLength: 11, placeholder: '(00) 00000-0000' },
  { iso: 'AR', name: 'Argentina', dialCode: '54', flag: '🇦🇷', nationalMinLength: 10, nationalMaxLength: 11, placeholder: '11 2345-6789' },
  { iso: 'BO', name: 'Bolívia', dialCode: '591', flag: '🇧🇴', nationalMinLength: 8, nationalMaxLength: 8, placeholder: '71234567' },
  { iso: 'CL', name: 'Chile', dialCode: '56', flag: '🇨🇱', nationalMinLength: 9, nationalMaxLength: 9, placeholder: '9 1234 5678' },
  { iso: 'CO', name: 'Colômbia', dialCode: '57', flag: '🇨🇴', nationalMinLength: 10, nationalMaxLength: 10, placeholder: '300 1234567' },
  { iso: 'PY', name: 'Paraguai', dialCode: '595', flag: '🇵🇾', nationalMinLength: 9, nationalMaxLength: 9, placeholder: '981 123456' },
  { iso: 'PE', name: 'Peru', dialCode: '51', flag: '🇵🇪', nationalMinLength: 9, nationalMaxLength: 9, placeholder: '912 345 678' },
  { iso: 'UY', name: 'Uruguai', dialCode: '598', flag: '🇺🇾', nationalMinLength: 8, nationalMaxLength: 8, placeholder: '94 123 456' },
  { iso: 'VE', name: 'Venezuela', dialCode: '58', flag: '🇻🇪', nationalMinLength: 10, nationalMaxLength: 10, placeholder: '412 1234567' },
  { iso: 'US', name: 'Estados Unidos', dialCode: '1', flag: '🇺🇸', nationalMinLength: 10, nationalMaxLength: 10, placeholder: '(000) 000-0000' },
  { iso: 'CA', name: 'Canadá', dialCode: '1', flag: '🇨🇦', nationalMinLength: 10, nationalMaxLength: 10, placeholder: '(000) 000-0000' },
  { iso: 'PT', name: 'Portugal', dialCode: '351', flag: '🇵🇹', nationalMinLength: 9, nationalMaxLength: 9, placeholder: '912 345 678' },
  { iso: 'ES', name: 'Espanha', dialCode: '34', flag: '🇪🇸', nationalMinLength: 9, nationalMaxLength: 9, placeholder: '612 34 56 78' },
  { iso: 'FR', name: 'França', dialCode: '33', flag: '🇫🇷', nationalMinLength: 9, nationalMaxLength: 9, placeholder: '6 12 34 56 78' },
  { iso: 'DE', name: 'Alemanha', dialCode: '49', flag: '🇩🇪', nationalMinLength: 10, nationalMaxLength: 11, placeholder: '151 23456789' },
  { iso: 'IT', name: 'Itália', dialCode: '39', flag: '🇮🇹', nationalMinLength: 9, nationalMaxLength: 10, placeholder: '312 345 6789' },
  { iso: 'GB', name: 'Reino Unido', dialCode: '44', flag: '🇬🇧', nationalMinLength: 10, nationalMaxLength: 10, placeholder: '7400 123456' },
  { iso: 'JP', name: 'Japão', dialCode: '81', flag: '🇯🇵', nationalMinLength: 10, nationalMaxLength: 10, placeholder: '90 1234 5678' },
  { iso: 'CN', name: 'China', dialCode: '86', flag: '🇨🇳', nationalMinLength: 11, nationalMaxLength: 11, placeholder: '131 2345 6789' },
  { iso: 'OTHER', name: 'Outro país', dialCode: '', flag: '🌍', nationalMinLength: 6, nationalMaxLength: 15, placeholder: 'Número com DDI' },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export const getPhoneCountryByIso = (iso: string): PhoneCountry =>
  PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY;

export const maskNationalPhone = (country: PhoneCountry, digits: string): string => {
  const cleaned = digits.replace(/\D/g, '').slice(0, country.nationalMaxLength);
  if (country.iso === 'BR') return brMask(cleaned);
  if (country.iso === 'US' || country.iso === 'CA') return usMask(cleaned);
  return genericMask(cleaned);
};
