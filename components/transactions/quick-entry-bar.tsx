"use client";

import { useState, useTransition } from "react";
import { CornerDownLeft, LoaderCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, deleteTransaction } from "@/lib/actions/transactions";
import { todayISO } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { parseQuickEntry } from "@/lib/parsers/quick-entry";
import { safeAction } from "@/lib/safe-action";
import { cn } from "@/lib/utils";
import { useTransactionSheet } from "./transaction-sheet";

/**
 * "250 food lunch" + Enter → saved. If the text doesn't name a category,
 * the add sheet opens prefilled so nothing typed is lost.
 */
export function QuickEntryBar({ className }: { className?: string }) {
  const { categories, openAdd } = useTransactionSheet();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const preview = text.trim() ? parseQuickEntry(text, categories) : null;
  const previewCat = preview?.categoryId ? categories.find((c) => c.id === preview.categoryId) : null;
  const previewSub = previewCat?.subcategories.find((s) => s.id === preview?.subcategoryId);

  function submit() {
    const parsed = parseQuickEntry(text, categories);
    if (!parsed) {
      toast.error("Start with an amount — e.g. 250 food lunch");
      return;
    }
    if (!parsed.categoryId) {
      openAdd({ type: parsed.type, amount: parsed.amount, description: parsed.description });
      setText("");
      return;
    }
    const cat = categories.find((c) => c.id === parsed.categoryId)!;
    startTransition(async () => {
      const r = await safeAction(() => createTransaction({
        type: parsed.type,
        amount: parsed.amount,
        categoryId: parsed.categoryId!,
        subcategoryId: parsed.subcategoryId,
        date: todayISO(),
        description: parsed.description,
      }));
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setText("");
      const kind = parsed.type === "EXPENSE" ? "expense" : parsed.type === "INCOME" ? "income" : "investment";
      toast.success(`${formatINR(parsed.amount)} ${cat.name} ${kind} added.`, {
        action: { label: "Undo", onClick: () => void safeAction(() => deleteTransaction(r.data.id)) },
      });
    });
  }

  return (
    <form
      className={cn("space-y-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="flex h-12 items-center gap-2 rounded-2xl border bg-card px-3.5 shadow-card focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
        <Zap className="size-4 shrink-0 text-brand" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Quick add: 250 food lunch"
          aria-label="Quick add"
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || pending}
          aria-label="Save"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition enabled:hover:bg-muted disabled:opacity-40"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CornerDownLeft className="size-4" />}
        </button>
      </label>
      {preview && (
        <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
          {formatINR(preview.amount)} ·{" "}
          {previewCat ? (
            <span className="font-medium text-foreground">
              {previewCat.name}
              {previewSub ? ` › ${previewSub.name}` : ""}
            </span>
          ) : (
            "pick a category next"
          )}
          {preview.description ? ` · “${preview.description}”` : ""}
        </p>
      )}
    </form>
  );
}
