"use client";

import { useState } from "react";
import { Calendar, Hash, List, Plus, ToggleLeft, Type } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Field, FormSheet, Select } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { archiveCustomField, saveCustomField } from "@/lib/actions/settings";
import type { CustomField } from "@/types/app";

const TYPES = [
  { value: "TEXT", label: "Text", icon: Type },
  { value: "NUMBER", label: "Number", icon: Hash },
  { value: "DROPDOWN", label: "Dropdown", icon: List },
  { value: "BOOLEAN", label: "Yes / No", icon: ToggleLeft },
  { value: "DATE", label: "Date", icon: Calendar },
] as const;

type FieldType = (typeof TYPES)[number]["value"];
type Draft = { id?: string; name: string; fieldType: FieldType; options: string };

const IDEAS: Draft[] = [
  { name: "Payment Method", fieldType: "DROPDOWN", options: "UPI, Card, Cash, Net banking" },
  { name: "Brand", fieldType: "TEXT", options: "" },
  { name: "Vehicle", fieldType: "DROPDOWN", options: "Bike, Car" },
  { name: "Location", fieldType: "TEXT", options: "" },
  { name: "Occasion", fieldType: "TEXT", options: "" },
];

export function CustomFieldsManager({ fields }: { fields: CustomField[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const openDraft = (d: Draft) => {
    setDraft(d);
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openDraft({ name: "", fieldType: "TEXT", options: "" })}>
          <Plus /> New field
        </Button>
        {IDEAS.filter((i) => !fields.some((f) => f.name.toLowerCase() === i.name.toLowerCase())).map((i) => (
          <Button key={i.name} variant="outline" size="sm" className="h-11 md:h-9" onClick={() => openDraft(i)}>
            {i.name}
          </Button>
        ))}
      </div>

      {fields.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={List}
          title="No custom fields"
          description="Add optional details like Payment Method or Brand. They appear under “More” when you add an expense."
        />
      ) : (
        <ul className="mt-5 divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
          {fields.map((f) => {
            const t = TYPES.find((x) => x.value === f.field_type)!;
            const options = Array.isArray(f.options) ? (f.options as string[]) : [];
            return (
              <li key={f.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60"
                  onClick={() => openDraft({ id: f.id, name: f.name, fieldType: f.field_type, options: options.join(", ") })}
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-muted">
                    <t.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{f.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.label}
                      {options.length ? ` · ${options.join(", ")}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {draft && (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title={draft.id ? "Edit field" : "New field"}
          successMessage="Field saved."
          onSubmit={() =>
            saveCustomField(draft.id ?? null, {
              name: draft.name,
              fieldType: draft.fieldType,
              options: draft.options
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean),
            })
          }
          onDelete={draft.id ? () => archiveCustomField(draft.id!) : undefined}
          deleteLabel="this field (saved values are kept)"
        >
          <Field label="Name" htmlFor="cf-name">
            <Input id="cf-name" value={draft.name} placeholder="e.g. Payment Method" maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Type" htmlFor="cf-type" hint={draft.id ? "Type can't change after creating the field." : undefined}>
            <Select id="cf-type" value={draft.fieldType} disabled={Boolean(draft.id)} onChange={(e) => setDraft({ ...draft, fieldType: e.target.value as FieldType })}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          {draft.fieldType === "DROPDOWN" && (
            <Field label="Options" htmlFor="cf-options" hint="Separate with commas.">
              <Input id="cf-options" value={draft.options} placeholder="UPI, Card, Cash" onChange={(e) => setDraft({ ...draft, options: e.target.value })} />
            </Field>
          )}
        </FormSheet>
      )}
    </>
  );
}
