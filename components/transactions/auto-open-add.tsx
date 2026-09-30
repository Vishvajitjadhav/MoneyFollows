"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { TransactionType } from "@/types/app";
import { useTransactionSheet } from "./transaction-sheet";

/** Opens the add sheet once (PWA shortcut "/?add=expense"), then cleans the URL. */
export function AutoOpenAdd({ type }: { type: TransactionType }) {
  const { openAdd } = useTransactionSheet();
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    openAdd(type);
    router.replace("/", { scroll: false });
  }, [openAdd, router, type]);
  return null;
}
