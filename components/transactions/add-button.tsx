"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransactionType } from "@/types/app";
import { useTransactionSheet } from "./transaction-sheet";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> & {
  txType?: TransactionType;
  label?: string;
};

/** Opens the add sheet from anywhere, including server-rendered pages. */
export function AddButton({ txType = "EXPENSE", label, children, ...props }: Props) {
  const { openAdd } = useTransactionSheet();
  return (
    <Button type="button" onClick={() => openAdd(txType)} {...props}>
      {children ?? (
        <>
          <Plus /> {label ?? `Add ${txType.toLowerCase()}`}
        </>
      )}
    </Button>
  );
}
