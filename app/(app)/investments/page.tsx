import type { Metadata } from "next";
import { BreakdownList } from "@/components/analysis/breakdown";
import { InvestmentsManager } from "@/components/investments/investments-manager";
import { Page, Section } from "@/components/layout/page";
import { StatCard } from "@/components/stat-card";
import { getCategoryTotals, getPeriodTotals } from "@/lib/data/analytics";
import { monthRange, resolvePeriod, todayISO } from "@/lib/dates";
import { monthlyEquivalent } from "@/lib/recurrence";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Investments" };

export default async function InvestmentsPage() {
  const today = todayISO();
  const month = monthRange(today);
  const year = resolvePeriod("this-year", {}, today);
  const supabase = await createClient();
  const [{ data, error }, monthTotals, yearTotals, byType] = await Promise.all([
    supabase
      .from("investments")
      .select("id, name, type, amount, frequency, start_date, end_date, notes, active")
      .order("active", { ascending: false })
      .order("created_at"),
    getPeriodTotals(month.from, month.to),
    getPeriodTotals(year.from, year.to),
    getCategoryTotals(year.from, year.to, "INVESTMENT"),
  ]);
  if (error) throw new Error(error.message);
  const items = data ?? [];
  const commitment = items.filter((i) => i.active).reduce((s, i) => s + monthlyEquivalent(Number(i.amount), i.frequency), 0);

  return (
    <Page title="Investments" description="Simple tracking of what you put in. No market prices — just your contributions.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Invested this month" amount={monthTotals.investments} tone="invest" />
        <StatCard label="Invested this year" amount={yearTotals.investments} tone="invest" />
        <StatCard label="Monthly commitment" amount={Math.round(commitment)} className="col-span-2 md:col-span-1" hint="From active SIPs & plans" />
      </div>

      <InvestmentsManager items={items} />

      {byType.length > 0 && (
        <Section title={`By type · ${year.label}`} className="mt-8">
          <BreakdownList rows={byType.map((c) => ({ id: c.category_id, name: c.name, icon: c.icon, color: c.color, total: c.total, count: c.count, share: c.share }))} />
        </Section>
      )}
    </Page>
  );
}
