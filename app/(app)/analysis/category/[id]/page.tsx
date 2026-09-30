import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BreakdownList } from "@/components/analysis/breakdown";
import { PeriodPicker } from "@/components/analysis/period-picker";
import { CategoryIcon } from "@/components/category-icon";
import { Page, Section } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { TransactionsByDay } from "@/components/transactions/transaction-list";
import { findTransactions, getSubcategoryTotals } from "@/lib/data/analytics";
import { getCategories } from "@/lib/data/categories";
import { periodFromSearchParams } from "@/lib/data/period";
import { z } from "zod";

export const metadata: Metadata = { title: "Category" };

export default async function CategoryDrillDown({ params, searchParams }: PageProps<"/analysis/category/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const sp = await searchParams;
  const { period, range, query, from, to } = periodFromSearchParams(sp);
  const sub = typeof sp.sub === "string" && z.uuid().safeParse(sp.sub).success ? sp.sub : undefined;

  const categories = await getCategories({ includeArchived: true });
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const [subs, txs] = await Promise.all([
    getSubcategoryTotals(id, range),
    findTransactions({ categoryId: id, subcategoryId: sub ?? null, from: range.from, to: range.to, limit: 100 }),
  ]);
  const total = subs.reduce((s, r) => s + r.total, 0);
  const selected = category.subcategories.find((s) => s.id === sub);
  const base = `/analysis/category/${id}`;
  const withSub = (s: string | null) => `${base}${query ? `${query}&` : "?"}${s ? `sub=${s}` : ""}`.replace(/[?&]$/, "");

  return (
    <Page
      title={category.name}
      eyebrow={range.label}
      action={
        <Link href={`/analysis${query}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Analysis
        </Link>
      }
    >
      <PeriodPicker period={period} from={from} to={to} basePath={base} />

      <div className="mt-5 flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-card">
        <CategoryIcon icon={category.icon} color={category.color} size="lg" />
        <div>
          <p className="text-sm text-muted-foreground">Total {category.type === "EXPENSE" ? "spent" : "recorded"}</p>
          <MoneyText amount={total} size="xl" />
        </div>
      </div>

      {subs.length > 1 && (
        <Section title="By subcategory" className="mt-7">
          <BreakdownList
            rows={subs.map((s) => ({
              id: s.subcategory_id,
              name: s.name,
              total: s.total,
              count: s.count,
              share: s.share,
              color: category.color,
              href: withSub(s.subcategory_id === sub ? null : s.subcategory_id),
            }))}
          />
        </Section>
      )}

      <Section
        title={selected ? `${selected.name} transactions` : "Transactions"}
        className="mt-7"
        action={
          selected && (
            <Link href={withSub(null)} className="text-sm font-medium text-brand-strong hover:underline">
              Show all
            </Link>
          )
        }
      >
        {txs.rows.length > 0 ? (
          <TransactionsByDay rows={txs.rows} />
        ) : (
          <p className="rounded-2xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No {category.name.toLowerCase()} transactions in this period.
          </p>
        )}
        {txs.total > txs.rows.length && (
          <Link
            href={`/history?category=${id}${sub ? `&sub=${sub}` : ""}&from=${range.from}&to=${range.to}`}
            className="block text-center text-sm font-medium text-brand-strong hover:underline"
          >
            See all {txs.total} in History
          </Link>
        )}
      </Section>
    </Page>
  );
}
