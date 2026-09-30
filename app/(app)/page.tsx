import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Sprout, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { StatCard } from "@/components/stat-card";
import { AddButton } from "@/components/transactions/add-button";
import { AutoOpenAdd } from "@/components/transactions/auto-open-add";
import { QuickEntryBar } from "@/components/transactions/quick-entry-bar";
import { TransactionCard } from "@/components/transactions/transaction-list";
import { BudgetBar } from "@/components/budgets/budget-bar";
import { requireUser } from "@/lib/auth";
import { findTransactions, getPeriodTotals, runDueRecurring } from "@/lib/data/analytics";
import { getBudgetsWithUsage } from "@/lib/data/budgets";
import { formatMonth, monthRange, previousRange, todayISO } from "@/lib/dates";
import { formatPercent } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { add } = await searchParams;
  const autoAdd = add === "expense" ? "EXPENSE" : add === "income" ? "INCOME" : add === "investment" ? "INVESTMENT" : null;
  const user = await requireUser();
  const today = todayISO();
  const month = monthRange(today);

  // Create any rent/SIP/Netflix entries that fell due since the last visit.
  await runDueRecurring(today);

  const supabase = await createClient();
  const [totals, prevTotals, todays, recent, budgets, { data: profile }] = await Promise.all([
    getPeriodTotals(month.from, month.to),
    getPeriodTotals(previousRange(month).from, previousRange(month).to),
    findTransactions({ from: today, to: today, type: "EXPENSE", limit: 20 }),
    findTransactions({ limit: 8 }),
    getBudgetsWithUsage(today),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const firstName = profile?.full_name?.split(" ")[0];
  const isEmpty = recent.total === 0;
  const spentChange = prevTotals.expenses > 0 ? totals.expenses - prevTotals.expenses : null;
  const watchBudgets = budgets.filter((b) => b.usage.status !== "ok").slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-8 md:px-8 md:pt-8">
      {autoAdd && <AutoOpenAdd type={autoAdd} />}
      {/* Header */}
      <header className="mb-5 flex items-center justify-between md:mb-7">
        <div>
          <div className="mb-3 md:hidden">
            <Logo size="sm" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {firstName ? `Hi ${firstName} · ` : ""}
            {formatMonth(today, "MMMM")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your month so far</h1>
        </div>
        <AddButton size="lg" className="hidden rounded-xl md:inline-flex" />
      </header>

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Income" amount={totals.income} icon={ArrowDownLeft} tone="income" />
        <StatCard
          label="Spent"
          amount={totals.expenses}
          icon={ArrowUpRight}
          trend={spentChange !== null ? { value: spentChange, label: `vs ${formatMonth(previousRange(month).from, "MMM")}`, goodWhenUp: false } : undefined}
        />
        <StatCard label="Invested" amount={totals.investments} icon={Sprout} tone="invest" />
        <StatCard
          label="Remaining"
          amount={totals.remaining}
          icon={Wallet}
          highlight
          hint={totals.income > 0 ? `${formatPercent(Math.max(totals.remaining, 0) / totals.income)} of income left` : undefined}
        />
      </div>

      {/* Primary action */}
      <div className="mt-4 space-y-3 md:hidden">
        <AddButton size="xl" className="w-full rounded-2xl shadow-float" label="Add Expense" />
        <QuickEntryBar />
      </div>

      {isEmpty ? (
        <EmptyState
          className="mt-8"
          title="No expenses yet"
          description="Your first expense takes 5 seconds to add. Tap +, type the amount, pick a category — done."
          action={<AddButton label="Add your first expense" />}
        />
      ) : (
        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_360px]">
          <div className="space-y-7">
            <Section
              title="Today's spending"
              action={todays.total > 0 && <MoneyText amount={todays.totals.expense} size="sm" />}
            >
              {todays.rows.length > 0 ? (
                <TransactionCard rows={todays.rows} />
              ) : (
                <p className="rounded-2xl border border-dashed bg-card px-4 py-5 text-center text-sm text-muted-foreground">
                  Nothing spent today. Nice.
                </p>
              )}
            </Section>

            <Section
              title="Recent activity"
              action={
                <Link href="/history" className="inline-flex items-center text-sm font-medium text-brand-strong hover:underline">
                  See all <ChevronRight className="size-4" />
                </Link>
              }
            >
              <TransactionCard rows={recent.rows} showDate />
            </Section>
          </div>

          <aside className="space-y-7">
            <div className="hidden md:block">
              <Section title="Quick add">
                <QuickEntryBar />
              </Section>
            </div>
            {watchBudgets.length > 0 && (
              <Section
                title="Budgets to watch"
                action={
                  <Link href="/budgets" className="text-sm font-medium text-brand-strong hover:underline">
                    All budgets
                  </Link>
                }
              >
                <div className="space-y-2">
                  {watchBudgets.map((b) => (
                    <BudgetBar key={b.id} budget={b} compact />
                  ))}
                </div>
              </Section>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
