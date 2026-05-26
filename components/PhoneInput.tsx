import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  PhoneCountry,
  getPhoneCountryByIso,
  maskNationalPhone,
} from '../utils/phoneCountries';
import {
  buildStoredPhone,
  digitsOnly,
  getNationalDigitsForCountry,
  parseStoredPhone,
  validateInternationalPhone,
} from '../utils/phoneInternational';

export interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string, countryIso: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const formatDisplay = (country: PhoneCountry, nationalDigits: string): string => {
  if (country.iso === 'BR') {
    return maskNationalPhone(country, nationalDigits);
  }
  return nationalDigits;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  required,
  error,
  disabled,
  className = '',
}) => {
  const userPickedCountry = useRef(false);
  const isInternalChange = useRef(false);
  const prevExternalValue = useRef(value);

  const [countryIso, setCountryIso] = useState(() => {
    if (!value) return DEFAULT_PHONE_COUNTRY.iso;
    return parseStoredPhone(value).country.iso;
  });

  const [nationalDigits, setNationalDigits] = useState(() => {
    if (!value) return '';
    const country = getPhoneCountryByIso(parseStoredPhone(value).country.iso);
    return getNationalDigitsForCountry(value, country);
  });

  // Sincroniza só quando o valor vem de fora (ex.: carregar cliente na edição)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      prevExternalValue.current = value;
      return;
    }

    if (value === prevExternalValue.current) return;
    prevExternalValue.current = value;

    if (!value) {
      if (!userPickedCountry.current) {
        setCountryIso(DEFAULT_PHONE_COUNTRY.iso);
      }
      setNationalDigits('');
      return;
    }

    const country = userPickedCountry.current
      ? getPhoneCountryByIso(countryIso)
      : parseStoredPhone(value).country;

    if (!userPickedCountry.current) {
      setCountryIso(country.iso);
    }

    setNationalDigits(getNationalDigitsForCountry(value, country));
  }, [value, countryIso]);

  const country = getPhoneCountryByIso(countryIso);

  const emitChange = (nextCountry: PhoneCountry, nextNationalDigits: string) => {
    isInternalChange.current = true;
    onChange(buildStoredPhone(nextCountry, nextNationalDigits), nextCountry.iso);
  };

  const handleCountryChange = (iso: string) => {
    userPickedCountry.current = true;
    const nextCountry = getPhoneCountryByIso(iso);
    setCountryIso(nextCountry.iso);

    const trimmed = nationalDigits.slice(0, nextCountry.nationalMaxLength);
    setNationalDigits(trimmed);
    emitChange(nextCountry, trimmed);
  };

  const handleNationalChange = (raw: string) => {
    const cleaned = digitsOnly(raw).slice(0, country.nationalMaxLength);
    setNationalDigits(cleaned);
    emitChange(country, cleaned);
  };

  const renderLabel = () => {
    if (!label) return null;
    if (label.includes('*')) {
      const parts = label.split('*');
      return (
        <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
          {parts[0]}
          <span className="text-red-500">*</span>
          {parts[1]}
        </label>
      );
    }
    return (
      <label className="text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
        {label}
      </label>
    );
  };

  return (
    <div className={`space-y-1.5 lg:space-y-2 w-full ${className}`}>
      {renderLabel()}
      <div className="flex gap-2">
        <select
          value={countryIso}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="w-[118px] sm:w-[132px] shrink-0 px-2 py-3 lg:py-3.5 rounded-lg border-2 border-slate-200 bg-gray-50 text-sm font-medium text-slate-900 outline-none transition-all focus:bg-white focus:border-[var(--store-color)] disabled:text-slate-800 disabled:bg-slate-50"
          aria-label="Código do país"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dialCode ? `+${c.dialCode}` : 'Outro'}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          value={formatDisplay(country, nationalDigits)}
          onChange={(e) => handleNationalChange(e.target.value)}
          placeholder={country.placeholder}
          required={required}
          disabled={disabled}
          className="flex-1 min-w-0 px-4 py-3 lg:px-5 lg:py-3.5 rounded-lg border-2 border-slate-200 bg-gray-50 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-gray-400 focus:bg-white focus:border-[var(--store-color)] focus:ring-2 focus:ring-[var(--store-color-opacity-20)] disabled:text-slate-800 disabled:bg-slate-50"
          style={error ? { borderColor: 'var(--store-color)' } : undefined}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}
    </div>
  );
};

export { validateInternationalPhone };
