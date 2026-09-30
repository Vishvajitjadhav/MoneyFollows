import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type PageProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  /** Wide pages (analysis) can use more of a desktop screen. */
  width?: "default" | "wide";
  className?: string;
  children: React.ReactNode;
};

export function Page({ title, eyebrow, description, action, width = "default", className, children }: PageProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-8 md:px-8 md:pt-8",
        width === "wide" ? "max-w-6xl" : "max-w-4xl",
        className,
      )}
    >
      <PageHeader title={title} eyebrow={eyebrow} description={description} action={action} className="mb-6" />
      {children}
    </main>
  );
}

export function Section({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
