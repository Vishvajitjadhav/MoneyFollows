/**
 * Date helpers. All app dates are calendar dates ("YYYY-MM-DD") in the user's
 * time zone — India by default. Servers run in UTC, so never use `new Date()`
 * directly to decide what "today" is.
 */
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export const APP_TIME_ZONE = "Asia/Kolkata";

export type ISODate = string; // "YYYY-MM-DD"

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's calendar date in the app time zone. */
export function todayISO(now: Date = new Date()): ISODate {
  return isoFormatter.format(now);
}

/** Parse "YYYY-MM-DD" as a local calendar date (no time-zone shift). */
export function fromISO(iso: ISODate): Date {
  return parseISO(iso);
}

export function toISO(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function isISODate(value: unknown): value is ISODate {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

export type DateRange = { from: ISODate; to: ISODate };

export function monthRange(anchor: ISODate): DateRange {
  const d = fromISO(anchor);
  return { from: toISO(startOfMonth(d)), to: toISO(endOfMonth(d)) };
}

/** Same-length range immediately before `range` (for "vs previous period"). */
export function previousRange(range: DateRange): DateRange {
  const from = fromISO(range.from);
  const to = fromISO(range.to);
  // Whole months → previous whole months (so Feb compares with Jan fully).
  if (toISO(startOfMonth(from)) === range.from && toISO(endOfMonth(to)) === range.to) {
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
    const prevFrom = subMonths(from, months);
    return { from: toISO(prevFrom), to: toISO(endOfMonth(addMonths(prevFrom, months - 1))) };
  }
  const days = differenceInCalendarDays(to, from) + 1;
  return { from: toISO(addDays(from, -days)), to: toISO(addDays(from, -1)) };
}

export const PERIODS = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
  { value: "custom", label: "Custom" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["value"];

export function isPeriodKey(v: unknown): v is PeriodKey {
  return PERIODS.some((p) => p.value === v);
}

/** Resolve a period preset (or custom from/to) into a concrete date range. */
export function resolvePeriod(
  period: PeriodKey,
  custom: { from?: string; to?: string } = {},
  today: ISODate = todayISO(),
): DateRange & { label: string } {
  const t = fromISO(today);
  switch (period) {
    case "last-month": {
      const m = subMonths(t, 1);
      return { from: toISO(startOfMonth(m)), to: toISO(endOfMonth(m)), label: format(m, "MMMM yyyy") };
    }
    case "last-3-months":
      return {
        from: toISO(startOfMonth(subMonths(t, 2))),
        to: toISO(endOfMonth(t)),
        label: `${format(subMonths(t, 2), "MMM")} – ${format(t, "MMM yyyy")}`,
      };
    case "this-year":
      return { from: toISO(startOfYear(t)), to: toISO(endOfYear(t)), label: format(t, "yyyy") };
    case "custom": {
      if (isISODate(custom.from) && isISODate(custom.to) && custom.from <= custom.to) {
        return { from: custom.from, to: custom.to, label: formatRange({ from: custom.from, to: custom.to }) };
      }
      return resolvePeriod("this-month", {}, today);
    }
    default:
      return { from: toISO(startOfMonth(t)), to: toISO(endOfMonth(t)), label: format(t, "MMMM yyyy") };
  }
}

/** Number of days of a range that have happened so far (for daily averages). */
export function elapsedDays(range: DateRange, today: ISODate = todayISO()): number {
  const end = range.to < today ? range.to : today;
  if (end < range.from) return 0;
  return differenceInCalendarDays(fromISO(end), fromISO(range.from)) + 1;
}

export function formatDay(iso: ISODate, today: ISODate = todayISO()): string {
  if (iso === today) return "Today";
  if (iso === toISO(addDays(fromISO(today), -1))) return "Yesterday";
  const d = fromISO(iso);
  return format(d, d.getFullYear() === fromISO(today).getFullYear() ? "EEE, d MMM" : "d MMM yyyy");
}

export function formatShortDate(iso: ISODate): string {
  return format(fromISO(iso), "d MMM");
}

export function formatMonth(iso: ISODate, pattern = "MMMM yyyy"): string {
  return format(fromISO(iso), pattern);
}

export function formatRange({ from, to }: DateRange): string {
  const f = fromISO(from);
  const t = fromISO(to);
  if (from === to) return format(f, "d MMM yyyy");
  if (f.getFullYear() === t.getFullYear()) return `${format(f, "d MMM")} – ${format(t, "d MMM yyyy")}`;
  return `${format(f, "d MMM yyyy")} – ${format(t, "d MMM yyyy")}`;
}

/** First day of the month containing `iso`. */
export function monthStart(iso: ISODate): ISODate {
  return toISO(startOfMonth(fromISO(iso)));
}

export function shiftMonth(iso: ISODate, months: number): ISODate {
  return toISO(startOfMonth(addMonths(fromISO(iso), months)));
}
