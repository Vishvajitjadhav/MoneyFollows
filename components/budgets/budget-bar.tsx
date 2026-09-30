import { CategoryIcon } from "@/components/category-icon";
import { MoneyText } from "@/components/money-text";
import { Progress } from "@/components/ui/progress";
import type { BudgetWithUsage } from "@/lib/data/budgets";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE = {
  ok: { bar: "bg-success", text: "text-muted-foreground" },
  warning: { bar: "bg-warning", text: "text-warning" },
  over: { bar: "bg-destructive", text: "text-destructive" },
} as const;

export function BudgetBar({ budget, compact = false, className }: { budget: BudgetWithUsage; compact?: boolean; className?: string }) {
  const { usage } = budget;
  const tone = TONE[usage.status];

  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={budget.icon} color={budget.color} size={compact ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{budget.name}</p>
            <p className={cn("text-xs font-semibold", tone.text)}>{formatPercent(usage.ratio)} used</p>
          </div>
          <Progress
            value={Math.min(usage.ratio * 100, 100)}
            className="mt-2 h-2"
            indicatorClassName={tone.bar}
            aria-label={`${budget.name} budget used`}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>
              <MoneyText amount={usage.used} size="xs" tone="default" /> of <MoneyText amount={usage.budget} size="xs" tone="muted" />
            </span>
            <span>
              {usage.remaining >= 0 ? "Left " : "Over by "}
              <MoneyText amount={Math.abs(usage.remaining)} size="xs" tone={usage.remaining >= 0 ? "default" : "warning"} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
