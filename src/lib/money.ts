const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});
const percentOneDecimal = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Formats integer cents as "$1,234.50" (or "-$12.00"). */
export const formatMoney = (cents: number): string =>
  currency.format(cents / 100);

/** Same, without cents. Used where space is tight, such as the chart center. */
export const formatMoneyWhole = (cents: number): string =>
  currencyWhole.format(cents / 100);

export const formatPercent = (ratio: number): string => percent.format(ratio);
export const formatPercentPrecise = (ratio: number): string =>
  percentOneDecimal.format(ratio);

/**
 * Parses what a person types into an amount field and returns integer cents.
 * Accepts "12", "12.5", "1,234.50" and "$12.00". Returns null for anything else
 * (negative numbers, letters, more than two decimals, empty text).
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Turns cents back into the plain text shown in the amount field when editing. */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
