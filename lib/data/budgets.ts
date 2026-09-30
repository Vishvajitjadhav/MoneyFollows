import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { calculateBudgetUsage, type BudgetUsage } from "@/lib/calculations";
import { monthRange, monthStart } from "@/lib/dates";
import { getCategoryTotals } from "./analytics";

export type BudgetWithUsage = {
  id: string;
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  usage: BudgetUsage;
};

/** Budgets for the month containing `anyDay`, with what's been spent against each. */
export const getBudgetsWithUsage = cache(async (anyDay: string): Promise<BudgetWithUsage[]> => {
  const month = monthStart(anyDay);
  const range = monthRange(month);
  const supabase = await createClient();
  const [{ data, error }, totals] = await Promise.all([
    supabase.from("budgets").select("id, amount, category_id, categories(name, icon, color)").eq("month", month),
    getCategoryTotals(range.from, range.to, "EXPENSE"),
  ]);
  if (error) throw new Error(`Could not load budgets: ${error.message}`);

  return (data ?? [])
    .map((b) => {
      const cat = b.categories as unknown as { name: string; icon: string; color: string } | null;
      const spent = totals.find((t) => t.category_id === b.category_id)?.total ?? 0;
      return {
        id: b.id,
        categoryId: b.category_id,
        name: cat?.name ?? "Category",
        icon: cat?.icon ?? "other",
        color: cat?.color ?? "slate",
        usage: calculateBudgetUsage(Number(b.amount), spent),
      };
    })
    .sort((a, b) => b.usage.ratio - a.usage.ratio);
});
