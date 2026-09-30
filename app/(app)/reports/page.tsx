import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { ReportOptions } from "@/components/reports/report-options";
import { resolvePeriod } from "@/lib/dates";

export const metadata: Metadata = { title: "Reports & export" };

export default function ReportsPage() {
  const current = resolvePeriod("this-month");
  const previous = resolvePeriod("last-month");
  return (
    <Page title="Reports & export" description="Download a polished PDF report or your raw data.">
      <ReportOptions current={current} previous={previous} />
    </Page>
  );
}
