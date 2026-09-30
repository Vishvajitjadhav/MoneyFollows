import { z } from "zod";
import type { TransactionFilters } from "@/lib/data/analytics";

/** URL search params → validated filters (History, CSV export). Bad values are dropped, not errors. */
const clean = (v: unknown) => {
  const first = Array.isArray(v) ? v[0] : v;
  if (typeof first !== "string") return undefined;
  const t = first.trim();
  return t === "" ? undefined : t;
};
const field = <T extends z.ZodType>(inner: T) => z.preprocess(clean, inner.optional()).catch(undefined);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const schema = z.object({
  q: field(z.string().max(80)),
  type: field(z.enum(["EXPENSE", "INCOME", "INVESTMENT"])),
  from: field(isoDate),
  to: field(isoDate),
  category: field(z.uuid()),
  sub: field(z.uuid()),
  min: field(z.coerce.number().nonnegative()),
  max: field(z.coerce.number().positive()),
  purchase: field(z.literal("1")),
  page: field(z.coerce.number().int().min(1).max(1000)),
});

export type HistoryParams = z.output<typeof schema>;

export function parseHistoryParams(raw: Record<string, string | string[] | undefined>): HistoryParams {
  return schema.parse(raw);
}

export const PAGE_SIZE = 30;

export function toFilters(p: HistoryParams, limit = PAGE_SIZE): TransactionFilters {
  return {
    q: p.q || null,
    type: p.type ?? null,
    from: p.from ?? null,
    to: p.to ?? null,
    categoryId: p.category ?? null,
    subcategoryId: p.sub ?? null,
    min: p.min ?? null,
    max: p.max ?? null,
    purchaseOnly: p.purchase === "1",
    limit,
    offset: ((p.page ?? 1) - 1) * limit,
  };
}

/** Build a query string from params, dropping empties. */
export function toQuery(p: Partial<Record<keyof HistoryParams, string | number | undefined | null>>): string {
  const sp = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const hasActiveFilters = (p: HistoryParams) =>
  Boolean(p.q || p.type || p.from || p.to || p.category || p.sub || p.min !== undefined || p.max !== undefined || p.purchase);
