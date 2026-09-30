import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth";
import { getReportData } from "@/lib/data/report";
import { formatMonth, formatRange, isISODate, monthRange, rangeDays, todayISO } from "@/lib/dates";
import { ReportDocument } from "@/lib/pdf/report-document";

export const runtime = "nodejs";

/** Server-side PDF: /api/reports/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults to this month). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const range = isISODate(from) && isISODate(to) && from <= to && rangeDays({ from, to }) <= 366 ? { from, to } : monthRange(todayISO());
  const whole = monthRange(range.from);
  const label = whole.from === range.from && whole.to === range.to ? formatMonth(range.from) : formatRange(range);

  const data = await getReportData(range, label);
  const pdf = await renderToBuffer(<ReportDocument data={data} />);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="moneyfollows-report-${range.from}_${range.to}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
