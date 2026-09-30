import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { RecurringManager } from "@/components/recurring/recurring-manager";
import { getCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Recurring" };

export default async function RecurringPage() {
  const supabase = await createClient();
  const [{ data, error }, categories] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("id, type, amount, category_id, subcategory_id, description, frequency, start_date, end_date, next_run_date, is_purchase, active")
      .order("active", { ascending: false })
      .order("next_run_date"),
    getCategories(),
  ]);
  if (error) throw new Error(error.message);

  return (
    <Page title="Recurring" description="Rent, gym, subscriptions and SIPs — recorded automatically.">
      <RecurringManager items={data ?? []} categories={categories} />
    </Page>
  );
}
