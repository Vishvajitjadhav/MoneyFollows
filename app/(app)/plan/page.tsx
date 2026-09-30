import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { Planner } from "@/components/plan/planner";
import { calculateFamilySupport } from "@/lib/calculations";
import type { Allocation, PlanInputs } from "@/lib/calculations/plan";
import { getCategoryTotals, getPeriodTotals } from "@/lib/data/analytics";
import { monthRange, monthStart, previousRange, todayISO } from "@/lib/dates";
import { monthlyEquivalent } from "@/lib/recurrence";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Financial plan" };

export default async function PlanPage() {
  const today = todayISO();
  const month = monthStart(today);
  const last = previousRange(monthRange(today));
  const supabase = await createClient();

  const [{ data: saved }, lastTotals, lastCats, { data: recurring }, { data: investments }] = await Promise.all([
    supabase.from("monthly_plans").select("monthly_income, inputs, allocations").eq("month", month).maybeSingle(),
    getPeriodTotals(last.from, last.to),
    getCategoryTotals(last.from, last.to),
    supabase.from("recurring_transactions").select("amount, frequency, categories(icon), subcategories(name)").eq("active", true).eq("type", "EXPENSE"),
    supabase.from("investments").select("amount, frequency").eq("active", true),
  ]);

  let inputs: PlanInputs;
  let allocation: Allocation | null = null;
  if (saved) {
    const i = (saved.inputs ?? {}) as Partial<PlanInputs>;
    inputs = { income: Number(saved.monthly_income), rent: i.rent ?? 0, emi: i.emi ?? 0, familySupport: i.familySupport ?? 0, investments: i.investments ?? 0, goals: i.goals ?? 0 };
    allocation = saved.allocations as Allocation;
  } else {
    // Prefill from last month + recurring rules so the first view is already personal.
    const rentRule = (recurring ?? []).find((r) => (r.subcategories as unknown as { name: string } | null)?.name === "Rent");
    inputs = {
      income: lastTotals.income,
      rent: rentRule ? monthlyEquivalent(Number(rentRule.amount), rentRule.frequency) : (lastCats.find((c) => c.icon === "housing")?.total ?? 0),
      emi: 0,
      familySupport: calculateFamilySupport(lastCats),
      investments: (investments ?? []).reduce((s, i) => s + monthlyEquivalent(Number(i.amount), i.frequency), 0) || lastTotals.investments,
      goals: 0,
    };
  }

  return (
    <Page title="Financial plan" description="A simple starting allocation for your monthly income." width="wide">
      <Planner month={month} initialInputs={inputs} initialAllocation={allocation} />
    </Page>
  );
}
