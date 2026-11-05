import type { MonthKey } from "../types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MIN_DATE = "2000-01-01";
export const MAX_DATE = "2099-12-31";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** True only for real calendar dates in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Dates are parsed and formatted in UTC so a user's time zone never shifts the day. */
function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const shortFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const longFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthNameFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});

export const formatDateShort = (iso: string): string =>
  shortFormat.format(toUtcDate(iso));
export const formatDateLong = (iso: string): string =>
  longFormat.format(toUtcDate(iso));
export const formatMonth = (key: MonthKey): string =>
  monthFormat.format(toUtcDate(`${key}-01`));
export const formatMonthName = (key: MonthKey): string =>
  monthNameFormat.format(toUtcDate(`${key}-01`));

export const monthOf = (iso: string): MonthKey => iso.slice(0, 7);

export function lastDayOfMonth(key: MonthKey): string {
  const [year, month] = key.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${key}-${pad(last)}`;
}

/** Today's date in the visitor's local time zone, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Default date for a new transaction: today if it falls in the month, else the month's last day. */
export function defaultDateForMonth(
  key: MonthKey,
  today: string = todayIso(),
): string {
  return monthOf(today) === key ? today : lastDayOfMonth(key);
}
