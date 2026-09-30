/**
 * TypeScript twin of public.recurrence_next() — used to preview "next on …"
 * and to reschedule when a rule is edited or resumed. Keep the two in sync.
 */
import { addMonths, addYears, differenceInCalendarDays, differenceInCalendarMonths } from "date-fns";
import { fromISO, toISO } from "./dates.ts";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** First occurrence strictly after `after`, anchored on `start` (31 Jan → 28 Feb → 31 Mar). */
export function recurrenceNextClient(start: string, after: string, frequency: Frequency): string {
  if (after < start) return start;
  const s = fromISO(start);
  const a = fromISO(after);
  if (frequency === "DAILY") return toISO(new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1));
  if (frequency === "WEEKLY") {
    const weeks = Math.floor(differenceInCalendarDays(a, s) / 7) + 1;
    return toISO(new Date(s.getFullYear(), s.getMonth(), s.getDate() + weeks * 7));
  }
  const step = frequency === "MONTHLY" ? addMonths : addYears;
  let n = frequency === "MONTHLY" ? differenceInCalendarMonths(a, s) : a.getFullYear() - s.getFullYear();
  let candidate = step(s, n);
  while (toISO(candidate) <= after) candidate = step(s, ++n);
  return toISO(candidate);
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

/** Rough monthly equivalent, for "₹X / month" summaries. */
export function monthlyEquivalent(amount: number, frequency: Frequency | "ONE_TIME" | "QUARTERLY"): number {
  switch (frequency) {
    case "DAILY":
      return amount * 30;
    case "WEEKLY":
      return (amount * 52) / 12;
    case "MONTHLY":
      return amount;
    case "QUARTERLY":
      return amount / 3;
    case "YEARLY":
      return amount / 12;
    default:
      return 0;
  }
}
