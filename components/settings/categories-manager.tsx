"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, ChevronDown, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_COLORS, CATEGORY_ICONS, CategoryIcon } from "@/components/category-icon";
import { Field, FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSubcategory, archiveCategory, removeSubcategory, saveCategory } from "@/lib/actions/settings";
import { safeAction } from "@/lib/safe-action";
import { cn } from "@/lib/utils";
import type { Category, TransactionType } from "@/types/app";

type ArchivedCategory = Category & { archived_at: string | null };
type Draft = { id?: string; name: string; type: TransactionType; icon: string; color: string };

const TABS: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "INVESTMENT", label: "Investments" },
];

export function CategoriesManager({ categories }: { categories: ArchivedCategory[] }) {
  const [tab, setTab] = useState<TransactionType>("EXPENSE");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sheet, setSheet] = useState(false);
  const [, start] = useTransition();

  const list = categories.filter((c) => c.type === tab);
  const active = list.filter((c) => !c.archived_at);
  const archived = list.filter((c) => c.archived_at);

  const archive = (c: ArchivedCategory, value: boolean) =>
    start(async () => {
      const r = await safeAction(() => archiveCategory(c.id, value));
      if (!r.ok) return void toast.error(r.error);
      toast.success(value ? (r.data.deleted ? `${c.name} deleted.` : `${c.name} archived — its history is kept.`) : `${c.name} restored.`);
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn("h-9 rounded-xl px-3 text-sm font-semibold text-muted-foreground", tab === t.value && "bg-card text-foreground shadow-sm")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => {
            setDraft({ name: "", type: tab, icon: "pets", color: "teal" });
            setSheet(true);
          }}
        >
          <Plus /> New category
        </Button>
      </div>

      <ul className="mt-5 divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
        {active.map((c) => {
          const expanded = openId === c.id;
          return (
            <li key={c.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpenId(expanded ? null : c.id)} aria-expanded={expanded}>
                  <CategoryIcon icon={c.icon} color={c.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.subcategories.length ? c.subcategories.map((s) => s.name).join(", ") : "No subcategories"}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition", expanded && "rotate-180")} />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${c.name}`}
                  onClick={() => {
                    setDraft({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color });
                    setSheet(true);
                  }}
                >
                  <Pencil />
                </Button>
              </div>
              {expanded && <SubcategoryEditor category={c} onArchive={() => archive(c, true)} />}
            </li>
          );
        })}
      </ul>

      {archived.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Archived</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 opacity-70">
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                <Button variant="ghost" size="sm" onClick={() => archive(c, false)}>
                  <ArchiveRestore /> Restore
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft && (
        <FormSheet
          open={sheet}
          onOpenChange={setSheet}
          title={draft.id ? "Edit category" : "New category"}
          successMessage={draft.id ? "Category updated." : `${draft.name || "Category"} added.`}
          onSubmit={() => saveCategory(draft.id ?? null, draft)}
        >
          <Field label="Name" htmlFor="c-name">
            <Input id="c-name" value={draft.name} placeholder="e.g. Pets" maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Icon</legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {Object.keys(CATEGORY_ICONS).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={draft.icon === key}
                  onClick={() => setDraft({ ...draft, icon: key })}
                  className={cn("flex items-center justify-center rounded-xl border p-1.5", draft.icon === key ? "border-brand bg-brand-soft" : "border-transparent hover:bg-muted")}
                >
                  <CategoryIcon icon={key} color={draft.color} size="sm" />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Color</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={draft.color === key}
                  onClick={() => setDraft({ ...draft, color: key })}
                  className={cn("size-9 rounded-full ring-offset-2 transition", draft.color === key && "ring-2 ring-foreground")}
                  style={{ background: c.solid }}
                />
              ))}
            </div>
          </fieldset>
          {!draft.id && <p className="text-xs text-muted-foreground">You can add subcategories after saving.</p>}
        </FormSheet>
      )}
    </>
  );
}

function SubcategoryEditor({ category, onArchive }: { category: Category; onArchive: () => void }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3 border-t bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {category.subcategories.map((s) => (
          <span key={s.id} className="inline-flex h-9 items-center gap-1 rounded-full border bg-card pr-1 pl-3.5 text-sm font-medium">
            {s.name}
            <button
              type="button"
              aria-label={`Remove ${s.name}`}
              className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() =>
                start(async () => {
                  const r = await safeAction(() => removeSubcategory(s.id));
                  if (!r.ok) toast.error(r.error);
                  else toast.success(r.data.deleted ? `${s.name} removed.` : `${s.name} hidden — past entries keep it.`);
                })
              }
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          start(async () => {
            const r = await safeAction(() => addSubcategory({ categoryId: category.id, name }));
            if (!r.ok) return void toast.error(r.error);
            setName("");
          });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add to ${category.name}…`} maxLength={40} aria-label="New subcategory" />
        <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
          Add
        </Button>
      </form>
      <button type="button" onClick={onArchive} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive">
        <Archive className="size-3.5" /> Archive {category.name}
      </button>
    </div>
  );
}
