import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, CustomField } from "@/types/app";

/** Active categories with their active subcategories, in display order. Cached per request. */
export const getCategories = cache(async (options: { includeArchived?: boolean } = {}): Promise<Category[]> => {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("id, name, type, icon, color, sort_order, is_system, archived_at, subcategories(id, name, category_id, sort_order, archived_at)")
    .order("type")
    .order("sort_order")
    .order("name");
  if (!options.includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load categories: ${error.message}`);

  return (data ?? []).map(({ subcategories, ...c }) => ({
    ...c,
    subcategories: (subcategories ?? [])
      .filter((s) => options.includeArchived || !s.archived_at)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map(({ archived_at: _archived, ...s }) => s),
  }));
});

export const getCustomFields = cache(async (): Promise<CustomField[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("id, name, field_type, options, sort_order")
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Could not load custom fields: ${error.message}`);
  return data ?? [];
});
