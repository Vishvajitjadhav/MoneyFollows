import type { Metadata } from "next";
import { GoalsManager } from "@/components/goals/goals-manager";
import { Page } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Savings goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_goals")
    .select("id, name, target_amount, current_amount, target_date, icon, color, achieved_at")
    .order("achieved_at", { nullsFirst: true })
    .order("target_date", { nullsFirst: false })
    .order("created_at");
  if (error) throw new Error(error.message);
  const goals = data ?? [];
  const saved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const target = goals.reduce((s, g) => s + Number(g.target_amount), 0);

  return (
    <Page
      title="Savings goals"
      description={goals.length ? undefined : "Emergency fund, new laptop, travel — give your savings a purpose."}
    >
      {goals.length > 0 && (
        <div className="mb-5 rounded-2xl border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Saved across {goals.length} {goals.length === 1 ? "goal" : "goals"}</p>
          <p>
            <MoneyText amount={saved} size="xl" /> <span className="text-muted-foreground">/ </span>
            <MoneyText amount={target} size="lg" tone="muted" />
          </p>
        </div>
      )}
      <GoalsManager goals={goals} />
    </Page>
  );
}
