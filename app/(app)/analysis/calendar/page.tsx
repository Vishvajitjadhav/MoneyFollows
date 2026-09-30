import type { Metadata } from "next";
import Link from "next/link";
import { getDay } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { BreakdownList } from "@/components/analysis/breakdown";
import { Page, Section } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { TransactionCard } from "@/components/transactions/transaction-list";
import { calculateCategoryTotals } from "@/lib/calculations";
import { findTransactions, getDailyTotals } from "@/lib/data/analytics";
import { eachDay, formatDay, formatMonth, fromISO, isISODate, monthRange, monthStart, shiftMonth, todayISO } from "@/lib/dates";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({ searchParams }: PageProps<"/analysis/calendar">) {
  const sp = await searchParams;
  const today = todayISO();
  const month = monthStart(typeof sp.month === "string" && isISODate(`${sp.month}-01`) ? `${sp.month}-01` : today);
  const range = monthRange(month);
  const day = typeof sp.day === "string" && isISODate(sp.day) && sp.day >= range.from && sp.day <= range.to ? sp.day : null;

  const [daily, dayTx] = await Promise.all([
    getDailyTotals(range.from, range.to),
    day ? findTransactions({ from: day, to: day, limit: 100 }) : Promise.resolve(null),
  ]);
  const byDay = new Map(daily.map((d) => [d.day, d.total]));
  const monthTotal = daily.reduce((s, d) => s + d.total, 0);
  const max = Math.max(1, ...daily.map((d) => d.total));

  const days = eachDay(range);
  const lead = (getDay(fromISO(range.from)) + 6) % 7; // Monday-first grid
  const ym = (iso: string) => iso.slice(0, 7);
  const link = (p: { month?: string; day?: string | null }) => {
    const q = new URLSearchParams();
    if (p.month && p.month !== ym(today)) q.set("month", p.month);
    if (p.day) q.set("day", p.day);
    return `/analysis/calendar${q.size ? `?${q}` : ""}`;
  };

  const dayCats = dayTx ? calculateCategoryTotals(dayTx.rows.map((t) => ({ ...t }))) : [];

  return (
    <Page
      title="Calendar"
      eyebrow={formatMonth(month)}
      action={
        <Link href="/analysis" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Analysis
        </Link>
      }
    >
      <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border bg-card p-3 shadow-card sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <Link href={link({ month: ym(shiftMonth(month, -1)) })} aria-label="Previous month" className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-muted">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="text-center">
              <p className="font-semibold">{formatMonth(month)}</p>
              <p className="text-xs text-muted-foreground">
                Spent <MoneyText amount={monthTotal} size="xs" tone="default" />
              </p>
            </div>
            <Link href={link({ month: ym(shiftMonth(month, 1)) })} aria-label="Next month" className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-muted">
              <ChevronRight className="size-5" />
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] font-medium text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: lead }).map((_, i) => (
              <div key={`lead-${i}`} />
            ))}
            {days.map((d) => {
              const total = byDay.get(d) ?? 0;
              const intensity = total > 0 ? 0.12 + 0.6 * (total / max) : 0;
              const selected = d === day;
              const future = d > today;
              return (
                <Link
                  key={d}
                  href={link({ month: ym(month), day: selected ? null : d })}
                  scroll={false}
                  aria-label={`${formatDay(d)}: ${total > 0 ? `₹${total}` : "no spending"}`}
                  aria-current={selected ? "date" : undefined}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition hover:ring-2 hover:ring-brand/30",
                    selected && "ring-2 ring-brand",
                    future && "text-muted-foreground/50",
                    d === today && "font-bold",
                  )}
                  style={total > 0 ? { background: `color-mix(in oklab, var(--brand) ${Math.round(intensity * 100)}%, var(--card))` } : undefined}
                >
                  <span className={cn(intensity > 0.5 && "text-white")}>{Number(d.slice(8))}</span>
                  {total > 0 && (
                    <span className={cn("money text-[0.6rem] leading-none font-medium", intensity > 0.5 ? "text-white/90" : "text-foreground/70")}>
                      {formatCompact(total)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <aside>
          {day && dayTx ? (
            <Section title={formatDay(day)} action={<MoneyText amount={dayTx.totals.expense} size="md" />}>
              {dayTx.rows.length > 0 ? (
                <div className="space-y-4">
                  {dayCats.length > 1 && (
                    <BreakdownList rows={dayCats.map((c) => ({ ...c, icon: dayTx.rows.find((t) => t.category_id === c.id)?.category_icon, color: dayTx.rows.find((t) => t.category_id === c.id)?.category_color }))} />
                  )}
                  <TransactionCard rows={dayTx.rows} />
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">Nothing recorded on this day.</p>
              )}
            </Section>
          ) : (
            <p className="rounded-2xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Tap a day to see what you spent.
            </p>
          )}
        </aside>
      </div>
    </Page>
  );
}
