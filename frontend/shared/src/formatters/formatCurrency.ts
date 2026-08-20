const defaultFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const formatterCache = new Map<string, Intl.NumberFormat>();

export interface FormatCurrencyOptions {
  currency?: string;
  maximumFractionDigits?: number;
}

export function formatCurrency(value: number, options?: FormatCurrencyOptions): string {
  if (!options) return defaultFormatter.format(value);

  const currency = options.currency ?? 'BRL';
  const maximumFractionDigits = options.maximumFractionDigits ?? 0;
  const cacheKey = `${currency}:${maximumFractionDigits}`;

  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      maximumFractionDigits,
    });
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(value);
}
