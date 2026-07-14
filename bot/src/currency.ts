export type CurrencyCode =
  | 'RUB'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'TRY'
  | 'CNY'
  | 'JPY'
  | 'KZT'
  | 'AED'
  | 'GEL';

type CurrencyConfig = {
  code: CurrencyCode;
  locale: string;
  symbol: string;
  fractionDigits: number;
  displayMode: 'narrowSymbol' | 'symbol' | 'code';
};

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
  RUB: { code: 'RUB', locale: 'ru-RU', symbol: '₽', fractionDigits: 0, displayMode: 'narrowSymbol' },
  USD: { code: 'USD', locale: 'en-US', symbol: '$', fractionDigits: 0, displayMode: 'narrowSymbol' },
  EUR: { code: 'EUR', locale: 'de-DE', symbol: '€', fractionDigits: 0, displayMode: 'narrowSymbol' },
  GBP: { code: 'GBP', locale: 'en-GB', symbol: '£', fractionDigits: 0, displayMode: 'narrowSymbol' },
  TRY: { code: 'TRY', locale: 'tr-TR', symbol: '₺', fractionDigits: 0, displayMode: 'narrowSymbol' },
  CNY: { code: 'CNY', locale: 'zh-CN', symbol: '¥', fractionDigits: 0, displayMode: 'narrowSymbol' },
  JPY: { code: 'JPY', locale: 'ja-JP', symbol: '￥', fractionDigits: 0, displayMode: 'narrowSymbol' },
  KZT: { code: 'KZT', locale: 'kk-KZ', symbol: '₸', fractionDigits: 0, displayMode: 'narrowSymbol' },
  AED: { code: 'AED', locale: 'en-AE', symbol: 'د.إ', fractionDigits: 0, displayMode: 'code' },
  GEL: { code: 'GEL', locale: 'ka-GE', symbol: '₾', fractionDigits: 0, displayMode: 'narrowSymbol' },
};

const currencyCodes = new Set<CurrencyCode>(CURRENCY_CODES);
const bidiControlCharacters = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && currencyCodes.has(value as CurrencyCode);
}

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : 'RUB';
}

function getSafeAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  const roundedAmount = Math.round(amount);
  return roundedAmount === 0 ? 0 : roundedAmount;
}

function sanitizeFormattedValue(value: string): string {
  return value.replace(bidiControlCharacters, '');
}

function formatCurrencyValue(
  amount: number,
  currency: CurrencyCode | string | undefined,
  signDisplay: Intl.NumberFormatOptions['signDisplay'],
): string {
  const safeCurrency = normalizeCurrencyCode(currency);
  const config = CURRENCY_CONFIG[safeCurrency];

  return sanitizeFormattedValue(
    new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      currencyDisplay: config.displayMode,
      minimumFractionDigits: config.fractionDigits,
      maximumFractionDigits: config.fractionDigits,
      signDisplay,
    }).format(getSafeAmount(amount)),
  );
}

export function formatMoney(amount: number, currency: CurrencyCode | string | undefined): string {
  return formatCurrencyValue(amount, currency, 'auto');
}

export function formatSignedMoney(amount: number, currency: CurrencyCode | string | undefined): string {
  const safeAmount = getSafeAmount(amount);

  return formatCurrencyValue(safeAmount, currency, safeAmount === 0 ? 'auto' : 'always');
}
