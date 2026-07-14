import type { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCIES: readonly CurrencyConfig[] = [
  { code: 'RUB', label: 'Российский рубль', shortLabel: 'Рубль', locale: 'ru-RU', symbol: '₽', fractionDigits: 0 },
  { code: 'USD', label: 'Доллар США', shortLabel: 'Доллар', locale: 'en-US', symbol: '$', fractionDigits: 0 },
  { code: 'EUR', label: 'Евро', shortLabel: 'Евро', locale: 'de-DE', symbol: '€', fractionDigits: 0 },
  { code: 'GBP', label: 'Британский фунт', shortLabel: 'Фунт', locale: 'en-GB', symbol: '£', fractionDigits: 0 },
  { code: 'TRY', label: 'Турецкая лира', shortLabel: 'Лира', locale: 'tr-TR', symbol: '₺', fractionDigits: 0 },
  { code: 'CNY', label: 'Китайский юань', shortLabel: 'Юань', locale: 'zh-CN', symbol: '¥', fractionDigits: 0 },
  { code: 'JPY', label: 'Японская иена', shortLabel: 'Иена', locale: 'ja-JP', symbol: '¥', fractionDigits: 0 },
  { code: 'KZT', label: 'Казахстанский тенге', shortLabel: 'Тенге', locale: 'kk-KZ', symbol: '₸', fractionDigits: 0 },
  { code: 'AED', label: 'Дирхам ОАЭ', shortLabel: 'Дирхам', locale: 'ar-AE', symbol: 'د.إ', fractionDigits: 0 },
  { code: 'GEL', label: 'Грузинский лари', shortLabel: 'Лари', locale: 'ka-GE', symbol: '₾', fractionDigits: 0 },
] as const;

const currencyByCode = new Map<CurrencyCode, CurrencyConfig>(
  CURRENCIES.map((currency) => [currency.code, currency]),
);

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && currencyByCode.has(value as CurrencyCode);
}

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : 'RUB';
}

export function getCurrencyConfig(value: CurrencyCode): CurrencyConfig {
  return currencyByCode.get(value) ?? currencyByCode.get('RUB')!;
}
