"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { ResponsiveSheet } from "@/components/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRange } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toQuery, type HistoryParams } from "@/lib/validations/filters";
import type { Category } from "@/types/app";

type Props = { params: HistoryParams; categories: Category[]; basePath?: string };

const TYPES = [
  { value: "", label: "All" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "INVESTMENT", label: "Investments" },
];

export function HistoryControls({ params, categories, basePath = "/history" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? "");
  const [open, setOpen] = useState(false);

  const go = (next: Partial<HistoryParams>) => {
    const merged = { ...params, ...next, page: undefined };
    startTransition(() => router.push(`${basePath}${toQuery(merged)}`, { scroll: false }));
  };

  // Debounced search-as-you-type.
  useEffect(() => {
    if ((params.q ?? "") === q) return;
    const t = setTimeout(() => go({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const category = categories.find((c) => c.id === params.category);
  const sub = category?.subcategories.find((s) => s.id === params.sub);
  const chips: { key: string; label: string; clear: Partial<HistoryParams> }[] = [];
  if (params.type) chips.push({ key: "type", label: TYPES.find((t) => t.value === params.type)!.label, clear: { type: undefined } });
  if (params.from || params.to)
    chips.push({
      key: "date",
      label: params.from && params.to ? formatRange({ from: params.from, to: params.to }) : params.from ? `From ${params.from}` : `Until ${params.to}`,
      clear: { from: undefined, to: undefined },
    });
  if (category) chips.push({ key: "cat", label: sub ? `${category.name} › ${sub.name}` : category.name, clear: { category: undefined, sub: undefined } });
  if (params.min !== undefined || params.max !== undefined)
    chips.push({
      key: "amt",
      label: `${params.min !== undefined ? formatINR(params.min) : "₹0"} – ${params.max !== undefined ? formatINR(params.max) : "any"}`,
      clear: { min: undefined, max: undefined },
    });
  if (params.purchase) chips.push({ key: "purchase", label: "Purchases", clear: { purchase: undefined } });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border bg-card px-3.5 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
          {pending ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : <Search className="size-4 text-muted-foreground" />}
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movie, petrol, office lunch…"
            aria-label="Search transactions"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="text-muted-foreground">
              <X className="size-4" />
            </button>
          )}
        </label>
        <Button variant="outline" size="icon" aria-label="Filters" onClick={() => setOpen(true)} className="relative rounded-xl">
          <SlidersHorizontal />
          {chips.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand text-[0.65rem] font-bold text-white">
              {chips.length}
            </span>
          )}
        </Button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => go({ type: (t.value || undefined) as HistoryParams["type"] })}
            aria-pressed={(params.type ?? "") === t.value}
            className={cn(
              "h-9 shrink-0 rounded-full border bg-card px-4 text-sm font-medium transition",
              (params.type ?? "") === t.value && "border-brand bg-brand-soft text-brand-strong",
            )}
          >
            {t.label}
          </button>
        ))}
        {chips
          .filter((c) => c.key !== "type")
          .map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => go(c.clear)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3.5 text-sm font-medium text-brand-strong"
            >
              {c.label} <X className="size-3.5" />
            </button>
          ))}
      </div>

      <FilterSheet key={toQuery(params)} open={open} onOpenChange={setOpen} params={params} categories={categories} onApply={(p) => go(p)} />
    </div>
  );
}

function FilterSheet({
  open,
  onOpenChange,
  params,
  categories,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  params: HistoryParams;
  categories: Category[];
  onApply: (p: Partial<HistoryParams>) => void;
}) {
  const [from, setFrom] = useState(params.from ?? "");
  const [to, setTo] = useState(params.to ?? "");
  const [cat, setCat] = useState(params.category ?? "");
  const [sub, setSub] = useState(params.sub ?? "");
  const [min, setMin] = useState(params.min?.toString() ?? "");
  const [max, setMax] = useState(params.max?.toString() ?? "");
  const [purchase, setPurchase] = useState(Boolean(params.purchase));

  const visible = categories.filter((c) => !params.type || c.type === params.type);
  const subs = categories.find((c) => c.id === cat)?.subcategories ?? [];
  const selectClass = "h-11 w-full rounded-xl border border-input bg-card px-3 text-base md:text-sm";

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Filters">
      <div className="grid gap-4 overflow-y-auto px-4 pb-4 md:px-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="f-from">From</Label>
            <Input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="f-to">To</Label>
            <Input id="f-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="f-cat">Category</Label>
          <select id="f-cat" className={selectClass} value={cat} onChange={(e) => (setCat(e.target.value), setSub(""))}>
            <option value="">All categories</option>
            {visible.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === "EXPENSE" ? c.name : `${c.name} (${c.type.toLowerCase()})`}
              </option>
            ))}
          </select>
        </div>
        {subs.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="f-sub">Subcategory</Label>
            <select id="f-sub" className={selectClass} value={sub} onChange={(e) => setSub(e.target.value)}>
              <option value="">All</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="f-min">Min amount</Label>
            <Input id="f-min" inputMode="decimal" placeholder="₹0" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="f-max">Max amount</Label>
            <Input id="f-max" inputMode="decimal" placeholder="Any" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
        </div>
        <label className="flex h-11 items-center justify-between rounded-xl border bg-card px-3.5 text-sm font-medium">
          Purchases only
          <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={purchase} onChange={(e) => setPurchase(e.target.checked)} />
        </label>
      </div>
      <div className="flex gap-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:px-6 md:pb-5">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => {
            onApply({ from: undefined, to: undefined, category: undefined, sub: undefined, min: undefined, max: undefined, purchase: undefined });
            onOpenChange(false);
          }}
        >
          Clear
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => {
            onApply({
              from: from || undefined,
              to: to || undefined,
              category: cat || undefined,
              sub: sub || undefined,
              min: min ? Number(min) : undefined,
              max: max ? Number(max) : undefined,
              purchase: purchase ? "1" : undefined,
            });
            onOpenChange(false);
          }}
        >
          Show results
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
