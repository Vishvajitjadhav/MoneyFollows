import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { BudgetsManager } from "@/components/budgets/budgets-manager";
import { EmptyState } from "@/components/empty-state";
import { Page } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { Progress } from "@/components/ui/progress";
import { calculateBudgetUsage } from "@/lib/calculations";
import { getBudgetsWithUsage } from "@/lib/data/budgets";
import { getCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";
import { formatMonth, isISODate, monthStart, shiftMonth, todayISO } from "@/lib/dates";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage({ searchParams }: PageProps<"/budgets">) {
  const sp = await searchParams;
  const today = todayISO();
  const month = monthStart(typeof sp.month === "string" && isISODate(`${sp.month}-01`) ? `${sp.month}-01` : today);
  const supabase = await createClient();
  const [budgets, categories, { count: prevCount }] = await Promise.all([
    getBudgetsWithUsage(month),
    getCategories(),
    supabase.from("budgets").select("id", { count: "exact", head: true }).eq("month", shiftMonth(month, -1)),
  ]);

  const total = calculateBudgetUsage(
    budgets.reduce((s, b) => s + b.usage.budget, 0),
    budgets.reduce((s, b) => s + b.usage.used, 0),
  );
  const nav = (m: string) => `/budgets${m.slice(0, 7) === today.slice(0, 7) ? "" : `?month=${m.slice(0, 7)}`}`;

  return (
    <Page
      title="Budgets"
      eyebrow={formatMonth(month)}
      action={
        <div className="flex gap-1">
          <Link href={nav(shiftMonth(month, -1))} aria-label="Previous month" className="inline-flex size-10 items-center justify-center rounded-xl border bg-card hover:bg-muted">
            <ChevronLeft className="size-4" />
          </Link>
          <Link href={nav(shiftMonth(month, 1))} aria-label="Next month" className="inline-flex size-10 items-center justify-center rounded-xl border bg-card hover:bg-muted">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      }
    >
      {budgets.length > 0 && (
        <div className="mb-5 rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Spent of total budget</p>
              <p>
                <MoneyText amount={total.used} size="xl" /> <span className="text-muted-foreground">/ </span>
                <MoneyText amount={total.budget} size="lg" tone="muted" />
              </p>
            </div>
            <p className="text-sm font-semibold">{formatPercent(total.ratio)}</p>
          </div>
          <Progress
            value={Math.min(total.ratio * 100, 100)}
            className="mt-3 h-2.5"
            indicatorClassName={total.status === "over" ? "bg-destructive" : total.status === "warning" ? "bg-warning" : "bg-success"}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {total.remaining >= 0 ? (
              <>
                <MoneyText amount={total.remaining} size="sm" tone="default" /> left this month
              </>
            ) : (
              <>
                <MoneyText amount={-total.remaining} size="sm" tone="warning" /> over budget
              </>
            )}
          </p>
        </div>
      )}

      <BudgetsManager month={month} budgets={budgets} categories={categories} canCopy={(prevCount ?? 0) > 0} />

      {budgets.length === 0 && (
        <EmptyState
          className="mt-5"
          icon={Target}
          title="No budgets for this month"
          description="Set a monthly limit for Food, Shopping or anything else. We'll nudge you at 80%."
        />
      )}
    </Page>
  );
}
