import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  PhoneCountry,
  getPhoneCountryByIso,
  maskNationalPhone,
} from './phoneCountries';

export interface ParsedPhone {
  country: PhoneCountry;
  nationalDigits: string;
  storedDigits: string;
}

const sortByDialCodeLength = (countries: PhoneCountry[]) =>
  [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);

const DIAL_CODE_COUNTRIES = sortByDialCodeLength(
  PHONE_COUNTRIES.filter((c) => c.dialCode !== '')
);

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/** Extrai só os dígitos nacionais usando o país fixo (sem redetectar DDI). */
export const getNationalDigitsForCountry = (stored: string | null | undefined, country: PhoneCountry): string => {
  const allDigits = digitsOnly(stored ?? '');
  if (!allDigits) return '';

  if (country.iso === 'OTHER') return allDigits.slice(0, country.nationalMaxLength);

  if (allDigits.startsWith(country.dialCode)) {
    return allDigits.slice(country.dialCode.length, country.dialCode.length + country.nationalMaxLength);
  }

  // Telefones BR antigos salvos sem prefixo 55
  if (country.iso === 'BR' && allDigits.length <= country.nationalMaxLength) {
    return allDigits;
  }

  return allDigits.slice(0, country.nationalMaxLength);
};

export const detectCountryFromDigits = (allDigits: string): { country: PhoneCountry; nationalDigits: string } => {
  if (!allDigits) {
    return { country: DEFAULT_PHONE_COUNTRY, nationalDigits: '' };
  }

  for (const country of DIAL_CODE_COUNTRIES) {
    if (allDigits.startsWith(country.dialCode)) {
      const nationalDigits = allDigits.slice(country.dialCode.length);
      if (
        nationalDigits.length >= country.nationalMinLength &&
        nationalDigits.length <= country.nationalMaxLength
      ) {
        return { country, nationalDigits };
      }
    }
  }

  // Compatibilidade: telefones BR antigos salvos só com DDD + número (10 ou 11 dígitos)
  if (allDigits.length === 10 || allDigits.length === 11) {
    return { country: DEFAULT_PHONE_COUNTRY, nationalDigits: allDigits };
  }

  return { country: getPhoneCountryByIso('OTHER'), nationalDigits: allDigits };
};

export const parseStoredPhone = (stored: string | null | undefined): ParsedPhone => {
  const allDigits = digitsOnly(stored ?? '');
  const { country, nationalDigits } = detectCountryFromDigits(allDigits);
  return {
    country,
    nationalDigits,
    storedDigits: allDigits,
  };
};

export const buildStoredPhone = (country: PhoneCountry, nationalDigits: string): string => {
  const cleaned = digitsOnly(nationalDigits).slice(0, country.nationalMaxLength);
  if (!cleaned) return '';
  if (country.iso === 'OTHER') return cleaned;
  return `${country.dialCode}${cleaned}`;
};

export const formatPhoneForDisplay = (stored: string | null | undefined): string => {
  if (!stored) return '';
  const parsed = parseStoredPhone(stored);
  if (!parsed.nationalDigits) return stored;

  const nationalFormatted = maskNationalPhone(parsed.country, parsed.nationalDigits);
  if (parsed.country.iso === 'OTHER') {
    return nationalFormatted;
  }
  return `+${parsed.country.dialCode} ${nationalFormatted}`.trim();
};

export const validateInternationalPhone = (
  stored: string | null | undefined,
  fixedCountryIso?: string
): boolean => {
  const country = fixedCountryIso ? getPhoneCountryByIso(fixedCountryIso) : parseStoredPhone(stored).country;
  const nationalDigits = fixedCountryIso
    ? getNationalDigitsForCountry(stored, country)
    : parseStoredPhone(stored).nationalDigits;

  if (!nationalDigits) return false;

  const len = nationalDigits.length;
  return len >= country.nationalMinLength && len <= country.nationalMaxLength;
};

export const formatPhoneSearchInput = (value: string): string => {
  const digits = digitsOnly(value);
  if (!digits) return '';

  const parsed = parseStoredPhone(digits);
  if (parsed.country.iso === 'OTHER') return digits;
  return maskNationalPhone(parsed.country, parsed.nationalDigits);
};
