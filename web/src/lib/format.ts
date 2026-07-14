import { getCurrencyConfig, normalizeCurrencyCode } from './currency';
import type { CurrencyCode } from '../types';

export type MoneyFormatOptions = {
  notation?: Intl.NumberFormatOptions['notation'];
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
};

function getSafeAmount(amount: number): number {
  return Number.isFinite(amount) ? amount : 0;
}

function createCurrencyFormatter(
  currency: CurrencyCode,
  options: MoneyFormatOptions,
  currencyDisplay: 'narrowSymbol' | 'symbol',
): Intl.NumberFormat {
  const config = getCurrencyConfig(currency);

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    currencyDisplay,
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
    notation: options.notation,
    signDisplay: options.signDisplay,
  });
}

function formatWithConfiguredSymbol(amount: number, currency: CurrencyCode, options: MoneyFormatOptions): string {
  const config = getCurrencyConfig(currency);
  const parts = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    currencyDisplay: 'code',
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
    notation: options.notation,
    signDisplay: options.signDisplay,
  }).formatToParts(amount);

  return parts.map((part) => (part.type === 'currency' ? config.symbol : part.value)).join('');
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  options: MoneyFormatOptions = {},
): string {
  const safeCurrency = normalizeCurrencyCode(currency);
  const safeAmount = getSafeAmount(amount);

  try {
    return createCurrencyFormatter(safeCurrency, options, 'narrowSymbol').format(safeAmount);
  } catch {
    try {
      return createCurrencyFormatter(safeCurrency, options, 'symbol').format(safeAmount);
    } catch {
      return formatWithConfiguredSymbol(safeAmount, safeCurrency, options);
    }
  }
}

export function formatSignedMoney(amount: number, currency: CurrencyCode): string {
  const safeAmount = getSafeAmount(amount);

  return formatMoney(safeAmount, currency, { signDisplay: safeAmount === 0 ? 'auto' : 'always' });
}
