"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { transactionInputSchema, type TransactionData, type TransactionInput } from "@/lib/validations/transaction";
import { dbErrorMessage, firstIssue } from "@/lib/db-errors";
import type { ActionResult } from "@/types/app";

type Db = Awaited<ReturnType<typeof createClient>>;

async function saveCustomFields(db: Db, userId: string, transactionId: string, values: TransactionData["customFields"]) {
  const entries = Object.entries(values);
  if (entries.length === 0) return null;
  const keep = entries.filter(([, v]) => v !== null && v !== "");
  const clear = entries.filter(([, v]) => v === null || v === "").map(([k]) => k);

  if (clear.length) {
    const { error } = await db
      .from("transaction_custom_fields")
      .delete()
      .eq("transaction_id", transactionId)
      .in("field_id", clear);
    if (error) return error;
  }
  if (keep.length) {
    const { error } = await db.from("transaction_custom_fields").upsert(
      keep.map(([field_id, value]) => ({ transaction_id: transactionId, field_id, user_id: userId, value })),
    );
    if (error) return error;
  }
  return null;
}

function toRow(d: TransactionData) {
  return {
    type: d.type,
    amount: d.amount,
    category_id: d.categoryId,
    subcategory_id: d.subcategoryId ?? null,
    transaction_date: d.date,
    description: d.description ?? null,
    notes: d.notes ?? null,
    is_purchase: d.type === "EXPENSE" ? d.isPurchase : false,
  };
}

function revalidateApp() {
  revalidatePath("/", "layout");
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const user = await requireUser();
  const db = await createClient();
  const { data, error } = await db
    .from("transactions")
    .insert({ ...toRow(parsed.data), user_id: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: dbErrorMessage(error) };

  const cfError = await saveCustomFields(db, user.id, data.id, parsed.data.customFields);
  if (cfError) console.error("custom fields not saved", cfError.message);

  revalidateApp();
  return { ok: true, data: { id: data.id } };
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult<{ id: string }>> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown transaction." };
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const user = await requireUser();
  const db = await createClient();
  const { data, error } = await db
    .from("transactions")
    .update(toRow(parsed.data))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data) return { ok: false, error: "That transaction no longer exists." };

  const cfError = await saveCustomFields(db, user.id, id, parsed.data.customFields);
  if (cfError) console.error("custom fields not saved", cfError.message);

  revalidateApp();
  return { ok: true, data: { id } };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown transaction." };
  const user = await requireUser();
  const db = await createClient();
  const { error, count } = await db
    .from("transactions")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!count) return { ok: false, error: "That transaction no longer exists." };
  revalidateApp();
  return { ok: true, data: undefined };
}

/** Custom field values for one transaction (edit sheet prefill). */
export async function getTransactionCustomFields(id: string): Promise<Record<string, unknown>> {
  if (!z.uuid().safeParse(id).success) return {};
  await requireUser();
  const db = await createClient();
  const { data } = await db.from("transaction_custom_fields").select("field_id, value").eq("transaction_id", id);
  return Object.fromEntries((data ?? []).map((r) => [r.field_id, r.value]));
}
