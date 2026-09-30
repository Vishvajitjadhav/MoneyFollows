/**
 * Deterministic insights: short sentences backed by actual numbers.
 * Nothing is shown unless the data supports it.
 */
import { formatINR, formatPercent } from "./format.ts";
import {
  calculateMonthlyComparison,
  compareCategoryTotals,
  type BudgetUsage,
} from "./calculations/index.ts";

export type Insight = { id: string; tone: "neutral" | "good" | "warning"; text: string };

type CategoryRow = { name: string; icon?: string; total: number };

export type InsightInput = {
  periodLabel: string; // "this month"
  previousLabel: string; // "last month"
  expenses: number;
  previousExpenses: number;
  categories: CategoryRow[];
  previousCategories: CategoryRow[];
  averageDaily: number;
  familySupport: number;
  previousFamilySupport: number;
  budgets?: { name: string; usage: BudgetUsage }[];
  /** Only compare against the previous period when it has data. */
  hasPrevious: boolean;
};

export function buildInsights(i: InsightInput, max = 5): Insight[] {
  const out: Insight[] = [];

  const top = i.categories[0];
  if (top && top.total > 0) {
    out.push({ id: "top", tone: "neutral", text: `You spent ${formatINR(top.total)} on ${top.name} ${i.periodLabel}.` });
  }

  if (i.hasPrevious && i.previousExpenses > 0) {
    const cmp = calculateMonthlyComparison(i.expenses, i.previousExpenses);
    if (cmp.changePct !== null && Math.abs(cmp.changePct) >= 0.05) {
      out.push({
        id: "total",
        tone: cmp.change > 0 ? "warning" : "good",
        text:
          cmp.change > 0
            ? `Spending is up ${formatINR(cmp.change)} (${formatPercent(cmp.changePct)}) compared with ${i.previousLabel}.`
            : `Spending is ${formatPercent(-cmp.changePct)} lower than ${i.previousLabel} — ${formatINR(-cmp.change)} less.`,
      });
    }

    const changes = compareCategoryTotals(i.categories, i.previousCategories).filter(
      // Family has its own insight below.
      (c) =>
        c.icon !== "family" && c.previous > 0 && c.current > 0 && c.changePct !== null && Math.abs(c.changePct) >= 0.15 && Math.abs(c.change) >= 300,
    );
    for (const c of changes.slice(0, 2)) {
      out.push({
        id: `cat-${c.name}`,
        tone: c.change > 0 ? "warning" : "good",
        text:
          c.change > 0
            ? `${c.name} spending increased by ${formatINR(c.change)} compared with ${i.previousLabel}.`
            : `${c.name} spending is ${formatPercent(-c.changePct!)} lower than ${i.previousLabel}.`,
      });
    }

    const fam = i.familySupport - i.previousFamilySupport;
    if (i.previousFamilySupport > 0 && Math.abs(fam) >= 500) {
      out.push({
        id: "family",
        tone: "neutral",
        text: `Family support ${fam > 0 ? "increased" : "decreased"} by ${formatINR(Math.abs(fam))} ${i.periodLabel}.`,
      });
    }
  }

  for (const b of (i.budgets ?? []).filter((b) => b.usage.status !== "ok").sort((a, b) => b.usage.ratio - a.usage.ratio).slice(0, 2)) {
    out.push({
      id: `budget-${b.name}`,
      tone: "warning",
      text:
        b.usage.status === "over"
          ? `You're ${formatINR(-b.usage.remaining)} over your ${b.name} budget.`
          : `You have used ${formatPercent(b.usage.ratio)} of your ${b.name} budget.`,
    });
  }

  if (i.averageDaily > 0) {
    out.push({ id: "daily", tone: "neutral", text: `Your average daily spending is ${formatINR(i.averageDaily)}.` });
  }

  return out.slice(0, max);
}
