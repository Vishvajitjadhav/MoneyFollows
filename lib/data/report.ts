import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  calculateAverageDaily,
  calculateFamilySupport,
  calculateMonthlyComparison,
  compareCategoryTotals,
  type Comparison,
  type CategoryChange,
  type Totals,
} from "@/lib/calculations";
import { elapsedDays, formatRange, monthRange, previousRange, shiftMonth, todayISO, type DateRange } from "@/lib/dates";
import { buildInsights, type Insight } from "@/lib/insights";
import type { TransactionView } from "@/types/app";
import { getCategoryTotals, getMonthlyTotals, getPeriodTotals, getSubcategoryTotals, type CategoryTotal } from "./analytics";

export type ReportData = {
  userName: string;
  range: DateRange;
  label: string;
  previous: DateRange;
  previousLabel: string;
  totals: Totals;
  previousTotals: Totals;
  comparison: { income: Comparison; expenses: Comparison; investments: Comparison; remaining: Comparison };
  categories: CategoryTotal[];
  categoryChanges: CategoryChange[];
  family: { total: number; previous: number; breakdown: { name: string; total: number }[] };
  topExpenses: TransactionView[];
  purchases: TransactionView[];
  purchaseTotal: number;
  months: { month: string; income: number; expense: number; investment: number }[];
  averageDaily: number;
  insights: Insight[];
  generatedAt: string;
};

const num = (v: unknown) => Number(v ?? 0);

async function top(from: string, to: string, purchaseOnly: boolean, limit: number): Promise<TransactionView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("top_transactions", { p_from: from, p_to: to, p_type: "EXPENSE", p_purchase_only: purchaseOnly, p_limit: limit });
  if (error) throw new Error(`Could not load top transactions: ${error.message}`);
  return (data ?? []).map((t) => ({ ...t, amount: num(t.amount) }));
}

/** Everything the monthly review and the PDF report show, for one period. */
export async function getReportData(range: DateRange, label: string): Promise<ReportData> {
  const user = await requireUser();
  const supabase = await createClient();
  const previous = previousRange(range);
  const trendFrom = shiftMonth(range.to, -5);

  const [profile, totals, previousTotals, categories, previousCategories, topExpenses, purchases, monthly] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    getPeriodTotals(range.from, range.to),
    getPeriodTotals(previous.from, previous.to),
    getCategoryTotals(range.from, range.to),
    getCategoryTotals(previous.from, previous.to),
    top(range.from, range.to, false, 8),
    top(range.from, range.to, true, 10),
    getMonthlyTotals(trendFrom, monthRange(range.to).to),
  ]);

  const familyCat = categories.find((c) => c.icon === "family");
  const familySubs = familyCat ? await getSubcategoryTotals(familyCat.category_id, range) : [];
  const familyTotal = calculateFamilySupport(categories);
  const familyPrev = calculateFamilySupport(previousCategories);
  const averageDaily = calculateAverageDaily(totals.expenses, elapsedDays(range, todayISO()));
  const previousLabel = formatRange(previous);

  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(trendFrom, i)).map(
    (m) => monthly.find((x) => x.month.slice(0, 7) === m.slice(0, 7)) ?? { month: m, income: 0, expense: 0, investment: 0 },
  );

  return {
    userName: profile.data?.full_name ?? user.email ?? "You",
    range,
    label,
    previous,
    previousLabel,
    totals,
    previousTotals,
    comparison: {
      income: calculateMonthlyComparison(totals.income, previousTotals.income),
      expenses: calculateMonthlyComparison(totals.expenses, previousTotals.expenses),
      investments: calculateMonthlyComparison(totals.investments, previousTotals.investments),
      remaining: calculateMonthlyComparison(totals.remaining, previousTotals.remaining),
    },
    categories,
    categoryChanges: compareCategoryTotals(categories, previousCategories),
    family: { total: familyTotal, previous: familyPrev, breakdown: familySubs.map((s) => ({ name: s.name, total: s.total })) },
    topExpenses,
    purchases,
    purchaseTotal: purchases.reduce((s, p) => s + p.amount, 0),
    months,
    averageDaily,
    insights: buildInsights(
      {
        periodLabel: "this period",
        previousLabel: "the previous period",
        expenses: totals.expenses,
        previousExpenses: previousTotals.expenses,
        categories,
        previousCategories,
        averageDaily,
        familySupport: familyTotal,
        previousFamilySupport: familyPrev,
        hasPrevious: previousTotals.count > 0,
      },
      6,
    ),
    generatedAt: new Date().toISOString(),
  };
}
