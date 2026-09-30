import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { sampleReport } from "@/lib/dev/sample-data";
import { ReportDocument } from "@/lib/pdf/report-document";

export const runtime = "nodejs";

/** DEV ONLY: the PDF report rendered with sample data. 404 in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const pdf = await renderToBuffer(<ReportDocument data={sampleReport()} />);
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="sample-report.pdf"' },
  });
}
