import type { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCY_CODES: CurrencyCode[] = [
  'RUB',
  'USD',
  'EUR',
  'GBP',
  'TRY',
  'CNY',
  'JPY',
  'KZT',
  'AED',
  'GEL',
];

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  RUB: { code: 'RUB', label: 'Российский рубль', shortLabel: 'Рубль', locale: 'ru-RU', symbol: '₽', fractionDigits: 0, displayMode: 'narrowSymbol' },
  USD: { code: 'USD', label: 'Доллар США', shortLabel: 'Доллар', locale: 'en-US', symbol: '$', fractionDigits: 0, displayMode: 'narrowSymbol' },
  EUR: { code: 'EUR', label: 'Евро', shortLabel: 'Евро', locale: 'de-DE', symbol: '€', fractionDigits: 0, displayMode: 'narrowSymbol' },
  GBP: { code: 'GBP', label: 'Британский фунт', shortLabel: 'Фунт', locale: 'en-GB', symbol: '£', fractionDigits: 0, displayMode: 'narrowSymbol' },
  TRY: { code: 'TRY', label: 'Турецкая лира', shortLabel: 'Лира', locale: 'tr-TR', symbol: '₺', fractionDigits: 0, displayMode: 'narrowSymbol' },
  CNY: { code: 'CNY', label: 'Китайский юань', shortLabel: 'Юань', locale: 'zh-CN', symbol: '¥', fractionDigits: 0, displayMode: 'narrowSymbol' },
  JPY: { code: 'JPY', label: 'Японская иена', shortLabel: 'Иена', locale: 'ja-JP', symbol: '￥', fractionDigits: 0, displayMode: 'narrowSymbol' },
  KZT: { code: 'KZT', label: 'Казахстанский тенге', shortLabel: 'Тенге', locale: 'kk-KZ', symbol: '₸', fractionDigits: 0, displayMode: 'narrowSymbol' },
  AED: { code: 'AED', label: 'Дирхам ОАЭ', shortLabel: 'Дирхам', locale: 'en-AE', symbol: 'د.إ', fractionDigits: 0, displayMode: 'code' },
  GEL: { code: 'GEL', label: 'Грузинский лари', shortLabel: 'Лари', locale: 'ka-GE', symbol: '₾', fractionDigits: 0, displayMode: 'narrowSymbol' },
};

const currencyCodes = new Set<CurrencyCode>(CURRENCY_CODES);

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && currencyCodes.has(value as CurrencyCode);
}

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : 'RUB';
}

export function getCurrencyConfig(value: CurrencyCode): CurrencyConfig {
  return CURRENCY_CONFIG[normalizeCurrencyCode(value)];
}
