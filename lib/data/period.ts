import { isPeriodKey, resolvePeriod, type PeriodKey } from "@/lib/dates";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Period from ?period=&from=&to= (defaults to this month). */
export function periodFromSearchParams(sp: SP) {
  const raw = one(sp.period);
  const period: PeriodKey = isPeriodKey(raw) ? raw : "this-month";
  const from = one(sp.from);
  const to = one(sp.to);
  const range = resolvePeriod(period, { from, to });
  const query = period === "this-month" ? "" : period === "custom" ? `?period=custom&from=${range.from}&to=${range.to}` : `?period=${period}`;
  return { period, range, query, from, to };
}
