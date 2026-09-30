import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileDown, Trophy } from "lucide-react";
import { BreakdownList, ComparisonList, InsightList } from "@/components/analysis/breakdown";
import { IncomeExpenseChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { Page, Section } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { StatCard } from "@/components/stat-card";
import { TransactionCard } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { getReportData } from "@/lib/data/report";
import { formatMonth, isISODate, monthRange, monthStart, shiftMonth, todayISO } from "@/lib/dates";
import { formatINR, formatPercent } from "@/lib/format";
import type { Comparison } from "@/lib/calculations";

export const metadata: Metadata = { title: "Monthly review" };

function Delta({ c, goodWhenUp }: { c: Comparison; goodWhenUp: boolean }) {
  if (c.previous === 0 && c.current === 0) return null;
  if (c.change === 0) return <span className="text-xs text-muted-foreground">Same as last month</span>;
  const good = c.change > 0 === goodWhenUp;
  return (
    <span className={`text-xs font-medium ${good ? "text-success" : "text-warning"}`}>
      {c.change > 0 ? "+" : "−"}
      {formatINR(Math.abs(c.change))}
      {c.changePct !== null ? ` (${formatPercent(Math.abs(c.changePct))})` : ""} vs last month
    </span>
  );
}

export default async function ReviewPage({ searchParams }: PageProps<"/review">) {
  const sp = await searchParams;
  const today = todayISO();
  const month = monthStart(typeof sp.month === "string" && isISODate(`${sp.month}-01`) ? `${sp.month}-01` : today);
  const range = monthRange(month);
  const r = await getReportData(range, formatMonth(month));
  const ym = (m: string) => m.slice(0, 7);
  const nav = (m: string) => `/review${ym(m) === ym(today) ? "" : `?month=${ym(m)}`}`;
  const topCat = r.categories[0];
  const largestPurchase = r.purchases[0];

  return (
    <Page
      title="Monthly review"
      eyebrow={formatMonth(month)}
      width="wide"
      action={
        <div className="flex items-center gap-1">
          <Link href={nav(shiftMonth(month, -1))} aria-label="Previous month" className="inline-flex size-10 items-center justify-center rounded-xl border bg-card hover:bg-muted">
            <ChevronLeft className="size-4" />
          </Link>
          <Link href={nav(shiftMonth(month, 1))} aria-label="Next month" className="inline-flex size-10 items-center justify-center rounded-xl border bg-card hover:bg-muted">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      }
    >
      {r.totals.count === 0 ? (
        <EmptyState title={`Nothing recorded in ${formatMonth(month)}`} description="Pick another month, or start adding expenses to see your review." />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(
              [
                ["Income", r.totals.income, "income", r.comparison.income, true],
                ["Expenses", r.totals.expenses, "default", r.comparison.expenses, false],
                ["Investments", r.totals.investments, "invest", r.comparison.investments, true],
                ["Remaining", r.totals.remaining, "default", r.comparison.remaining, true],
              ] as const
            ).map(([label, amount, tone, cmp, goodUp]) => (
              <div key={label} className="rounded-2xl border bg-card p-4 shadow-card">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <MoneyText amount={amount} size="lg" tone={tone} className="mt-1 block" />
                <div className="mt-1">
                  <Delta c={cmp} goodWhenUp={goodUp} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {topCat && (
              <StatCard label={`Top category · ${topCat.name}`} amount={topCat.total} icon={Trophy} hint={`${formatPercent(topCat.share)} of spending`} />
            )}
            {largestPurchase && <StatCard label={`Largest purchase · ${largestPurchase.description ?? largestPurchase.subcategory_name ?? largestPurchase.category_name}`} amount={largestPurchase.amount} />}
            {r.family.total > 0 && <StatCard label="Family support" amount={r.family.total} trend={r.family.previous > 0 ? { value: r.family.total - r.family.previous, label: "vs last month", goodWhenUp: true } : undefined} />}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-brand-soft px-5 py-4">
            <p className="flex-1 text-sm">
              {r.totals.savingsRate !== null ? (
                <>
                  You kept <strong>{formatPercent(Math.max(r.totals.savingsRate, 0))}</strong> of your income this month
                  {r.averageDaily > 0 && (
                    <>
                      {" "}
                      and spent about <strong>{formatINR(r.averageDaily)}</strong> a day
                    </>
                  )}
                  .
                </>
              ) : (
                <>You spent about <strong>{formatINR(r.averageDaily)}</strong> a day this month.</>
              )}
            </p>
            <Button asChild>
              <a href={`/api/reports/pdf?from=${range.from}&to=${range.to}`}>
                <FileDown /> Download PDF
              </a>
            </Button>
          </div>

          {r.insights.length > 0 && (
            <Section title="What changed">
              <InsightList insights={r.insights} />
            </Section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Spending by category">
              <BreakdownList
                rows={r.categories.map((c) => ({ id: c.category_id, name: c.name, icon: c.icon, color: c.color, total: c.total, count: c.count, share: c.share, href: `/analysis/category/${c.category_id}?period=custom&from=${range.from}&to=${range.to}` }))}
              />
            </Section>
            <div className="space-y-8">
              <Section title="Last 6 months">
                <div className="rounded-2xl border bg-card p-4 shadow-card">
                  <IncomeExpenseChart data={r.months} />
                </div>
              </Section>
              {r.previousTotals.count > 0 && (
                <Section title="Compared with last month">
                  <ComparisonList rows={r.categoryChanges} previousLabel={formatMonth(r.previous.from, "MMMM")} />
                </Section>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Top expenses">
              <TransactionCard rows={r.topExpenses} showDate />
            </Section>
            {r.purchases.length > 0 && (
              <Section title="Purchases" action={<MoneyText amount={r.purchaseTotal} size="sm" />}>
                <TransactionCard rows={r.purchases} showDate />
              </Section>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
