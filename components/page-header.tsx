import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  /** Small label above the title, e.g. the current month. */
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, eyebrow, description, action, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
