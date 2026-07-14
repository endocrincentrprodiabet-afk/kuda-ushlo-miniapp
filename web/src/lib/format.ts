import { getCurrencyConfig, normalizeCurrencyCode } from './currency';
import type { CurrencyCode } from '../types';

export type MoneyFormatOptions = {
  notation?: Intl.NumberFormatOptions['notation'];
  compactDisplay?: Intl.NumberFormatOptions['compactDisplay'];
};

export type CompactMoneyFormatOptions = {
  showCurrency?: boolean;
};

const BIDI_CONTROL_CHARACTERS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

function getSafeAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  const roundedAmount = Math.round(amount);
  return roundedAmount === 0 ? 0 : roundedAmount;
}

function sanitizeFormattedValue(value: string): string {
  return value.replace(BIDI_CONTROL_CHARACTERS, '');
}

function createCurrencyOptions(
  currency: CurrencyCode,
  options: MoneyFormatOptions,
  signDisplay: Intl.NumberFormatOptions['signDisplay'] = 'auto',
): Intl.NumberFormatOptions {
  const config = getCurrencyConfig(currency);

  return {
    style: 'currency',
    currency: config.code,
    currencyDisplay: config.displayMode ?? 'narrowSymbol',
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
    notation: options.notation,
    compactDisplay: options.compactDisplay,
    signDisplay,
  };
}

function formatWithConfiguredSymbol(
  amount: number,
  currency: CurrencyCode,
  options: MoneyFormatOptions,
  signDisplay: Intl.NumberFormatOptions['signDisplay'],
): string {
  const config = getCurrencyConfig(currency);
  const parts = new Intl.NumberFormat(config.locale, {
    ...createCurrencyOptions(currency, options, signDisplay),
    currencyDisplay: 'code',
  }).formatToParts(amount);

  return sanitizeFormattedValue(
    parts
      .map((part) =>
        part.type === 'currency' && config.displayMode !== 'code' ? config.symbol : part.value,
      )
      .join(''),
  );
}

function formatCurrencyValue(
  amount: number,
  currency: CurrencyCode,
  options: MoneyFormatOptions,
  signDisplay: Intl.NumberFormatOptions['signDisplay'],
): string {
  const safeCurrency = normalizeCurrencyCode(currency);
  const safeAmount = getSafeAmount(amount);
  const config = getCurrencyConfig(safeCurrency);

  try {
    return sanitizeFormattedValue(
      new Intl.NumberFormat(
        config.locale,
        createCurrencyOptions(safeCurrency, options, signDisplay),
      ).format(safeAmount),
    );
  } catch {
    return formatWithConfiguredSymbol(safeAmount, safeCurrency, options, signDisplay);
  }
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  options: MoneyFormatOptions = {},
): string {
  return formatCurrencyValue(amount, currency, options, 'auto');
}

export function formatSignedMoney(amount: number, currency: CurrencyCode): string {
  const safeAmount = getSafeAmount(amount);

  return formatCurrencyValue(safeAmount, currency, {}, safeAmount === 0 ? 'auto' : 'always');
}

export function formatCompactMoney(
  amount: number,
  currency: CurrencyCode,
  options: CompactMoneyFormatOptions = {},
): string {
  const safeCurrency = normalizeCurrencyCode(currency);
  const safeAmount = getSafeAmount(amount);
  const config = getCurrencyConfig(safeCurrency);

  if (options.showCurrency !== false) {
    return formatMoney(safeAmount, safeCurrency, { notation: 'compact', compactDisplay: 'short' });
  }

  return sanitizeFormattedValue(
    new Intl.NumberFormat(config.locale, {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(safeAmount),
  );
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return getCurrencyConfig(normalizeCurrencyCode(currency)).symbol;
}

export function getCurrencyLabel(currency: CurrencyCode): string {
  return getCurrencyConfig(normalizeCurrencyCode(currency)).label;
}
