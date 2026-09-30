"use client";

import { ShoppingBag } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { MoneyText } from "@/components/money-text";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TransactionView } from "@/types/app";
import { useTransactionSheet } from "./transaction-sheet";

export function TransactionRow({ tx, showDate = false, className }: { tx: TransactionView; showDate?: boolean; className?: string }) {
  const { openEdit } = useTransactionSheet();
  const title = tx.subcategory_name ?? tx.category_name;
  const meta = [tx.subcategory_name ? tx.category_name : null, tx.description, showDate ? formatShortDate(tx.transaction_date) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={() => openEdit(tx)}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
        className,
      )}
    >
      <CategoryIcon icon={tx.category_icon} color={tx.category_color} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{title}</span>
          {tx.is_purchase && <ShoppingBag aria-label="Purchase" className="size-3.5 shrink-0 text-brand" />}
        </span>
        {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      <MoneyText
        amount={tx.amount}
        size="sm"
        tone={tx.type === "INCOME" ? "income" : tx.type === "INVESTMENT" ? "invest" : "default"}
        signed={tx.type === "INCOME"}
      />
    </button>
  );
}
