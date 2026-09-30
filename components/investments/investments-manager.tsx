"use client";

import { useState } from "react";
import { Plus, Sprout } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { AmountInput, Field, FormSheet, Select } from "@/components/form-sheet";
import { MoneyText } from "@/components/money-text";
import { useTransactionSheet } from "@/components/transactions/transaction-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteInvestment, saveInvestment } from "@/lib/actions/planning";
import { formatShortDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Enums, Tables } from "@/types/database";

type InvestmentRow = Pick<Tables<"investments">, "id" | "name" | "type" | "amount" | "frequency" | "start_date" | "end_date" | "notes" | "active">;
type InvType = Enums<"investment_type">;
type InvFreq = Enums<"investment_frequency">;

export const INVESTMENT_TYPES: { value: InvType; label: string; icon: string; color: string }[] = [
  { value: "SIP", label: "SIP", icon: "sip", color: "indigo" },
  { value: "MUTUAL_FUND", label: "Mutual Fund", icon: "mutual-fund", color: "violet" },
  { value: "STOCKS", label: "Stocks", icon: "stocks", color: "green" },
  { value: "PPF", label: "PPF", icon: "ppf", color: "blue" },
  { value: "FD", label: "FD", icon: "fd", color: "teal" },
  { value: "OTHER", label: "Other", icon: "other", color: "slate" },
];
const FREQS: { value: InvFreq; label: string }[] = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "DAILY", label: "Daily" },
];

type Draft = { id?: string; name: string; type: InvType; amount: string; frequency: InvFreq; startDate: string; endDate: string; notes: string; autoRecord: boolean };

export function InvestmentsManager({ items }: { items: InvestmentRow[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const { openAdd, categories } = useTransactionSheet();

  const recordNow = (inv: InvestmentRow) => {
    const meta = INVESTMENT_TYPES.find((t) => t.value === inv.type)!;
    const cat = categories.find((c) => c.type === "INVESTMENT" && c.icon === meta.icon);
    openAdd({ type: "INVESTMENT", amount: Number(inv.amount), categoryId: cat?.id ?? null, description: inv.name });
  };

  return (
    <>
      <Button
        onClick={() => {
          setDraft({ name: "", type: "SIP", amount: "", frequency: "MONTHLY", startDate: todayISO(), endDate: "", notes: "", autoRecord: true });
          setOpen(true);
        }}
      >
        <Plus /> Add investment
      </Button>

      {items.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Sprout}
          title="No investments yet"
          description="Add your SIPs, PPF or FDs to see how much you put away every month."
        />
      ) : (
        <ul className="mt-5 divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
          {items.map((inv) => {
            const meta = INVESTMENT_TYPES.find((t) => t.value === inv.type)!;
            return (
              <li key={inv.id} className={cn("flex items-center gap-3 px-4 py-3", !inv.active && "opacity-60")}>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    setDraft({
                      id: inv.id,
                      name: inv.name,
                      type: inv.type,
                      amount: String(inv.amount),
                      frequency: inv.frequency,
                      startDate: inv.start_date,
                      endDate: inv.end_date ?? "",
                      notes: inv.notes ?? "",
                      autoRecord: false,
                    });
                    setOpen(true);
                  }}
                >
                  <CategoryIcon icon={meta.icon} color={meta.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{inv.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {meta.label} · {FREQS.find((f) => f.value === inv.frequency)?.label} · since {formatShortDate(inv.start_date)}
                    </span>
                  </span>
                  <MoneyText amount={Number(inv.amount)} size="sm" tone="invest" />
                </button>
                <Button variant="soft" size="sm" onClick={() => recordNow(inv)}>
                  Record
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {draft && (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title={draft.id ? "Edit investment" : "New investment"}
          successMessage="Investment saved."
          onSubmit={() => saveInvestment(draft.id ?? null, { ...draft, endDate: draft.endDate || null })}
          onDelete={draft.id ? () => deleteInvestment(draft.id!) : undefined}
          deleteLabel="this investment (recorded amounts stay)"
        >
          <Field label="Name" htmlFor="i-name">
            <Input id="i-name" value={draft.name} placeholder="e.g. Nifty 50 Index SIP" maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" htmlFor="i-type">
              <Select id="i-type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as InvType })}>
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Frequency" htmlFor="i-freq">
              <Select id="i-freq" value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value as InvFreq })}>
                {FREQS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Amount" htmlFor="i-amt">
            <AmountInput id="i-amt" value={draft.amount} onChange={(amount) => setDraft({ ...draft, amount })} placeholder="10000" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor="i-start">
              <Input id="i-start" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label="End date (optional)" htmlFor="i-end">
              <Input id="i-end" type="date" min={draft.startDate} value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="i-notes">
            <Textarea id="i-notes" value={draft.notes} maxLength={1000} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
          {!draft.id && draft.frequency !== "QUARTERLY" && (
            <label className="flex items-start justify-between gap-4 rounded-xl border bg-card px-3.5 py-3">
              <span>
                <span className="block text-sm font-medium">Record it automatically</span>
                <span className="block text-xs text-muted-foreground">
                  {draft.frequency === "ONE_TIME" ? "Adds it to this month's invested total." : "Adds each instalment to your invested total when it's due."}
                </span>
              </span>
              <Switch checked={draft.autoRecord} onCheckedChange={(v) => setDraft({ ...draft, autoRecord: v })} />
            </label>
          )}
        </FormSheet>
      )}
    </>
  );
}
