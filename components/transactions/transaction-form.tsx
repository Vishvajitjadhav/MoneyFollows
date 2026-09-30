"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { CalendarDays, ChevronDown, LoaderCircle, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/transactions";
import { formatDay, todayISO } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { safeAction } from "@/lib/safe-action";
import { cn } from "@/lib/utils";
import type { Category, CustomField, EditableTransaction, TransactionType } from "@/types/app";

export type TransactionDraft = {
  type: TransactionType;
  amount?: number;
  categoryId?: string | null;
  subcategoryId?: string | null;
  description?: string | null;
};

type Props = {
  categories: Category[];
  customFields: CustomField[];
  /** Existing transaction → edit mode. */
  editing?: EditableTransaction | null;
  draft?: TransactionDraft;
  onDone: () => void;
};

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "INVESTMENT", label: "Investment" },
];

const noun = (t: TransactionType) => (t === "EXPENSE" ? "expense" : t === "INCOME" ? "income" : "investment");

export function TransactionForm({ categories, customFields, editing, draft, onDone }: Props) {
  const [type, setType] = useState<TransactionType>(editing?.type ?? draft?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(() => {
    const a = editing?.amount ?? draft?.amount;
    return a ? String(a) : "";
  });
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? draft?.categoryId ?? null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(editing?.subcategory_id ?? draft?.subcategoryId ?? null);
  const [date, setDate] = useState(editing?.transaction_date ?? todayISO());
  const [description, setDescription] = useState(editing?.description ?? draft?.description ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [isPurchase, setIsPurchase] = useState(editing?.is_purchase ?? false);
  const [custom, setCustom] = useState<Record<string, unknown>>(editing?.customFields ?? {});
  const [showMore, setShowMore] = useState(Boolean(editing?.notes) || Object.keys(editing?.customFields ?? {}).length > 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dateRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const category = visible.find((c) => c.id === categoryId) ?? null;
  const amountValue = Number(amount.replace(/,/g, ""));
  const canSave = amountValue > 0 && Boolean(category) && !pending;

  function switchType(next: TransactionType) {
    setType(next);
    setCategoryId(null);
    setSubcategoryId(null);
    setError(null);
  }

  function pickCategory(id: string) {
    setCategoryId(id);
    setSubcategoryId(null);
    setError(null);
  }

  function save() {
    if (!canSave || !category) {
      setError(amountValue > 0 ? "Pick a category." : "Enter an amount.");
      return;
    }
    const input = {
      type,
      amount: amountValue,
      categoryId: category.id,
      subcategoryId,
      date,
      description,
      notes,
      isPurchase: type === "EXPENSE" && isPurchase,
      customFields: Object.fromEntries(
        customFields.map((f) => [f.id, (custom[f.id] ?? null) as string | number | boolean | null]),
      ),
    };

    startTransition(async () => {
      const result = await safeAction(() => (editing ? updateTransaction(editing.id, input) : createTransaction(input)));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone();
      if (editing) {
        toast.success("Changes saved.");
      } else {
        const createdId = result.data.id;
        toast.success(`${formatINR(amountValue)} ${category.name} ${noun(type)} added.`, {
          action: {
            label: "Undo",
            onClick: async () => {
              const undo = await safeAction(() => deleteTransaction(createdId));
              if (undo.ok) toast("Removed.");
            },
          },
        });
      }
    });
  }

  function remove() {
    if (!editing) return;
    startTransition(async () => {
      const result = await safeAction(() => deleteTransaction(editing.id));
      setConfirmDelete(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone();
      toast.success(`${formatINR(editing.amount)} ${editing.category_name} deleted.`);
    });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 md:px-6">
        {/* Type */}
        <div role="radiogroup" aria-label="Type" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => switchType(t.value)}
              className={cn(
                "h-10 rounded-xl text-sm font-semibold text-muted-foreground transition",
                type === t.value && "bg-card text-foreground shadow-sm",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <label className="flex items-baseline gap-1 rounded-2xl border bg-card px-4 py-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
          <span className="text-3xl font-bold text-muted-foreground">₹</span>
          <input
            aria-label="Amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={!editing}
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"));
              setError(null);
            }}
            className="money-hero w-full min-w-0 bg-transparent text-[2.75rem] outline-none placeholder:text-muted-foreground/40"
          />
        </label>

        {/* Category */}
        <fieldset className="space-y-2.5">
          <legend className="mb-2.5 text-sm font-medium text-muted-foreground">Category</legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {visible.map((c) => {
              const selected = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickCategory(c.id)}
                  className={cn(
                    "flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border bg-card px-0.5 py-2 text-[0.7rem] leading-tight font-medium transition active:scale-[0.97]",
                    selected ? "border-brand bg-brand-soft text-brand-strong" : "hover:border-foreground/15",
                  )}
                >
                  <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                  <span className="line-clamp-2 text-center break-words">{c.name}</span>
                </button>
              );
            })}
          </div>
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories yet — add one under More → Categories.</p>
          )}
        </fieldset>

        {/* Subcategory */}
        {category && category.subcategories.length > 0 && (
          <fieldset>
            <legend className="mb-2.5 text-sm font-medium text-muted-foreground">{category.name}</legend>
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map((s) => {
                const selected = s.id === subcategoryId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSubcategoryId(selected ? null : s.id)}
                    className={cn(
                      "h-10 rounded-full border bg-card px-4 text-sm font-medium transition active:scale-[0.97]",
                      selected ? "border-brand bg-brand-soft text-brand-strong" : "hover:border-foreground/15",
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Remark */}
        <Input
          aria-label="Remark"
          placeholder={type === "EXPENSE" ? "Add a remark — e.g. Office lunch" : "Add a remark (optional)"}
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Date + purchase + more */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border bg-card px-3.5 text-sm font-medium">
            <CalendarDays className="size-4 text-muted-foreground" />
            {formatDay(date)}
            <input
              ref={dateRef}
              type="date"
              aria-label="Date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              onClick={() => dateRef.current?.showPicker?.()}
            />
          </label>
          {type === "EXPENSE" && (
            <button
              type="button"
              aria-pressed={isPurchase}
              onClick={() => setIsPurchase((v) => !v)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border bg-card px-3.5 text-sm font-medium transition",
                isPurchase && "border-brand bg-brand-soft text-brand-strong",
              )}
            >
              <ShoppingBag className="size-4" /> Purchase
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            More <ChevronDown className={cn("size-4 transition", showMore && "rotate-180")} />
          </button>
        </div>

        {showMore && (
          <div className="space-y-4 rounded-2xl border bg-muted/40 p-4">
            <div className="grid gap-2">
              <Label htmlFor="tx-notes">Notes</Label>
              <Textarea id="tx-notes" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {customFields.map((f) => (
              <CustomFieldInput key={f.id} field={f} value={custom[f.id]} onChange={(v) => setCustom((c) => ({ ...c, [f.id]: v }))} />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t bg-popover px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:px-6 md:pb-5">
        {editing && (
          <Button type="button" variant="destructive" size="icon-lg" aria-label="Delete" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
        )}
        <div className="flex-1">
          {error && <p role="alert" className="mb-2 text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={pending || !(amountValue > 0)}>
            {pending && <LoaderCircle className="animate-spin" />}
            {editing ? "Save changes" : amountValue > 0 ? `Save ${formatINR(amountValue)}` : "Save"}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {editing ? noun(editing.type) : "entry"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {editing && `${formatINR(editing.amount)} · ${editing.category_name}${editing.subcategory_name ? ` › ${editing.subcategory_name}` : ""}. `}
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function CustomFieldInput({ field, value, onChange }: { field: CustomField; value: unknown; onChange: (v: unknown) => void }) {
  const id = `cf-${field.id}`;
  if (field.field_type === "BOOLEAN") {
    return (
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{field.name}</Label>
        <Switch id={id} checked={value === true} onCheckedChange={(v) => onChange(v)} />
      </div>
    );
  }
  if (field.field_type === "DROPDOWN") {
    const options = Array.isArray(field.options) ? (field.options as string[]) : [];
    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{field.name}</Label>
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-11 rounded-xl border border-input bg-card px-3 text-base md:text-sm"
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.name}</Label>
      <Input
        id={id}
        type={field.field_type === "NUMBER" ? "number" : field.field_type === "DATE" ? "date" : "text"}
        inputMode={field.field_type === "NUMBER" ? "decimal" : undefined}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : field.field_type === "NUMBER" ? Number(e.target.value) : e.target.value)
        }
      />
    </div>
  );
}
