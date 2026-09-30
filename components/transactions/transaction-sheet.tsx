"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ResponsiveSheet } from "@/components/responsive-sheet";
import { getTransactionCustomFields } from "@/lib/actions/transactions";
import type { Category, CustomField, EditableTransaction, TransactionType, TransactionView } from "@/types/app";
import { TransactionForm, type TransactionDraft } from "./transaction-form";

type SheetApi = {
  openAdd: (draft?: TransactionType | TransactionDraft) => void;
  openEdit: (tx: TransactionView) => void;
  categories: Category[];
};

const SheetContext = createContext<SheetApi | null>(null);

export function useTransactionSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useTransactionSheet must be used inside <TransactionSheetProvider>");
  return ctx;
}

type State =
  | { mode: "closed" }
  | { mode: "add"; draft: TransactionDraft; key: number }
  | { mode: "edit"; tx: EditableTransaction; key: number };

/** One add/edit sheet for the whole app. Rows and buttons call openAdd/openEdit. */
export function TransactionSheetProvider({
  categories,
  customFields,
  children,
}: {
  categories: Category[];
  customFields: CustomField[];
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ mode: "closed" });
  const [open, setOpen] = useState(false);

  const openAdd = useCallback((draft?: TransactionType | TransactionDraft) => {
    const d: TransactionDraft = typeof draft === "string" ? { type: draft } : (draft ?? { type: "EXPENSE" });
    setState({ mode: "add", draft: d, key: Date.now() });
    setOpen(true);
  }, []);

  const openEdit = useCallback(
    async (tx: TransactionView) => {
      setState({ mode: "edit", tx, key: Date.now() });
      setOpen(true);
      if (customFields.length) {
        const values = await getTransactionCustomFields(tx.id).catch(() => ({}));
        setState((s) => (s.mode === "edit" && s.tx.id === tx.id ? { ...s, tx: { ...s.tx, customFields: values }, key: s.key + 1 } : s));
      }
    },
    [customFields.length],
  );

  const api = useMemo(() => ({ openAdd, openEdit, categories }), [openAdd, openEdit, categories]);

  const title =
    state.mode === "edit"
      ? `Edit ${state.tx.type.toLowerCase()}`
      : state.mode === "add" && state.draft.type !== "EXPENSE"
        ? `Add ${state.draft.type.toLowerCase()}`
        : "Add expense";

  return (
    <SheetContext.Provider value={api}>
      {children}
      <ResponsiveSheet open={open} onOpenChange={setOpen} title={title} className="flex flex-col">
        {state.mode !== "closed" && (
          <TransactionForm
            key={state.key}
            categories={categories}
            customFields={customFields}
            editing={state.mode === "edit" ? state.tx : null}
            draft={state.mode === "add" ? state.draft : undefined}
            onDone={() => setOpen(false)}
          />
        )}
      </ResponsiveSheet>
    </SheetContext.Provider>
  );
}
