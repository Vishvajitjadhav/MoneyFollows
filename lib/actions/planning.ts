"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage, firstIssue } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { recurrenceNextClient } from "@/lib/recurrence";
import { shiftMonth, todayISO } from "@/lib/dates";
import {
  budgetSchema,
  contributionSchema,
  goalSchema,
  investmentSchema,
  planSchema,
  recurringSchema,
} from "@/lib/validations/planning";
import type { ActionResult } from "@/types/app";

const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
const bad = (error: string): ActionResult<never> => ({ ok: false, error });
const uuid = z.uuid();

function refresh() {
  revalidatePath("/", "layout");
}

// ─────────────────────────────────────────── budgets
export async function saveBudget(input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = budgetSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const { data, error } = await db
    .from("budgets")
    .upsert(
      { user_id: user.id, category_id: p.data.categoryId, month: p.data.month, amount: p.data.amount },
      { onConflict: "user_id,category_id,month" },
    )
    .select("id")
    .single();
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok({ id: data.id });
}

export async function deleteBudget(id: string): Promise<ActionResult<null>> {
  if (!uuid.safeParse(id).success) return bad("Unknown budget.");
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}

/** Copy last month's budgets into `month` (skips categories that already have one). */
export async function copyPreviousBudgets(month: string): Promise<ActionResult<{ copied: number }>> {
  if (!/^\d{4}-\d{2}-01$/.test(month)) return bad("Invalid month.");
  const user = await requireUser();
  const db = await createClient();
  const { data: prev, error } = await db.from("budgets").select("category_id, amount").eq("month", shiftMonth(month, -1));
  if (error) return bad(dbErrorMessage(error));
  if (!prev?.length) return bad("No budgets last month to copy.");
  const { data, error: insErr } = await db
    .from("budgets")
    .upsert(
      prev.map((b) => ({ user_id: user.id, category_id: b.category_id, amount: b.amount, month })),
      { onConflict: "user_id,category_id,month", ignoreDuplicates: true },
    )
    .select("id");
  if (insErr) return bad(dbErrorMessage(insErr));
  refresh();
  return ok({ copied: data?.length ?? 0 });
}

// ─────────────────────────────────────────── goals
export async function saveGoal(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = goalSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const row = {
    name: p.data.name,
    target_amount: p.data.targetAmount,
    current_amount: p.data.currentAmount,
    target_date: p.data.targetDate ?? null,
    icon: p.data.icon,
    color: p.data.color,
    achieved_at: p.data.currentAmount >= p.data.targetAmount ? new Date().toISOString() : null,
  };
  const q = id
    ? db.from("financial_goals").update(row).eq("id", id).eq("user_id", user.id).select("id").single()
    : db.from("financial_goals").insert({ ...row, user_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok({ id: data.id });
}

export async function contributeToGoal(input: unknown): Promise<ActionResult<{ current: number; achieved: boolean }>> {
  const p = contributionSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const { data: goal, error } = await db
    .from("financial_goals")
    .select("current_amount, target_amount, achieved_at")
    .eq("id", p.data.id)
    .eq("user_id", user.id)
    .single();
  if (error) return bad(dbErrorMessage(error));
  const current = Math.max(0, Math.round((Number(goal.current_amount) + p.data.amount) * 100) / 100);
  const achieved = current >= Number(goal.target_amount);
  const { error: upErr } = await db
    .from("financial_goals")
    .update({ current_amount: current, achieved_at: achieved ? (goal.achieved_at ?? new Date().toISOString()) : null })
    .eq("id", p.data.id)
    .eq("user_id", user.id);
  if (upErr) return bad(dbErrorMessage(upErr));
  refresh();
  return ok({ current, achieved });
}

export async function deleteGoal(id: string): Promise<ActionResult<null>> {
  if (!uuid.safeParse(id).success) return bad("Unknown goal.");
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("financial_goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}

// ─────────────────────────────────────────── recurring
export async function saveRecurring(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = recurringSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const d = p.data;
  const today = todayISO();
  // Editing reschedules from whichever is later: the rule's pending date or today —
  // so already-created entries are never duplicated and past gaps aren't back-filled.
  let next = d.startDate;
  if (id) {
    const { data: existing } = await db.from("recurring_transactions").select("next_run_date").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!existing) return bad("That recurring item no longer exists.");
    const base = existing.next_run_date > today ? existing.next_run_date : today;
    next = d.startDate >= base ? d.startDate : recurrenceNextClient(d.startDate, shiftDay(base, -1), d.frequency);
  }
  const row = {
    type: d.type,
    amount: d.amount,
    category_id: d.categoryId,
    subcategory_id: d.subcategoryId ?? null,
    description: d.description ?? null,
    frequency: d.frequency,
    start_date: d.startDate,
    end_date: d.endDate ?? null,
    next_run_date: next,
    is_purchase: d.type === "EXPENSE" && d.isPurchase,
    investment_id: d.investmentId ?? null,
    active: !d.endDate || d.endDate >= today,
  };
  const q = id
    ? db.from("recurring_transactions").update(row).eq("id", id).eq("user_id", user.id).select("id").single()
    : db.from("recurring_transactions").insert({ ...row, user_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return bad(dbErrorMessage(error));
  // New rules starting in the past back-fill immediately (e.g. rent since the 1st).
  await db.rpc("generate_recurring_transactions", { p_today: today });
  refresh();
  return ok({ id: data.id });
}

function shiftDay(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function setRecurringActive(id: string, active: boolean): Promise<ActionResult<null>> {
  if (!uuid.safeParse(id).success) return bad("Unknown item.");
  const user = await requireUser();
  const db = await createClient();
  const patch: { active: boolean; next_run_date?: string } = { active };
  if (active) {
    // Resuming doesn't back-fill the paused period.
    const { data: r } = await db.from("recurring_transactions").select("start_date, frequency, next_run_date").eq("id", id).single();
    const today = todayISO();
    if (r && r.next_run_date < today) patch.next_run_date = recurrenceNextClient(r.start_date, shiftDay(today, -1), r.frequency);
  }
  const { error } = await db.from("recurring_transactions").update(patch).eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}

export async function deleteRecurring(id: string): Promise<ActionResult<null>> {
  if (!uuid.safeParse(id).success) return bad("Unknown item.");
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("recurring_transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}

// ─────────────────────────────────────────── investments
const INVESTMENT_CATEGORY_ICON: Record<string, string> = {
  SIP: "sip",
  MUTUAL_FUND: "mutual-fund",
  STOCKS: "stocks",
  PPF: "ppf",
  FD: "fd",
  OTHER: "other",
};

export async function saveInvestment(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const p = investmentSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const d = p.data;
  const row = {
    name: d.name,
    type: d.type,
    amount: d.amount,
    frequency: d.frequency,
    start_date: d.startDate,
    end_date: d.endDate ?? null,
    notes: d.notes ?? null,
    active: !d.endDate || d.endDate >= todayISO(),
  };
  const q = id
    ? db.from("investments").update(row).eq("id", id).eq("user_id", user.id).select("id").single()
    : db.from("investments").insert({ ...row, user_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return bad(dbErrorMessage(error));

  if (d.autoRecord && !id) {
    const { data: cat } = await db
      .from("categories")
      .select("id")
      .eq("type", "INVESTMENT")
      .eq("icon", INVESTMENT_CATEGORY_ICON[d.type])
      .is("archived_at", null)
      .limit(1)
      .maybeSingle();
    if (cat) {
      if (d.frequency === "ONE_TIME") {
        await db.from("transactions").insert({
          user_id: user.id,
          type: "INVESTMENT",
          amount: d.amount,
          category_id: cat.id,
          transaction_date: d.startDate,
          description: d.name,
          investment_id: data.id,
        });
      } else if (d.frequency !== "QUARTERLY") {
        await saveRecurring(null, {
          type: "INVESTMENT",
          amount: d.amount,
          categoryId: cat.id,
          description: d.name,
          frequency: d.frequency,
          startDate: d.startDate,
          endDate: d.endDate ?? null,
          investmentId: data.id,
        });
      }
    }
  }
  refresh();
  return ok({ id: data.id });
}

export async function deleteInvestment(id: string): Promise<ActionResult<null>> {
  if (!uuid.safeParse(id).success) return bad("Unknown investment.");
  const user = await requireUser();
  const db = await createClient();
  // Stop any auto-recording rule linked to it; recorded transactions stay.
  await db.from("recurring_transactions").delete().eq("investment_id", id).eq("user_id", user.id);
  const { error } = await db.from("investments").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad(dbErrorMessage(error));
  refresh();
  return ok(null);
}

// ─────────────────────────────────────────── plan
export async function savePlan(input: unknown): Promise<ActionResult<null>> {
  const p = planSchema.safeParse(input);
  if (!p.success) return bad(firstIssue(p.error));
  const user = await requireUser();
  const db = await createClient();
  const { error } = await db.from("monthly_plans").upsert(
    {
      user_id: user.id,
      month: p.data.month,
      monthly_income: p.data.monthlyIncome,
      inputs: p.data.inputs,
      allocations: p.data.allocations,
    },
    { onConflict: "user_id,month" },
  );
  if (error) return bad(dbErrorMessage(error));
  revalidatePath("/plan");
  return ok(null);
}
