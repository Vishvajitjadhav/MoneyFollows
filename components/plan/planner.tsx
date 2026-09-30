"use client";

import { useMemo, useState, useTransition } from "react";
import { Info, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AmountInput, Field } from "@/components/form-sheet";
import { MoneyText } from "@/components/money-text";
import { Button } from "@/components/ui/button";
import { savePlan } from "@/lib/actions/planning";
import { safeAction } from "@/lib/safe-action";
import { allocationAmounts, allocationTotal, BUCKETS, suggestAllocation, type Allocation, type BucketKey, type PlanInputs } from "@/lib/calculations/plan";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLORS: Record<BucketKey, string> = {
  needs: "var(--chart-2)",
  family: "var(--brand)",
  investments: "var(--invest)",
  savings: "var(--success)",
  lifestyle: "var(--chart-5)",
  flexible: "var(--muted-foreground)",
};

type Props = { month: string; initialInputs: PlanInputs; initialAllocation: Allocation | null };

const INPUTS: { key: keyof PlanInputs; label: string; hint?: string }[] = [
  { key: "income", label: "Monthly income", hint: "Take-home pay plus regular side income" },
  { key: "rent", label: "Rent" },
  { key: "emi", label: "Debt / EMI" },
  { key: "familySupport", label: "Family support" },
  { key: "investments", label: "Investments (SIPs)" },
  { key: "goals", label: "Monthly towards goals" },
];

export function Planner({ month, initialInputs, initialAllocation }: Props) {
  const [inputs, setInputs] = useState<Record<keyof PlanInputs, string>>(() =>
    Object.fromEntries(Object.entries(initialInputs).map(([k, v]) => [k, v ? String(Math.round(v)) : ""])) as Record<keyof PlanInputs, string>,
  );
  const numeric = useMemo(
    () => Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, Number(v) || 0])) as PlanInputs,
    [inputs],
  );
  const suggested = useMemo(() => suggestAllocation(numeric), [numeric]);
  const [custom, setCustom] = useState<Allocation | null>(initialAllocation);
  const allocation = custom ?? suggested;
  const total = allocationTotal(allocation);
  const rows = allocationAmounts(numeric.income, allocation);
  const [pending, start] = useTransition();

  const setPct = (key: BucketKey, value: number) => setCustom({ ...allocation, [key]: Math.max(0, Math.min(100, Math.round(value))) });

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-card" aria-label="Your numbers">
        <h2 className="font-semibold">Your numbers</h2>
        {INPUTS.map((i) => (
          <Field key={i.key} label={i.label} htmlFor={`p-${i.key}`} hint={i.hint}>
            <AmountInput id={`p-${i.key}`} value={inputs[i.key]} onChange={(v) => setInputs({ ...inputs, [i.key]: v })} />
          </Field>
        ))}
      </section>

      <section className="space-y-5" aria-label="Suggested allocation">
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            This is a <strong>general starting point</strong>, not financial advice. Your commitments are covered first, then the rest is split
            between investing, saving and living. Adjust the percentages to fit your life.
          </p>
        </div>

        {numeric.income > 0 ? (
          <>
            {/* Stacked bar */}
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Allocation bar">
              {rows.filter((r) => r.pct > 0).map((r) => (
                <div key={r.key} style={{ width: `${(r.pct / Math.max(total, 100)) * 100}%`, background: COLORS[r.key] }} />
              ))}
            </div>

            <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-3 px-4 py-3">
                  <span className="size-3 shrink-0 rounded-[4px]" style={{ background: COLORS[r.key] }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{r.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.hint}</p>
                  </div>
                  <MoneyText amount={r.amount} size="sm" className="w-24 text-right" />
                  <label className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      value={r.pct}
                      aria-label={`${r.label} percent`}
                      onChange={(e) => setPct(r.key, Number(e.target.value))}
                      className="money h-10 w-14 rounded-lg border bg-card text-center text-sm outline-none focus-visible:border-brand"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={cn("text-sm font-medium", total === 100 ? "text-success" : "text-warning")}>
                {total === 100 ? "Adds up to 100% ✓" : `Adds up to ${total}% — ${total > 100 ? "reduce" : "add"} ${Math.abs(100 - total)}% (${formatINR(Math.abs(((100 - total) * numeric.income) / 100))})`}
              </p>
              <div className="flex gap-2">
                {custom && (
                  <Button variant="outline" onClick={() => setCustom(null)}>
                    <RotateCcw /> Use suggestion
                  </Button>
                )}
                <Button
                  disabled={pending || total !== 100}
                  onClick={() =>
                    start(async () => {
                      const r = await safeAction(() => savePlan({ month, monthlyIncome: numeric.income, inputs: { rent: numeric.rent, emi: numeric.emi, familySupport: numeric.familySupport, investments: numeric.investments, goals: numeric.goals }, allocations: allocation }));
                      if (r.ok) toast.success("Plan saved for this month.");
                      else toast.error(r.error);
                    })
                  }
                >
                  {pending ? <LoaderCircle className="animate-spin" /> : <Save />} Save plan
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Enter your monthly income to see a suggested split.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Buckets: {BUCKETS.map((b) => b.label).join(" · ")}. Nothing here is guaranteed; markets and personal situations vary. For advice, talk to a
          registered financial adviser.
        </p>
      </section>
    </div>
  );
}
