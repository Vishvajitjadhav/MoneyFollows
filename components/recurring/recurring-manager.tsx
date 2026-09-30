"use client";

import { useState, useTransition } from "react";
import { Pause, Play, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { AmountInput, Field, FormSheet, Select } from "@/components/form-sheet";
import { MoneyText } from "@/components/money-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteRecurring, saveRecurring, setRecurringActive } from "@/lib/actions/planning";
import { safeAction } from "@/lib/safe-action";
import { formatShortDate, todayISO } from "@/lib/dates";
import { FREQUENCY_LABEL, type Frequency } from "@/lib/recurrence";
import { cn } from "@/lib/utils";
import type { Category, TransactionType } from "@/types/app";
import type { Tables } from "@/types/database";

export type RecurringRow = Pick<
  Tables<"recurring_transactions">,
  "id" | "type" | "amount" | "category_id" | "subcategory_id" | "description" | "frequency" | "start_date" | "end_date" | "next_run_date" | "is_purchase" | "active"
>;

type Draft = {
  id?: string;
  type: TransactionType;
  amount: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  isPurchase: boolean;
};

const QUICK = [
  { label: "Rent", cat: "housing", sub: "Rent" },
  { label: "Gym", cat: "lifestyle", sub: "Gym" },
  { label: "Netflix", cat: "entertainment", sub: "OTT", description: "Netflix" },
  { label: "Internet", cat: "bills", sub: "Internet" },
  { label: "Insurance", cat: "bills", sub: "Insurance", frequency: "YEARLY" as Frequency },
  { label: "SIP", cat: "sip", type: "INVESTMENT" as TransactionType },
];

export function RecurringManager({ items, categories }: { items: RecurringRow[]; categories: Category[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();

  const byId = new Map(categories.map((c) => [c.id, c]));
  const blank = (over: Partial<Draft> = {}): Draft => ({
    type: "EXPENSE",
    amount: "",
    categoryId: "",
    subcategoryId: "",
    description: "",
    frequency: "MONTHLY",
    startDate: todayISO(),
    endDate: "",
    isPurchase: false,
    ...over,
  });

  const openQuick = (q: (typeof QUICK)[number]) => {
    const type = q.type ?? "EXPENSE";
    const cat = categories.find((c) => c.type === type && c.icon === q.cat);
    const sub = cat?.subcategories.find((s) => s.name === q.sub);
    setDraft(blank({ type, categoryId: cat?.id ?? "", subcategoryId: sub?.id ?? "", description: q.description ?? "", frequency: q.frequency ?? "MONTHLY" }));
    setOpen(true);
  };

  const cats = draft ? categories.filter((c) => c.type === draft.type) : [];
  const subs = draft ? (byId.get(draft.categoryId)?.subcategories ?? []) : [];
  const perMonth = items.filter((i) => i.active && i.type === "EXPENSE" && i.frequency === "MONTHLY").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setDraft(blank());
            setOpen(true);
          }}
        >
          <Plus /> Add recurring
        </Button>
        {QUICK.map((q) => (
          <Button key={q.label} variant="outline" size="sm" className="h-11 md:h-9" onClick={() => openQuick(q)}>
            {q.label}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Repeat}
          title="Nothing recurring yet"
          description="Add rent, gym or a SIP once — MoneyFollows records it for you every time it's due."
        />
      ) : (
        <>
          {perMonth > 0 && (
            <p className="mt-5 text-sm text-muted-foreground">
              Fixed monthly expenses: <MoneyText amount={perMonth} size="sm" tone="default" />
            </p>
          )}
          <ul className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
            {items.map((r) => {
              const cat = byId.get(r.category_id);
              const sub = cat?.subcategories.find((s) => s.id === r.subcategory_id);
              return (
                <li key={r.id} className={cn("flex items-center gap-3 px-4 py-3", !r.active && "opacity-60")}>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => {
                      setDraft({
                        id: r.id,
                        type: r.type,
                        amount: String(r.amount),
                        categoryId: r.category_id,
                        subcategoryId: r.subcategory_id ?? "",
                        description: r.description ?? "",
                        frequency: r.frequency,
                        startDate: r.start_date,
                        endDate: r.end_date ?? "",
                        isPurchase: r.is_purchase,
                      });
                      setOpen(true);
                    }}
                  >
                    <CategoryIcon icon={cat?.icon} color={cat?.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.description || sub?.name || cat?.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {FREQUENCY_LABEL[r.frequency]} · {r.active ? `next ${formatShortDate(r.next_run_date)}` : r.end_date && r.end_date < todayISO() ? "ended" : "paused"}
                      </span>
                    </span>
                    <MoneyText amount={Number(r.amount)} size="sm" tone={r.type === "INCOME" ? "income" : r.type === "INVESTMENT" ? "invest" : "default"} />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={r.active ? "Pause" : "Resume"}
                    onClick={() =>
                      start(async () => {
                        const res = await safeAction(() => setRecurringActive(r.id, !r.active));
                        if (res.ok) toast.success(r.active ? "Paused." : "Resumed.");
                        else toast.error(res.error);
                      })
                    }
                  >
                    {r.active ? <Pause /> : <Play />}
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {draft && (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title={draft.id ? "Edit recurring" : "New recurring"}
          description="Recorded automatically each time it's due."
          successMessage="Recurring saved."
          onSubmit={() =>
            saveRecurring(draft.id ?? null, {
              ...draft,
              subcategoryId: draft.subcategoryId || null,
              endDate: draft.endDate || null,
            })
          }
          onDelete={draft.id ? () => deleteRecurring(draft.id!) : undefined}
          deleteLabel="this recurring item (past entries stay)"
        >
          <div role="radiogroup" aria-label="Type" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
            {(["EXPENSE", "INCOME", "INVESTMENT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={draft.type === t}
                onClick={() => setDraft({ ...draft, type: t, categoryId: "", subcategoryId: "" })}
                className={cn("h-10 rounded-xl text-sm font-semibold text-muted-foreground", draft.type === t && "bg-card text-foreground shadow-sm")}
              >
                {t[0] + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <Field label="Amount" htmlFor="r-amt">
            <AmountInput id="r-amt" value={draft.amount} onChange={(amount) => setDraft({ ...draft, amount })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" htmlFor="r-cat">
              <Select id="r-cat" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value, subcategoryId: "" })}>
                <option value="">Choose…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subcategory" htmlFor="r-sub">
              <Select id="r-sub" value={draft.subcategoryId} disabled={subs.length === 0} onChange={(e) => setDraft({ ...draft, subcategoryId: e.target.value })}>
                <option value="">—</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Name" htmlFor="r-desc">
            <Input id="r-desc" value={draft.description} placeholder="e.g. Flat rent, Netflix" maxLength={200} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <Field label="Repeats" htmlFor="r-freq">
            <Select id="r-freq" value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value as Frequency })}>
              {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts" htmlFor="r-start">
              <Input id="r-start" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label="Ends (optional)" htmlFor="r-end">
              <Input id="r-end" type="date" min={draft.startDate} value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
            </Field>
          </div>
          {!draft.id && draft.startDate < todayISO() && (
            <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning">Entries since {formatShortDate(draft.startDate)} will be added right away.</p>
          )}
        </FormSheet>
      )}
    </>
  );
}
