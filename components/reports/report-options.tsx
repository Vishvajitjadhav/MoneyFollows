"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Range = { from: string; to: string };
type Props = { current: Range & { label: string }; previous: Range & { label: string } };

export function ReportOptions({ current, previous }: Props) {
  const [choice, setChoice] = useState<"current" | "previous" | "custom">("current");
  const [custom, setCustom] = useState<Range>({ from: previous.from, to: current.to });
  const range = choice === "current" ? current : choice === "previous" ? previous : custom;
  const valid = Boolean(range.from && range.to && range.from <= range.to);
  const qs = `from=${range.from}&to=${range.to}`;

  const options = [
    { value: "current", label: "Current month", hint: current.label },
    { value: "previous", label: "Previous month", hint: previous.label },
    { value: "custom", label: "Custom range", hint: "Pick dates" },
  ] as const;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Report period" className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={choice === o.value}
            onClick={() => setChoice(o.value)}
            className={cn(
              "rounded-2xl border bg-card px-4 py-3 text-left shadow-card transition",
              choice === o.value && "border-brand bg-brand-soft",
            )}
          >
            <span className={cn("block text-sm font-semibold", choice === o.value && "text-brand-strong")}>{o.label}</span>
            <span className="block text-xs text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>

      {choice === "custom" && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="r-from">From</Label>
            <Input id="r-from" type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r-to">To</Label>
            <Input id="r-to" type="date" min={custom.from} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <FileDown className="size-6 text-brand" />
          <p className="mt-3 font-semibold">PDF report</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A designed summary: totals, savings rate, categories, family support, top expenses, purchases and month-over-month.
          </p>
          <Button asChild className="mt-4 w-full" disabled={!valid} aria-disabled={!valid}>
            <a href={valid ? `/api/reports/pdf?${qs}` : undefined}>Download PDF</a>
          </Button>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <FileSpreadsheet className="size-6 text-success" />
          <p className="mt-3 font-semibold">CSV export</p>
          <p className="mt-1 text-sm text-muted-foreground">Every transaction in the period — opens in Excel, Google Sheets or Numbers.</p>
          <Button asChild variant="outline" className="mt-4 w-full" disabled={!valid} aria-disabled={!valid}>
            <a href={valid ? `/api/export/csv?${qs}` : undefined} download>
              Download CSV
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
