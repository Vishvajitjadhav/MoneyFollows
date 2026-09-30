import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { CategoriesManager } from "@/components/settings/categories-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, icon, color, sort_order, is_system, archived_at, subcategories(id, name, category_id, sort_order, archived_at)")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);

  const categories = (data ?? []).map(({ subcategories, ...c }) => ({
    ...c,
    subcategories: (subcategories ?? [])
      .filter((s) => !s.archived_at)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map(({ archived_at: _a, ...s }) => s),
  }));

  return (
    <Page title="Categories" description="Rename, add your own (like Pets → Vet), or archive what you don't use.">
      <CategoriesManager categories={categories} />
    </Page>
  );
}
