import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, SearchX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { HistoryControls } from "@/components/history/history-controls";
import { Page } from "@/components/layout/page";
import { MoneyText } from "@/components/money-text";
import { AddButton } from "@/components/transactions/add-button";
import { TransactionsByDay } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { findTransactions } from "@/lib/data/analytics";
import { getCategories } from "@/lib/data/categories";
import { hasActiveFilters, PAGE_SIZE, parseHistoryParams, toFilters, toQuery } from "@/lib/validations/filters";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const params = parseHistoryParams(await searchParams);
  const [result, categories] = await Promise.all([findTransactions(toFilters(params)), getCategories()]);
  const page = params.page ?? 1;
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const filtered = hasActiveFilters(params);
  const { page: _p, ...exportParams } = params;

  return (
    <Page
      title="History"
      action={
        result.total > 0 && (
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export/csv${toQuery(exportParams)}`} download>
              <Download /> CSV
            </a>
          </Button>
        )
      }
    >
      <HistoryControls params={params} categories={categories} />

      {result.total > 0 && (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 rounded-2xl border bg-card px-4 py-3 shadow-card">
          <span className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "transaction" : "transactions"}
          </span>
          {result.totals.expense > 0 && (
            <span className="text-sm">
              <span className="text-muted-foreground">Spent </span>
              <MoneyText amount={result.totals.expense} size="md" />
            </span>
          )}
          {result.totals.income > 0 && (
            <span className="text-sm">
              <span className="text-muted-foreground">Income </span>
              <MoneyText amount={result.totals.income} size="md" tone="income" />
            </span>
          )}
          {result.totals.investment > 0 && (
            <span className="text-sm">
              <span className="text-muted-foreground">Invested </span>
              <MoneyText amount={result.totals.investment} size="md" tone="invest" />
            </span>
          )}
        </div>
      )}

      <div className="mt-5">
        {result.rows.length > 0 ? (
          <TransactionsByDay rows={result.rows} />
        ) : filtered ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            description="Nothing matches these filters. Try a different word or clear a filter."
            action={
              <Button asChild variant="outline">
                <Link href="/history">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Your first expense takes 5 seconds to add."
            action={<AddButton label="Add expense" />}
          />
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-between">
          <Button asChild variant="outline" size="sm" aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-40" : ""}>
            <Link href={`/history${toQuery({ ...params, page: page - 1 > 1 ? page - 1 : undefined })}`} scroll>
              <ChevronLeft /> Newer
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button asChild variant="outline" size="sm" aria-disabled={page >= pages} className={page >= pages ? "pointer-events-none opacity-40" : ""}>
            <Link href={`/history${toQuery({ ...params, page: page + 1 })}`} scroll>
              Older <ChevronRight />
            </Link>
          </Button>
        </nav>
      )}
    </Page>
  );
}
