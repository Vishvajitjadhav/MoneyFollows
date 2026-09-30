import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { CustomFieldsManager } from "@/components/settings/custom-fields-manager";
import { getCustomFields } from "@/lib/data/categories";

export const metadata: Metadata = { title: "Custom fields" };

export default async function CustomFieldsPage() {
  const fields = await getCustomFields();
  return (
    <Page title="Custom fields" description="Optional extra details for your transactions — never required.">
      <CustomFieldsManager fields={fields} />
    </Page>
  );
}
