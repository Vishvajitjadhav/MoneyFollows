import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { summarize, withShares, type Totals } from "@/lib/calculations";
import type { DateRange } from "@/lib/dates";
import type { FoundTransaction } from "@/types/database";
import type { TransactionType, TransactionView } from "@/types/app";

const n = (v: unknown) => Number(v ?? 0);

function fail(what: string, error: { message: string }): never {
  throw new Error(`Could not load ${what}: ${error.message}`);
}

export const getPeriodTotals = cache(async (from: string, to: string): Promise<Totals> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("period_summary", { p_from: from, p_to: to });
  if (error) fail("totals", error);
  return summarize((data ?? []).map((r) => ({ type: r.type, total: n(r.total), count: n(r.count) })));
});

export type CategoryTotal = { category_id: string; name: string; icon: string; color: string; total: number; count: number; share: number };

export const getCategoryTotals = cache(
  async (from: string, to: string, type: TransactionType = "EXPENSE", purchaseOnly = false): Promise<CategoryTotal[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("category_totals", {
      p_from: from,
      p_to: to,
      p_type: type,
      p_purchase_only: purchaseOnly,
    });
    if (error) fail("category totals", error);
    return withShares((data ?? []).map((r) => ({ ...r, total: n(r.total), count: n(r.count) })));
  },
);

export async function getSubcategoryTotals(categoryId: string, range: DateRange) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("subcategory_totals", {
    p_category_id: categoryId,
    p_from: range.from,
    p_to: range.to,
  });
  if (error) fail("subcategory totals", error);
  return withShares((data ?? []).map((r) => ({ ...r, total: n(r.total), count: n(r.count) })));
}

export const getDailyTotals = cache(async (from: string, to: string, type: TransactionType = "EXPENSE") => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("daily_totals", { p_from: from, p_to: to, p_type: type });
  if (error) fail("daily totals", error);
  return (data ?? []).map((r) => ({ day: r.day, total: n(r.total), count: n(r.count) }));
});

export const getMonthlyTotals = cache(async (from: string, to: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("monthly_totals", { p_from: from, p_to: to });
  if (error) fail("monthly totals", error);
  return (data ?? []).map((r) => ({
    month: r.month,
    income: n(r.income),
    expense: n(r.expense),
    investment: n(r.investment),
  }));
});

export type TransactionFilters = {
  q?: string | null;
  from?: string | null;
  to?: string | null;
  type?: TransactionType | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  min?: number | null;
  max?: number | null;
  purchaseOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type TransactionPage = {
  rows: TransactionView[];
  total: number;
  totals: { expense: number; income: number; investment: number };
};

export async function findTransactions(f: TransactionFilters = {}): Promise<TransactionPage> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_transactions", {
    p_query: f.q ?? null,
    p_from: f.from ?? null,
    p_to: f.to ?? null,
    p_type: f.type ?? null,
    p_category_id: f.categoryId ?? null,
    p_subcategory_id: f.subcategoryId ?? null,
    p_min: f.min ?? null,
    p_max: f.max ?? null,
    p_purchase_only: f.purchaseOnly ?? false,
    p_limit: f.limit ?? 30,
    p_offset: f.offset ?? 0,
  });
  if (error) fail("transactions", error);

  const rows = (data ?? []) as FoundTransaction[];
  const first = rows[0];
  return {
    rows: rows.map(({ total_count: _c, total_expense: _e, total_income: _i, total_investment: _v, ...t }) => ({
      ...t,
      amount: n(t.amount),
    })),
    total: n(first?.total_count),
    totals: {
      expense: n(first?.total_expense),
      income: n(first?.total_income),
      investment: n(first?.total_investment),
    },
  };
}

/** Create any due recurring transactions for the current user. Cheap when nothing is due. */
export async function runDueRecurring(today: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_recurring_transactions", { p_today: today });
  if (error) {
    console.error("generate_recurring_transactions failed", error.message);
    return 0;
  }
  return n(data);
}
