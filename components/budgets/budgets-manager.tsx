"use client";

import { useState, useTransition } from "react";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { AmountInput, Field, FormSheet, Select } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { copyPreviousBudgets, deleteBudget, saveBudget } from "@/lib/actions/planning";
import type { BudgetWithUsage } from "@/lib/data/budgets";
import type { Category } from "@/types/app";
import { BudgetBar } from "./budget-bar";

type Editing = { id?: string; categoryId: string; amount: string } | null;

export function BudgetsManager({ month, budgets, categories, canCopy }: { month: string; budgets: BudgetWithUsage[]; categories: Category[]; canCopy: boolean }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [open, setOpen] = useState(false);
  const [copying, startCopy] = useTransition();
  const expense = categories.filter((c) => c.type === "EXPENSE");
  const free = expense.filter((c) => !budgets.some((b) => b.categoryId === c.id));

  const openNew = () => {
    setEditing({ categoryId: free[0]?.id ?? "", amount: "" });
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={openNew} disabled={free.length === 0}>
          <Plus /> Add budget
        </Button>
        {canCopy && (
          <Button
            variant="outline"
            disabled={copying}
            onClick={() =>
              startCopy(async () => {
                const r = await copyPreviousBudgets(month);
                if (r.ok) toast.success(r.data.copied ? `Copied ${r.data.copied} budgets from last month.` : "Nothing new to copy.");
                else toast.error(r.error);
              })
            }
          >
            <Copy /> Copy last month
          </Button>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {budgets.map((b) => (
            <button
              key={b.id}
              type="button"
              className="text-left"
              onClick={() => {
                setEditing({ id: b.id, categoryId: b.categoryId, amount: String(b.usage.budget) });
                setOpen(true);
              }}
            >
              <BudgetBar budget={b} className="transition hover:border-foreground/15" />
            </button>
          ))}
        </div>
      )}

      {editing && (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title={editing.id ? "Edit budget" : "New budget"}
          successMessage="Budget saved."
          onSubmit={() => saveBudget({ categoryId: editing.categoryId, month, amount: editing.amount })}
          onDelete={editing.id ? () => deleteBudget(editing.id!) : undefined}
          deleteLabel="this budget"
        >
          <Field label="Category" htmlFor="b-cat">
            <Select id="b-cat" value={editing.categoryId} disabled={Boolean(editing.id)} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
              {(editing.id ? expense : free).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Monthly budget" htmlFor="b-amt">
            <AmountInput id="b-amt" value={editing.amount} onChange={(amount) => setEditing({ ...editing, amount })} placeholder="8000" />
          </Field>
        </FormSheet>
      )}
    </>
  );
}
