import { notFound } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Sprout, Wallet } from "lucide-react";
import { BreakdownList, InsightList } from "@/components/analysis/breakdown";
import { BudgetBar } from "@/components/budgets/budget-bar";
import { IncomeExpenseChart, SpendingTrendChart } from "@/components/charts";
import { Logo } from "@/components/brand/logo";
import { BottomNav, Sidebar } from "@/components/layout/app-nav";
import { Section } from "@/components/layout/page";
import { StatCard } from "@/components/stat-card";
import { AddButton } from "@/components/transactions/add-button";
import { QuickEntryBar } from "@/components/transactions/quick-entry-bar";
import { TransactionCard, TransactionsByDay } from "@/components/transactions/transaction-list";
import { TransactionSheetProvider } from "@/components/transactions/transaction-sheet";
import { calculateBudgetUsage } from "@/lib/calculations";
import { sampleCategories, sampleReport, sampleTransactions } from "@/lib/dev/sample-data";
import { formatPercent } from "@/lib/format";

/** DEV ONLY: the real app components with sample data (saving is disabled without Supabase). */
export default function AppPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const r = sampleReport();
  const today = sampleTransactions.filter((t) => t.transaction_date === "2026-09-30");
  const food = sampleCategories.find((c) => c.name === "Food")!;
  const budgets = [
    { id: "b1", categoryId: food.id, name: "Food", icon: "food", color: "orange", usage: calculateBudgetUsage(2300, 1870) },
    { id: "b2", categoryId: "x", name: "Shopping", icon: "shopping", color: "violet", usage: calculateBudgetUsage(10000, 13499) },
  ];

  return (
    <TransactionSheetProvider categories={sampleCategories} customFields={[]}>
      <div className="flex min-h-dvh flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-8 md:px-8 md:pt-8">
            <header className="mb-5 flex items-center justify-between md:mb-7">
              <div>
                <div className="mb-3 md:hidden">
                  <Logo size="sm" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Hi Asha · September</p>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your month so far</h1>
              </div>
              <AddButton size="lg" className="hidden rounded-xl md:inline-flex" />
            </header>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Income" amount={r.totals.income} icon={ArrowDownLeft} tone="income" />
              <StatCard label="Spent" amount={r.totals.expenses} icon={ArrowUpRight} trend={{ value: r.comparison.expenses.change, label: "vs Aug", goodWhenUp: false }} />
              <StatCard label="Invested" amount={r.totals.investments} icon={Sprout} tone="invest" />
              <StatCard label="Remaining" amount={r.totals.remaining} icon={Wallet} highlight hint={`${formatPercent(r.totals.remaining / r.totals.income)} of income left`} />
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              <AddButton size="xl" className="w-full rounded-2xl shadow-float" label="Add Expense" />
              <QuickEntryBar />
            </div>

            <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_360px]">
              <div className="space-y-7">
                <Section title="Today's spending">
                  <TransactionCard rows={today} />
                </Section>
                <Section title="Recent activity">
                  <TransactionsByDay rows={sampleTransactions.slice(3, 10)} />
                </Section>
                <Section title="Where your money went">
                  <BreakdownList rows={r.categories.map((c) => ({ id: c.category_id, name: c.name, icon: c.icon, color: c.color, total: c.total, count: c.count, share: c.share, href: "#" }))} />
                </Section>
              </div>
              <aside className="space-y-7">
                <div className="hidden md:block">
                  <Section title="Quick add">
                    <QuickEntryBar />
                  </Section>
                </div>
                <Section title="Budgets to watch">
                  <div className="space-y-2">
                    {budgets.map((b) => (
                      <BudgetBar key={b.id} budget={b} compact />
                    ))}
                  </div>
                </Section>
                <Section title="Insights">
                  <InsightList insights={r.insights} />
                </Section>
                <Section title="Income vs expense">
                  <div className="rounded-2xl border bg-card p-4 shadow-card">
                    <IncomeExpenseChart data={r.months} />
                  </div>
                </Section>
                <Section title="Spending trend">
                  <div className="rounded-2xl border bg-card p-4 shadow-card">
                    <SpendingTrendChart data={r.months} />
                  </div>
                </Section>
              </aside>
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
    </TransactionSheetProvider>
  );
}
