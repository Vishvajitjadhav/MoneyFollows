import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findTransactions } from "@/lib/data/analytics";
import { todayISO } from "@/lib/dates";
import { parseHistoryParams, toFilters } from "@/lib/validations/filters";

const BATCH = 200;
const MAX_ROWS = 20_000;

/** RFC 4180 field; also neutralises spreadsheet formula injection (=, +, -, @). */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of the user's transactions, honouring the same filters as History. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const params = parseHistoryParams(Object.fromEntries(request.nextUrl.searchParams));
  const lines = ["Date,Type,Category,Subcategory,Amount,Description,Notes"];

  for (let offset = 0; offset < MAX_ROWS; offset += BATCH) {
    const page = await findTransactions({ ...toFilters({ ...params, page: undefined }, BATCH), offset });
    for (const t of page.rows) {
      lines.push(
        [t.transaction_date, t.type, t.category_name, t.subcategory_name, t.amount.toFixed(2).replace(/\.00$/, ""), t.description, t.notes]
          .map(cell)
          .join(","),
      );
    }
    if (page.rows.length < BATCH) break;
  }

  const range = params.from || params.to ? `${params.from ?? "start"}_to_${params.to ?? todayISO()}` : todayISO();
  return new NextResponse(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moneyfollows-${range}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
