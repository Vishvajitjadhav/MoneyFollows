"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERIODS, type PeriodKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Time filter for analysis pages: preset chips + custom range. Lives in the URL. */
export function PeriodPicker({
  period,
  from,
  to,
  basePath,
}: {
  period: PeriodKey;
  from?: string;
  to?: string;
  basePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const [showCustom, setShowCustom] = useState(period === "custom");

  const go = (qs: string) => startTransition(() => router.push(`${basePath}${qs}`, { scroll: false }));

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {PERIODS.map((p) => {
          const active = p.value === "custom" ? showCustom : !showCustom && period === p.value;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (p.value === "custom") return setShowCustom(true);
                setShowCustom(false);
                go(p.value === "this-month" ? "" : `?period=${p.value}`);
              }}
              className={cn(
                "h-9 shrink-0 rounded-full border bg-card px-4 text-sm font-medium transition",
                active && "border-brand bg-brand-soft text-brand-strong",
              )}
            >
              {p.label}
            </button>
          );
        })}
        {pending && <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />}
      </div>
      {showCustom && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (customFrom && customTo) go(`?period=custom&from=${customFrom}&to=${customTo}`);
          }}
        >
          <Input type="date" aria-label="From" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-auto" />
          <Input type="date" aria-label="To" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="w-auto" />
          <Button type="submit" disabled={!customFrom || !customTo || customFrom > customTo}>
            Apply
          </Button>
        </form>
      )}
    </div>
  );
}
