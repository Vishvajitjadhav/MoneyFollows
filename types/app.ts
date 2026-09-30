import type { Enums, FoundTransaction, Tables } from "./database";

export type TransactionType = Enums<"transaction_type">;
export type Subcategory = Pick<Tables<"subcategories">, "id" | "name" | "category_id" | "sort_order">;
export type Category = Pick<Tables<"categories">, "id" | "name" | "type" | "icon" | "color" | "sort_order" | "is_system"> & {
  subcategories: Subcategory[];
};
export type CustomField = Pick<Tables<"custom_field_definitions">, "id" | "name" | "field_type" | "options" | "sort_order">;

/** A transaction with category/subcategory names, as shown in lists. */
export type TransactionView = Omit<FoundTransaction, "total_count" | "total_expense" | "total_income" | "total_investment">;

/** What the edit sheet needs to prefill the form. */
export type EditableTransaction = TransactionView & { customFields?: Record<string, unknown> };

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export const TYPE_LABEL: Record<TransactionType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  INVESTMENT: "Investment",
};
