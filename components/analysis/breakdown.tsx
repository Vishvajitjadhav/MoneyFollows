import Link from "next/link";
import { ChevronRight, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { CategoryIcon, getCategoryColor } from "@/components/category-icon";
import { MoneyText } from "@/components/money-text";
import type { CategoryChange } from "@/lib/calculations";
import { formatINR, formatPercent } from "@/lib/format";
import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

type Row = { id: string | null; name: string; icon?: string; color?: string; total: number; count: number; share: number; href?: string };

/** Ranked list with proportional bars — the category chart *and* its table view. */
export function BreakdownList({ rows, emptyText = "Nothing here yet." }: { rows: Row[]; emptyText?: string }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => r.total));

  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
      {rows.map((r) => {
        const inner = (
          <>
            {r.icon && <CategoryIcon icon={r.icon} color={r.color} size="sm" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold">{r.name}</span>
                <MoneyText amount={r.total} size="sm" />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max((r.total / max) * 100, 2)}%`, background: r.color ? getCategoryColor(r.color).solid : "var(--brand)" }}
                  />
                </div>
                <span className="w-24 text-right text-xs text-muted-foreground">
                  {formatPercent(r.share)} · {r.count}×
                </span>
              </div>
            </div>
            {r.href && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
          </>
        );
        return (
          <li key={r.id ?? r.name}>
            {r.href ? (
              <Link href={r.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60">
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Month-over-month per category. Spend going up is flagged amber, down green. */
export function ComparisonList({ rows, previousLabel }: { rows: CategoryChange[]; previousLabel: string }) {
  const shown = rows.filter((r) => r.current > 0 || r.previous > 0).slice(0, 8);
  if (shown.length === 0) return null;
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
      {shown.map((r) => {
        const up = r.change > 0;
        const Icon = up ? TrendingUp : TrendingDown;
        return (
          <li key={r.name} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatINR(r.previous)} in {previousLabel}
              </p>
            </div>
            <div className="text-right">
              <MoneyText amount={r.current} size="sm" />
              {r.change !== 0 && (
                <p className={cn("flex items-center justify-end gap-1 text-xs font-medium", up ? "text-warning" : "text-success")}>
                  <Icon className="size-3.5" />
                  {up ? "+" : "−"}
                  {formatINR(Math.abs(r.change))}
                  {r.changePct !== null && ` (${formatPercent(Math.abs(r.changePct))})`}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <ul className="space-y-2">
      {insights.map((i) => (
        <li key={i.id} className="flex items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-sm shadow-card">
          <span
            className={cn(
              "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg",
              i.tone === "warning" ? "bg-warning-soft text-warning" : i.tone === "good" ? "bg-success-soft text-success" : "bg-brand-soft text-brand",
            )}
          >
            <Lightbulb className="size-3.5" />
          </span>
          <span>{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "income" | "invest" | "brand" }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className={cn("mt-1 text-xl", tone === "income" && "text-income", tone === "invest" && "text-invest", tone === "brand" && "text-brand")}>{value}</div>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
