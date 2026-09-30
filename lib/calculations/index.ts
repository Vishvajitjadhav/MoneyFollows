/**
 * Pure money math. No I/O, no framework imports — safe to unit test and to
 * reuse in pages, PDF reports and (later) AI explanations.
 * All amounts are rupees as numbers; results are rounded to paise.
 */

export type TxType = "EXPENSE" | "INCOME" | "INVESTMENT";

export type TxLike = {
  type: TxType;
  amount: number;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  is_purchase?: boolean;
  description?: string | null;
  transaction_date?: string;
};

export type Totals = {
  income: number;
  expenses: number;
  investments: number;
  remaining: number;
  savingsRate: number | null;
  count: number;
};

const round = (n: number) => Math.round(n * 100) / 100;
const sumBy = (txs: TxLike[], type: TxType) => round(txs.reduce((s, t) => (t.type === type ? s + Number(t.amount) : s), 0));

export const calculateMonthlyIncome = (txs: TxLike[]) => sumBy(txs, "INCOME");
export const calculateMonthlyExpenses = (txs: TxLike[]) => sumBy(txs, "EXPENSE");
export const calculateInvestments = (txs: TxLike[]) => sumBy(txs, "INVESTMENT");

/** Money left after spending and investing. Can be negative. */
export function calculateRemaining(income: number, expenses: number, investments: number): number {
  return round(income - expenses - investments);
}

/**
 * Share of income not spent. Investments count as saved money.
 * null when there's no income to compare against.
 */
export function calculateSavingsRate(income: number, expenses: number): number | null {
  if (income <= 0) return null;
  return (income - expenses) / income;
}

/** Totals from period_summary() rows. */
export function summarize(rows: { type: TxType; total: number; count: number }[]): Totals {
  const get = (t: TxType) => round(Number(rows.find((r) => r.type === t)?.total ?? 0));
  const income = get("INCOME");
  const expenses = get("EXPENSE");
  const investments = get("INVESTMENT");
  return {
    income,
    expenses,
    investments,
    remaining: calculateRemaining(income, expenses, investments),
    savingsRate: calculateSavingsRate(income, expenses),
    count: rows.reduce((s, r) => s + Number(r.count), 0),
  };
}

export type GroupTotal = { id: string | null; name: string; total: number; count: number; share: number };

function group(txs: TxLike[], key: (t: TxLike) => [string | null, string]): GroupTotal[] {
  const map = new Map<string, GroupTotal>();
  let all = 0;
  for (const t of txs) {
    const [id, name] = key(t);
    const k = id ?? `name:${name}`;
    const g = map.get(k) ?? { id, name, total: 0, count: 0, share: 0 };
    g.total = round(g.total + Number(t.amount));
    g.count += 1;
    all += Number(t.amount);
    map.set(k, g);
  }
  return [...map.values()]
    .map((g) => ({ ...g, share: all > 0 ? g.total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function calculateCategoryTotals(txs: TxLike[], type: TxType = "EXPENSE"): GroupTotal[] {
  return group(
    txs.filter((t) => t.type === type),
    (t) => [t.category_id ?? null, t.category_name ?? "Other"],
  );
}

export function calculateSubcategoryTotals(txs: TxLike[], categoryId?: string): GroupTotal[] {
  return group(
    txs.filter((t) => t.type === "EXPENSE" && (!categoryId || t.category_id === categoryId)),
    (t) => [t.subcategory_id ?? null, t.subcategory_name ?? "Uncategorised"],
  );
}

/** Add `share` (0–1) to aggregated rows such as category_totals(). */
export function withShares<T extends { total: number }>(rows: T[]): (T & { share: number })[] {
  const all = rows.reduce((s, r) => s + Number(r.total), 0);
  return rows.map((r) => ({ ...r, total: Number(r.total), share: all > 0 ? Number(r.total) / all : 0 }));
}

export type Comparison = {
  current: number;
  previous: number;
  change: number;
  /** null when there's nothing to compare against. */
  changePct: number | null;
};

export function calculateMonthlyComparison(current: number, previous: number): Comparison {
  const change = round(current - previous);
  return { current, previous, change, changePct: previous > 0 ? change / previous : null };
}

export type BudgetStatus = "ok" | "warning" | "over";

export type BudgetUsage = {
  budget: number;
  used: number;
  remaining: number;
  ratio: number;
  status: BudgetStatus;
};

/** warning from 80%, over past 100%. */
export function calculateBudgetUsage(budget: number, used: number): BudgetUsage {
  const ratio = budget > 0 ? used / budget : 0;
  return {
    budget,
    used: round(used),
    remaining: round(budget - used),
    ratio,
    status: ratio > 1 ? "over" : ratio >= 0.8 ? "warning" : "ok",
  };
}

type CategoryTotalRow = { name: string; icon?: string; total: number };

/** Family support = the Family category (identified by its icon, so renames still count). */
export function calculateFamilySupport(categoryTotals: CategoryTotalRow[]): number {
  return round(
    categoryTotals
      .filter((c) => c.icon === "family" || (!c.icon && c.name.toLowerCase() === "family"))
      .reduce((s, c) => s + Number(c.total), 0),
  );
}

export type PurchaseTotals = { total: number; count: number; largest: TxLike | null };

export function calculatePurchaseTotals(txs: TxLike[]): PurchaseTotals {
  const purchases = txs.filter((t) => t.is_purchase);
  const largest = purchases.reduce<TxLike | null>((max, t) => (!max || Number(t.amount) > Number(max.amount) ? t : max), null);
  return { total: round(purchases.reduce((s, t) => s + Number(t.amount), 0)), count: purchases.length, largest };
}

export function calculateAverageDaily(total: number, days: number): number {
  return days > 0 ? round(total / days) : 0;
}

export type CategoryChange = { name: string; icon?: string; current: number; previous: number; change: number; changePct: number | null };

/** Per-category change between two periods, biggest absolute change first. */
export function compareCategoryTotals(current: CategoryTotalRow[], previous: CategoryTotalRow[]): CategoryChange[] {
  const names = new Set([...current.map((c) => c.name), ...previous.map((p) => p.name)]);
  return [...names]
    .map((name) => {
      const cur = current.find((c) => c.name === name);
      const prev = previous.find((p) => p.name === name);
      const cmp = calculateMonthlyComparison(Number(cur?.total ?? 0), Number(prev?.total ?? 0));
      return { name, icon: cur?.icon ?? prev?.icon, ...cmp };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
