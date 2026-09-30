/**
 * Deterministic sample data for DEV-ONLY previews (/design/*). Never used in production paths.
 */
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories";
import { calculateAverageDaily, calculateFamilySupport, calculateMonthlyComparison, compareCategoryTotals, summarize, withShares } from "@/lib/calculations";
import { buildInsights } from "@/lib/insights";
import type { ReportData } from "@/lib/data/report";
import type { Category, TransactionView } from "@/types/app";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

let seq = 1;
export const sampleCategories: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
  id: id(seq++),
  name: c.name,
  type: c.type,
  icon: c.icon,
  color: c.color,
  sort_order: i,
  is_system: true,
  subcategories: c.subcategories.map((s, j) => ({ id: id(seq++), name: s, category_id: "", sort_order: j })),
})).map((c) => ({ ...c, subcategories: c.subcategories.map((s) => ({ ...s, category_id: c.id })) }));

const cat = (type: Category["type"], name: string) => sampleCategories.find((c) => c.type === type && c.name === name)!;

function tx(date: string, type: Category["type"], catName: string, sub: string | null, amount: number, description: string | null = null, purchase = false): TransactionView {
  const c = cat(type, catName);
  const s = sub ? c.subcategories.find((x) => x.name === sub)! : null;
  return {
    id: id(seq++),
    type,
    amount,
    transaction_date: date,
    description,
    notes: null,
    is_purchase: purchase,
    category_id: c.id,
    category_name: c.name,
    category_icon: c.icon,
    category_color: c.color,
    subcategory_id: s?.id ?? null,
    subcategory_name: s?.name ?? null,
    created_at: `${date}T10:00:00Z`,
  };
}

export const sampleTransactions: TransactionView[] = [
  tx("2026-09-30", "EXPENSE", "Food", "Lunch", 250, "Office lunch"),
  tx("2026-09-30", "EXPENSE", "Transport", "Petrol", 500, "Bike"),
  tx("2026-09-30", "EXPENSE", "Lifestyle", "Gym", 100),
  tx("2026-09-29", "EXPENSE", "Food", "Dinner", 420, "Swiggy"),
  tx("2026-09-28", "INCOME", "Freelance", null, 8000, "Website work"),
  tx("2026-09-24", "EXPENSE", "Entertainment", "Movie", 250, "Movie night"),
  tx("2026-09-20", "EXPENSE", "Shopping", "Watch", 8500, "Casio watch", true),
  tx("2026-09-15", "EXPENSE", "Shopping", "Electronics", 4999, "Headphones", true),
  tx("2026-09-10", "EXPENSE", "Family", "Parents", 10000),
  tx("2026-09-05", "INVESTMENT", "SIP", null, 10000, "Nifty 50 index"),
  tx("2026-09-05", "INVESTMENT", "PPF", null, 5000),
  tx("2026-09-03", "EXPENSE", "Bills", "Internet", 799),
  tx("2026-09-02", "EXPENSE", "Food", "Milk", 1200),
  tx("2026-09-01", "EXPENSE", "Housing", "Rent", 12000, "Flat rent"),
  tx("2026-09-01", "INCOME", "Salary", null, 65000, "September salary"),
  tx("2026-09-01", "INCOME", "Side income", null, 2500),
].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

export function sampleReport(): ReportData {
  const rows = sampleTransactions;
  const sum = (t: Category["type"]) => rows.filter((r) => r.type === t).reduce((s, r) => s + r.amount, 0);
  const totals = summarize([
    { type: "INCOME", total: sum("INCOME"), count: rows.filter((r) => r.type === "INCOME").length },
    { type: "EXPENSE", total: sum("EXPENSE"), count: rows.filter((r) => r.type === "EXPENSE").length },
    { type: "INVESTMENT", total: sum("INVESTMENT"), count: rows.filter((r) => r.type === "INVESTMENT").length },
  ]);
  const previousTotals = summarize([
    { type: "INCOME", total: 67500, count: 2 },
    { type: "EXPENSE", total: 31200, count: 28 },
    { type: "INVESTMENT", total: 15000, count: 2 },
  ]);
  const byCat = new Map<string, { category_id: string; name: string; icon: string; color: string; total: number; count: number }>();
  rows.filter((r) => r.type === "EXPENSE").forEach((r) => {
    const g = byCat.get(r.category_id) ?? { category_id: r.category_id, name: r.category_name, icon: r.category_icon, color: r.category_color, total: 0, count: 0 };
    g.total += r.amount;
    g.count += 1;
    byCat.set(r.category_id, g);
  });
  const categories = withShares([...byCat.values()].sort((a, b) => b.total - a.total));
  const previousCategories = [
    { name: "Housing", icon: "housing", total: 12000 },
    { name: "Family", icon: "family", total: 8000 },
    { name: "Food", icon: "food", total: 1800 },
    { name: "Shopping", icon: "shopping", total: 6000 },
    { name: "Transport", icon: "transport", total: 1400 },
  ];
  const expenses = rows.filter((r) => r.type === "EXPENSE");
  const family = calculateFamilySupport(categories);
  const averageDaily = calculateAverageDaily(totals.expenses, 30);

  return {
    userName: "Asha Kulkarni",
    range: { from: "2026-09-01", to: "2026-09-30" },
    label: "September 2026",
    previous: { from: "2026-08-01", to: "2026-08-31" },
    previousLabel: "1 Aug – 31 Aug 2026",
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
    family: { total: family, previous: 8000, breakdown: [{ name: "Parents", total: family }] },
    topExpenses: [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 8),
    purchases: expenses.filter((e) => e.is_purchase),
    purchaseTotal: expenses.filter((e) => e.is_purchase).reduce((s, e) => s + e.amount, 0),
    months: [
      { month: "2026-04-01", income: 65000, expense: 29800, investment: 10000 },
      { month: "2026-05-01", income: 65000, expense: 34100, investment: 10000 },
      { month: "2026-06-01", income: 70500, expense: 30900, investment: 15000 },
      { month: "2026-07-01", income: 65000, expense: 27400, investment: 15000 },
      { month: "2026-08-01", income: 67500, expense: 31200, investment: 15000 },
      { month: "2026-09-01", income: totals.income, expense: totals.expenses, investment: totals.investments },
    ],
    averageDaily,
    insights: buildInsights({
      periodLabel: "this month",
      previousLabel: "last month",
      expenses: totals.expenses,
      previousExpenses: previousTotals.expenses,
      categories,
      previousCategories,
      averageDaily,
      familySupport: family,
      previousFamilySupport: 8000,
      hasPrevious: true,
    }, 6),
    generatedAt: "2026-09-30T12:00:00.000Z",
  };
}
