import { MoneyText } from "@/components/money-text";
import { formatDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TransactionView } from "@/types/app";
import { TransactionRow } from "./transaction-row";

/** Flat card of rows (Home, drill-downs). */
export function TransactionCard({ rows, showDate, className }: { rows: TransactionView[]; showDate?: boolean; className?: string }) {
  return (
    <div className={cn("divide-y overflow-hidden rounded-2xl border bg-card shadow-card", className)}>
      {rows.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} showDate={showDate} />
      ))}
    </div>
  );
}

/** Rows grouped by day with a per-day spend total (History). */
export function TransactionsByDay({ rows }: { rows: TransactionView[] }) {
  const days = new Map<string, TransactionView[]>();
  for (const r of rows) days.set(r.transaction_date, [...(days.get(r.transaction_date) ?? []), r]);

  return (
    <div className="space-y-5">
      {[...days.entries()].map(([day, list]) => {
        const spent = list.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
        return (
          <section key={day} aria-label={formatDay(day)}>
            <header className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-sm font-semibold">{formatDay(day)}</h3>
              {spent > 0 && (
                <span className="text-xs text-muted-foreground">
                  Spent <MoneyText amount={spent} size="xs" tone="default" />
                </span>
              )}
            </header>
            <TransactionCard rows={list} />
          </section>
        );
      })}
    </div>
  );
}
