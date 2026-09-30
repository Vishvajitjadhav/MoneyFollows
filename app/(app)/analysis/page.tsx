import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { BreakdownList, ComparisonList, InsightList, Kpi } from "@/components/analysis/breakdown";
import { PeriodPicker } from "@/components/analysis/period-picker";
import { DailySpendingChart, IncomeExpenseChart, SpendingTrendChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { Page, Section } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { AddButton } from "@/components/transactions/add-button";
import { Button } from "@/components/ui/button";
import { calculateAverageDaily, calculateFamilySupport, compareCategoryTotals } from "@/lib/calculations";
import { getCategoryTotals, getDailyTotals, getMonthlyTotals, getPeriodTotals, getSubcategoryTotals } from "@/lib/data/analytics";
import { getBudgetsWithUsage } from "@/lib/data/budgets";
import { periodFromSearchParams } from "@/lib/data/period";
import { eachDay, elapsedDays, monthRange, previousRange, rangeDays, shiftMonth, todayISO } from "@/lib/dates";
import { formatPercent } from "@/lib/format";
import { buildInsights } from "@/lib/insights";

export const metadata: Metadata = { title: "Analysis" };

export default async function AnalysisPage({ searchParams }: PageProps<"/analysis">) {
  const sp = await searchParams;
  const { period, range, query, from, to } = periodFromSearchParams(sp);
  const prev = previousRange(range);
  const today = todayISO();
  const trendFrom = shiftMonth(range.to, -11);
  const singleMonth = rangeDays(range) <= 31 && range.from === monthRange(range.from).from && range.to === monthRange(range.from).to;

  const [totals, prevTotals, cats, prevCats, daily, monthly, budgets] = await Promise.all([
    getPeriodTotals(range.from, range.to),
    getPeriodTotals(prev.from, prev.to),
    getCategoryTotals(range.from, range.to),
    getCategoryTotals(prev.from, prev.to),
    getDailyTotals(range.from, range.to),
    getMonthlyTotals(trendFrom, monthRange(range.to).to),
    singleMonth ? getBudgetsWithUsage(range.from) : Promise.resolve([]),
  ]);

  const familyCat = cats.find((c) => c.icon === "family");
  const familySubs = familyCat ? await getSubcategoryTotals(familyCat.category_id, range) : [];

  const days = elapsedDays(range, today);
  const avgDaily = calculateAverageDaily(totals.expenses, days);
  const family = calculateFamilySupport(cats);
  const prevFamily = calculateFamilySupport(prevCats);
  const periodWord = period === "this-month" ? "this month" : period === "last-month" ? "last month" : "in this period";
  const prevWord = period === "this-month" ? "last month" : period === "last-month" ? "the month before" : "the previous period";

  const insights = buildInsights({
    periodLabel: periodWord,
    previousLabel: prevWord,
    expenses: totals.expenses,
    previousExpenses: prevTotals.expenses,
    categories: cats,
    previousCategories: prevCats,
    averageDaily: avgDaily,
    familySupport: family,
    previousFamilySupport: prevFamily,
    budgets,
    hasPrevious: prevTotals.count > 0,
  });

  // Fill empty days so the daily chart shows gaps honestly.
  const dailyFilled = rangeDays(range) <= 93 ? eachDay({ from: range.from, to: range.to < today ? range.to : today }).map((d) => ({ day: d, total: daily.find((x) => x.day === d)?.total ?? 0 })) : [];
  // Pad months with zero so the trend has a stable x-axis.
  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(trendFrom, i));
  const monthly12 = months.map((m) => monthly.find((x) => x.month.slice(0, 7) === m.slice(0, 7)) ?? { month: m, income: 0, expense: 0, investment: 0 });

  const drill = (id: string) => `/analysis/category/${id}${query}`;

  return (
    <Page
      title="Analysis"
      eyebrow={range.label}
      width="wide"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/analysis/calendar">
            <CalendarDays /> Calendar
          </Link>
        </Button>
      }
    >
      <PeriodPicker period={period} from={from} to={to} basePath="/analysis" />

      {totals.count === 0 ? (
        <EmptyState
          className="mt-6"
          title="Nothing to analyse yet"
          description="Add a few expenses and this page will show where your money goes."
          action={<AddButton label="Add expense" />}
        />
      ) : (
        <div className="mt-5 space-y-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Income" tone="income" value={<MoneyText amount={totals.income} size="lg" tone="income" />} />
            <Kpi label="Expenses" value={<MoneyText amount={totals.expenses} size="lg" />} />
            <Kpi label="Invested" tone="invest" value={<MoneyText amount={totals.investments} size="lg" tone="invest" />} />
            <Kpi
              label="Remaining"
              value={<MoneyText amount={totals.remaining} size="lg" tone={totals.remaining < 0 ? "warning" : "default"} />}
              hint={totals.savingsRate !== null ? `Savings rate ${formatPercent(totals.savingsRate)}` : undefined}
            />
            <Kpi label="Avg. daily spend" value={<MoneyText amount={avgDaily} size="lg" />} hint={`over ${days} ${days === 1 ? "day" : "days"}`} />
            <Kpi label="Transactions" value={<span className="money text-xl">{totals.count}</span>} />
          </div>

          {insights.length > 0 && (
            <Section title="Insights">
              <InsightList insights={insights} />
            </Section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Where your money went">
              <BreakdownList
                rows={cats.map((c) => ({ id: c.category_id, name: c.name, icon: c.icon, color: c.color, total: c.total, count: c.count, share: c.share, href: drill(c.category_id) }))}
                emptyText="No expenses in this period."
              />
            </Section>

            <div className="space-y-8">
              <Section title="Income vs expense">
                <div className="rounded-2xl border bg-card p-4 shadow-card">
                  <IncomeExpenseChart data={monthly12.slice(-6)} />
                </div>
              </Section>
              {dailyFilled.length > 1 && (
                <Section title="Daily spending">
                  <div className="rounded-2xl border bg-card p-4 shadow-card">
                    <DailySpendingChart data={dailyFilled} />
                  </div>
                </Section>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Spending trend · 12 months">
              <div className="rounded-2xl border bg-card p-4 shadow-card">
                <SpendingTrendChart data={monthly12} />
              </div>
            </Section>
            {prevTotals.count > 0 && (
              <Section title={`Compared with ${prevWord}`}>
                <ComparisonList rows={compareCategoryTotals(cats, prevCats)} previousLabel={prevWord} />
              </Section>
            )}
          </div>

          {family > 0 && familyCat && (
            <Section
              title="Family support"
              action={<MoneyText amount={family} size="md" />}
            >
              <BreakdownList
                rows={familySubs.map((s) => ({
                  id: s.subcategory_id,
                  name: s.name,
                  total: s.total,
                  count: s.count,
                  share: s.share,
                  color: familyCat.color,
                  href: `/history?category=${familyCat.category_id}${s.subcategory_id ? `&sub=${s.subcategory_id}` : ""}&from=${range.from}&to=${range.to}`,
                }))}
              />
            </Section>
          )}
        </div>
      )}
    </Page>
  );
}
