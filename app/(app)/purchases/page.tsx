import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { BreakdownList } from "@/components/analysis/breakdown";
import { EmptyState } from "@/components/empty-state";
import { Page, Section } from "@/components/layout/page";
import { StatCard } from "@/components/stat-card";
import { TransactionCard, TransactionsByDay } from "@/components/transactions/transaction-list";
import { calculatePurchaseTotals } from "@/lib/calculations";
import { findTransactions, getCategoryTotals } from "@/lib/data/analytics";
import { monthRange, resolvePeriod, todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage() {
  const today = todayISO();
  const month = monthRange(today);
  const year = resolvePeriod("this-year", {}, today);

  const [yearRows, byCategory] = await Promise.all([
    findTransactions({ purchaseOnly: true, from: year.from, to: year.to, limit: 200 }),
    getCategoryTotals(year.from, year.to, "EXPENSE", true),
  ]);
  const monthRows = yearRows.rows.filter((t) => t.transaction_date >= month.from && t.transaction_date <= month.to);
  const monthTotals = calculatePurchaseTotals(monthRows);
  const largest = [...yearRows.rows].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <Page title="Purchases" description="Things you bought — watches, headphones, shoes. Mark any expense as a purchase when you add it.">
      {yearRows.total === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No purchases yet"
          description="When you add an expense, tap “Purchase” to track the things you buy."
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="This month" amount={monthTotals.total} hint={`${monthTotals.count} ${monthTotals.count === 1 ? "purchase" : "purchases"}`} />
            <StatCard label={`This year · ${year.label}`} amount={yearRows.totals.expense} hint={`${yearRows.total} ${yearRows.total === 1 ? "purchase" : "purchases"}`} />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Largest purchases">
              <TransactionCard rows={largest} showDate />
            </Section>
            <Section title="By category">
              <BreakdownList
                rows={byCategory.map((c) => ({
                  id: c.category_id,
                  name: c.name,
                  icon: c.icon,
                  color: c.color,
                  total: c.total,
                  count: c.count,
                  share: c.share,
                  href: `/history?category=${c.category_id}&purchase=1&from=${year.from}&to=${year.to}`,
                }))}
              />
            </Section>
          </div>

          <Section
            title="Purchase history"
            action={
              <Link href={`/history?purchase=1`} className="text-sm font-medium text-brand-strong hover:underline">
                All purchases
              </Link>
            }
          >
            <TransactionsByDay rows={yearRows.rows.slice(0, 30)} />
          </Section>
        </div>
      )}
    </Page>
  );
}
