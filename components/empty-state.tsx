import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

/** Friendly empty state, e.g. "No expenses yet. Your first expense takes 5 seconds to add." */
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icon className="size-6" strokeWidth={1.9} />
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
