"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage, firstIssue } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, customFieldSchema, profileSchema, subcategorySchema } from "@/lib/validations/planning";
import type { ActionResult } from "@/types/app";

const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
const bad = (error: string): ActionResult<never> => ({ ok: false, error });
const uuid = z.uuid();
const refresh = () => revalidatePath("/", "layout");
const dup = (e: { code?: string; message: string }, what: string) => (e.code === "23505" ? `You already have ${what} with that name.` : dbErrorMessage(e));

// ─────────────────────────────────────────── categories
export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = categorySchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const q = id
    ? // Type can't change once transactions reference it (FK on type) — only name/icon/color are editable.
      db.from("categories").update({ name: p.data.name, icon: p.data.icon, color: p.data.color }).eq("id", id).eq("user_id", user.id).select("id").single()
    : db
        .from("categories")
        .insert({ ...p.data, user_id: user.id, sort_order: 100 })
        .select("id")
        .single();
  const { data, error } = await q;
  if (error) return bad(dup(error, "a category"));
  refresh();
  return ok({ id: data.id });
}

/** Archive hides a category from pickers but keeps its history. Unused categories are deleted outright. */
export async function archiveCategory(id: string, archived: boolean): Promise<ActionResult<{ deleted: boolean }>> {
  if (!uuid.safeParse(id).success) return bad("Unknown category.");
  const user = await requireUser();
  const db = await createClient();
  if (archived) {
    const { count } = await db.from("transactions").select("id", { count: "exact", head: true }).eq("category_id", id);
    const { count: rec } = await db.from("recurring_transactions").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (!count && !rec) {
      const { error } = await db.from("categories").delete().eq("id", id).eq("user_id", user.id);
      if (!error) {
        refresh();
        return ok({ deleted: true });
      }
    }
  }
  const { error } = await db
    .from("categories")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok({ deleted: false });
}

export async function addSubcategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = subcategorySchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const { data, error } = await db
    .from("subcategories")
    .insert({ user_id: user.id, category_id: p.data.categoryId, name: p.data.name, sort_order: 100 })
    .select("id")
    .single();
  if (error) return bad(dup(error, "a subcategory"));
  refresh();
  return ok({ id: data.id });
}

export async function renameSubcategory(id: string, name: string): Promise<ActionResult<null>> {
  const p = z.object({ id: uuid, name: z.string().trim().min(1).max(40) }).safeParse({ id, name });
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("subcategories").update({ name: p.data.name }).eq("id", id).eq("user_id", user.id);
  if (error) return bad(dup(error, "a subcategory"));
  refresh();
  return ok(null);
}

export async function removeSubcategory(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  if (!uuid.safeParse(id).success) return bad("Unknown subcategory.");
  const user = await requireUser();
  const db = await createClient();
  const { count } = await db.from("transactions").select("id", { count: "exact", head: true }).eq("subcategory_id", id);
  const { count: rec } = await db.from("recurring_transactions").select("id", { count: "exact", head: true }).eq("subcategory_id", id);
  const { error } =
    count || rec
      ? await db.from("subcategories").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id)
      : await db.from("subcategories").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok({ deleted: !count && !rec });
}

// ─────────────────────────────────────────── custom fields
export async function saveCustomField(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = customFieldSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  if (p.data.fieldType === "DROPDOWN" && p.data.options.length === 0) return bad("Add at least one option.");
  const user = await requireUser();
  const db = await createClient();
  const row = { name: p.data.name, field_type: p.data.fieldType, options: p.data.fieldType === "DROPDOWN" ? p.data.options : [] };
  const q = id
    ? db.from("custom_field_definitions").update({ name: row.name, options: row.options }).eq("id", id).eq("user_id", user.id).select("id").single()
    : db.from("custom_field_definitions").insert({ ...row, user_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return bad(dup(error, "a field"));
  refresh();
  return ok({ id: data.id });
}

export async function archiveCustomField(id: string): Promise<ActionResult<null>> {
  if (!uuid.safeParse(id).success) return bad("Unknown field.");
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("custom_field_definitions").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}

// ─────────────────────────────────────────── profile
export async function updateProfile(input: unknown): Promise<ActionResult<null>> {
  const p = profileSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("profiles").update({ full_name: p.data.fullName }).eq("id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}
