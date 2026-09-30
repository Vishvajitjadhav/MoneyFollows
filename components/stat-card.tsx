import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoneyText, type MoneyTone } from "@/components/money-text";

type StatCardProps = {
  label: string;
  amount: number;
  icon?: LucideIcon;
  tone?: MoneyTone;
  /** Coral-tinted hero card, used for the one number that matters most. */
  highlight?: boolean;
  /** Change vs previous period, e.g. { value: 1400, label: "vs Aug", goodWhenUp: false } */
  trend?: { value: number; label?: string; goodWhenUp?: boolean };
  hint?: string;
  size?: "md" | "lg";
  className?: string;
};

export function StatCard({
  label,
  amount,
  icon: Icon,
  tone = "default",
  highlight = false,
  trend,
  hint,
  size = "md",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 shadow-card",
        highlight ? "border-transparent bg-brand text-white" : "bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-lg",
              highlight ? "bg-white/20" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
        <span className={cn("text-sm font-medium", highlight ? "text-white/85" : "text-muted-foreground")}>
          {label}
        </span>
      </div>

      <MoneyText
        amount={amount}
        size={size === "lg" ? "xl" : "lg"}
        tone={highlight ? "default" : tone}
        className={highlight ? "text-white" : undefined}
      />

      {(trend || hint) && (
        <div className={cn("flex items-center gap-1 text-xs", highlight ? "text-white/80" : "text-muted-foreground")}>
          {trend && <TrendBadge {...trend} onBrand={highlight} />}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}

function TrendBadge({
  value,
  label,
  goodWhenUp = true,
  onBrand,
}: {
  value: number;
  label?: string;
  goodWhenUp?: boolean;
  onBrand?: boolean;
}) {
  if (value === 0) return <span>No change{label ? ` ${label}` : ""}</span>;
  const up = value > 0;
  const good = up === goodWhenUp;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        onBrand ? "text-white" : good ? "text-success" : "text-warning",
      )}
    >
      <Icon className="size-3.5" />
      <MoneyText amount={Math.abs(value)} size="xs" tone="default" className="text-inherit" />
      {label && <span className={cn("font-normal", onBrand ? "text-white/80" : "text-muted-foreground")}>{label}</span>}
    </span>
  );
}
