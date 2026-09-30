import { cn } from "@/lib/utils";
import { formatINR, type FormatINROptions } from "@/lib/format";

const SIZES = {
  xs: "text-xs money",
  sm: "text-sm money",
  md: "text-base money",
  lg: "text-xl money tracking-tight",
  xl: "text-3xl money font-bold tracking-tight",
  hero: "money-hero",
} as const;

const TONES = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  income: "text-income",
  expense: "text-expense",
  invest: "text-invest",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
} as const;

export type MoneyTone = keyof typeof TONES;

type MoneyTextProps = FormatINROptions & {
  amount: number;
  size?: keyof typeof SIZES;
  tone?: MoneyTone;
  className?: string;
};

/** Renders a rupee amount with tabular figures so amounts line up in lists. */
export function MoneyText({
  amount,
  size = "md",
  tone = "default",
  className,
  ...format
}: MoneyTextProps) {
  return (
    <span className={cn(SIZES[size], TONES[tone], "whitespace-nowrap", className)}>
      {formatINR(amount, format)}
    </span>
  );
}
