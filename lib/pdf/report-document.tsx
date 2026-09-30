import "server-only";
import path from "node:path";
import { Circle, Document, Font, G, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { MARK_DOT, MARK_PATHS, MARK_STROKE, TILE_RADIUS, BRAND } from "@/components/brand/mark";
import { getCategoryColor } from "@/components/category-icon";
import type { ReportData } from "@/lib/data/report";
import { formatMonth, formatRange, formatShortDate, rangeDays } from "@/lib/dates";
import { formatCompact, formatINR, formatPercent } from "@/lib/format";

// ── Fonts: Inter (latin) + Inter latin-ext for the ₹ glyph, embedded from lib/pdf/fonts.
const fontDir = path.join(process.cwd(), "lib", "pdf", "fonts");
const weights = [400, 500, 600, 700] as const;
Font.register({ family: "Inter", fonts: weights.map((w) => ({ src: path.join(fontDir, `inter-latin-${w}-normal.woff`), fontWeight: w })) });
Font.register({ family: "InterExt", fonts: weights.map((w) => ({ src: path.join(fontDir, `inter-latin-ext-${w}-normal.woff`), fontWeight: w })) });
Font.registerHyphenationCallback((word) => [word]);

const C = {
  brand: BRAND.coral,
  brandSoft: BRAND.coralSoft,
  ink: BRAND.ink,
  muted: "#737373",
  border: "#EDEDED",
  surface: "#FAFAFA",
  income: "#1F9D6B",
  invest: "#5B6CF0",
  warning: "#C98A12",
  success: "#1F9D6B",
};
const FONT = ["Inter", "InterExt"] as unknown as string;

const s = StyleSheet.create({
  page: { fontFamily: FONT, fontSize: 9.5, color: C.ink, paddingTop: 36, paddingBottom: 56, paddingHorizontal: 36, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { fontSize: 15, fontWeight: 700, letterSpacing: -0.4 },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.6 },
  h2: { fontSize: 11.5, fontWeight: 600, marginBottom: 8, letterSpacing: -0.2 },
  muted: { color: C.muted },
  small: { fontSize: 8, color: C.muted },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12 },
  section: { marginTop: 20 },
  row: { flexDirection: "row" },
  money: { fontWeight: 600 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", alignItems: "center", fontSize: 7.5, color: C.muted },
});

function Mark({ size = 22, tile = true }: { size?: number; tile?: boolean }) {
  const fg = tile ? "#FFFFFF" : C.brand;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {tile && <Rect x={0} y={0} width={48} height={48} rx={TILE_RADIUS} ry={TILE_RADIUS} fill={C.brand} />}
      <G>
        {MARK_PATHS.map((d) => (
          <Path key={d} d={d} fill="none" stroke={fg} strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <Circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={fg} />
      </G>
    </Svg>
  );
}

function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <View style={[s.row, { alignItems: "center", gap: 5 }]}>
        <Mark size={10} tile={false} />
        <Text>MoneyFollows · Follow your money.</Text>
      </View>
      <Text>Generated {formatShortDate(generatedAt.slice(0, 10))} {generatedAt.slice(0, 4)}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Delta({ change, pct, goodWhenUp }: { change: number; pct: number | null; goodWhenUp: boolean }) {
  if (change === 0) return <Text style={s.small}>No change</Text>;
  const good = change > 0 === goodWhenUp;
  return (
    <Text style={{ fontSize: 8, color: good ? C.success : C.warning, fontWeight: 500 }}>
      {change > 0 ? "+" : "−"}
      {formatINR(Math.abs(change))}
      {pct !== null ? ` (${formatPercent(Math.abs(pct))})` : ""}
    </Text>
  );
}

function Bar({ ratio, color, height = 5 }: { ratio: number; color: string; height?: number }) {
  return (
    <View style={{ height, backgroundColor: "#F1F1F1", borderRadius: height / 2, flexGrow: 1 }}>
      <View style={{ height, width: `${Math.max(ratio * 100, 1.5)}%`, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

/** Grouped monthly bars drawn with SVG primitives (income / spent / invested). */
function MonthsChart({ months }: { months: ReportData["months"] }) {
  const W = 497;
  const H = 112;
  const left = 34;
  const bottom = 16;
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense, m.investment]));
  const step = (W - left) / months.length;
  const bw = Math.min(12, step / 5);
  const top = 8;
  const y = (v: number) => top + (H - bottom - top) * (1 - v / max);
  const ticks = [0, 0.5, 1].map((t) => t * max);

  return (
    <View>
      <View style={[s.row, { gap: 12, marginBottom: 6 }]}>
        {[
          ["Income", C.income],
          ["Spent", C.brand],
          ["Invested", C.invest],
        ].map(([l, c]) => (
          <View key={l} style={[s.row, { alignItems: "center", gap: 4 }]}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: c }} />
            <Text style={s.small}>{l}</Text>
          </View>
        ))}
      </View>
      <Svg width={W} height={H}>
        {ticks.map((t) => (
          <G key={t}>
            <Rect x={left} y={y(t)} width={W - left} height={0.6} fill={C.border} />
            <Text x={0} y={y(t) + 3} style={{ fontSize: 7, fill: C.muted, fontFamily: FONT } as never}>
              {t === 0 ? "0" : `₹${formatCompact(t)}`}
            </Text>
          </G>
        ))}
        {months.map((m, i) => {
          const x0 = left + i * step + step / 2 - (bw * 3 + 4) / 2;
          return (
            <G key={m.month}>
              {[
                [m.income, C.income],
                [m.expense, C.brand],
                [m.investment, C.invest],
              ].map(([v, c], j) => {
                const val = v as number;
                const top = y(val);
                return val > 0 ? <Rect key={j} x={x0 + j * (bw + 2)} y={top} width={bw} height={H - bottom - top} rx={2} ry={2} fill={c as string} /> : null;
              })}
              <Text x={left + i * step + step / 2 - 8} y={H - 3} style={{ fontSize: 7.5, fill: C.muted, fontFamily: FONT } as never}>
                {formatMonth(m.month, "MMM")}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function TxTable({ rows }: { rows: ReportData["topExpenses"] }) {
  return (
    <View style={[s.card, { padding: 0 }]}>
      {rows.map((t, i) => (
        <View key={t.id} wrap={false} style={[s.row, { paddingVertical: 7, paddingHorizontal: 12, borderTopWidth: i ? 1 : 0, borderColor: C.border, alignItems: "center" }]}>
          <Text style={{ width: 62, color: C.muted }}>{formatShortDate(t.transaction_date)}</Text>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Text style={{ fontWeight: 600 }}>{t.subcategory_name ?? t.category_name}</Text>
            <Text style={s.small}>{[t.subcategory_name ? t.category_name : null, t.description].filter(Boolean).join(" · ")}</Text>
          </View>
          <Text style={s.money}>{formatINR(t.amount)}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReportDocument({ data: r }: { data: ReportData }) {
  const period = formatRange(r.range);
  const kpis = [
    { label: "Income", value: r.totals.income, color: C.income, cmp: r.comparison.income, up: true },
    { label: "Expenses", value: r.totals.expenses, color: C.ink, cmp: r.comparison.expenses, up: false },
    { label: "Investments", value: r.totals.investments, color: C.invest, cmp: r.comparison.investments, up: true },
    { label: "Remaining", value: r.totals.remaining, color: r.totals.remaining < 0 ? C.warning : C.brand, cmp: r.comparison.remaining, up: true },
  ];
  const maxCat = Math.max(1, ...r.categories.map((c) => c.total));

  return (
    <Document title={`MoneyFollows report — ${r.label}`} author="MoneyFollows" subject={`Financial report ${period}`} creator="MoneyFollows">
      {/* ─────────── Summary */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandRow}>
            <Mark size={26} />
            <Text style={s.wordmark}>
              Money<Text style={{ color: C.brand }}>Follows</Text>
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontWeight: 600 }}>{r.userName}</Text>
            <Text style={s.small}>Financial report</Text>
          </View>
        </View>

        <View style={{ backgroundColor: C.brandSoft, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: C.brand, fontWeight: 600, fontSize: 9 }}>REPORT PERIOD</Text>
          <Text style={s.h1}>{r.label}</Text>
          <Text style={s.muted}>
            {period} · compared with {r.previousLabel}
          </Text>
        </View>

        <View style={[s.row, { gap: 8 }]}>
          {kpis.map((k) => (
            <View key={k.label} style={[s.card, { flex: 1 }]}>
              <Text style={s.small}>{k.label}</Text>
              <Text style={{ fontSize: 15, fontWeight: 700, color: k.color, marginTop: 3, letterSpacing: -0.4 }}>{formatINR(k.value)}</Text>
              <View style={{ marginTop: 3 }}>
                <Delta change={k.cmp.change} pct={k.cmp.changePct} goodWhenUp={k.up} />
              </View>
            </View>
          ))}
        </View>

        <View style={[s.row, { gap: 8, marginTop: 8 }]}>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.small}>Savings rate</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{r.totals.savingsRate !== null ? formatPercent(Math.max(r.totals.savingsRate, 0)) : "—"}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.small}>Average daily spend</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{formatINR(r.averageDaily)}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.small}>Family support</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{formatINR(r.family.total)}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.small}>Transactions</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{r.totals.count}</Text>
          </View>
        </View>

        {r.insights.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>Highlights</Text>
            <View style={[s.card, { gap: 5 }]}>
              {r.insights.map((i) => (
                <View key={i.id} style={[s.row, { gap: 6 }]}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, marginTop: 3.5, backgroundColor: i.tone === "warning" ? C.warning : i.tone === "good" ? C.success : C.brand }} />
                  <Text style={{ flexShrink: 1 }}>{i.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.h2}>Last 6 months</Text>
          <View style={s.card}>
            <MonthsChart months={r.months} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2} minPresenceAhead={60}>Where the money went</Text>
          <View style={[s.card, { gap: 7 }]}>
            {r.categories.length === 0 && <Text style={s.muted}>No expenses in this period.</Text>}
            {r.categories.slice(0, 12).map((c) => (
              <View key={c.category_id} wrap={false} style={[s.row, { alignItems: "center", gap: 8 }]}>
                <Text style={{ width: 90, fontWeight: 500 }}>{c.name}</Text>
                <Bar ratio={c.total / maxCat} color={getCategoryColor(c.color).solid} />
                <Text style={{ width: 34, textAlign: "right", color: C.muted }}>{formatPercent(c.share)}</Text>
                <Text style={{ width: 66, textAlign: "right", fontWeight: 600 }}>{formatINR(c.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─────────── Detail (flows onto following pages) */}
        <View style={[s.row, s.section, { gap: 12 }]} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>Month-over-month</Text>
            <View style={[s.card, { padding: 0 }]}>
              <View style={[s.row, { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: C.surface, borderTopLeftRadius: 10, borderTopRightRadius: 10 }]}>
                <Text style={[s.small, { flexGrow: 1 }]}> </Text>
                <Text style={[s.small, { width: 62, textAlign: "right" }]}>Now</Text>
                <Text style={[s.small, { width: 62, textAlign: "right" }]}>Before</Text>
                <Text style={[s.small, { width: 70, textAlign: "right" }]}>Change</Text>
              </View>
              {kpis.map((k) => (
                <View key={k.label} style={[s.row, { paddingVertical: 6, paddingHorizontal: 12, borderTopWidth: 1, borderColor: C.border }]}>
                  <Text style={{ flexGrow: 1, fontWeight: 500 }}>{k.label}</Text>
                  <Text style={{ width: 62, textAlign: "right", fontWeight: 600 }}>{formatINR(k.cmp.current)}</Text>
                  <Text style={{ width: 62, textAlign: "right", color: C.muted }}>{formatINR(k.cmp.previous)}</Text>
                  <View style={{ width: 70, alignItems: "flex-end" }}>
                    <Delta change={k.cmp.change} pct={null} goodWhenUp={k.up} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ width: 190 }}>
            <Text style={s.h2}>Family support</Text>
            <View style={[s.card, { gap: 6 }]}>
              <Text style={{ fontSize: 15, fontWeight: 700 }}>{formatINR(r.family.total)}</Text>
              {r.family.previous > 0 && <Delta change={r.family.total - r.family.previous} pct={null} goodWhenUp />}
              {r.family.breakdown.map((f) => (
                <View key={f.name} style={[s.row, { justifyContent: "space-between" }]}>
                  <Text style={s.muted}>{f.name}</Text>
                  <Text style={{ fontWeight: 600 }}>{formatINR(f.total)}</Text>
                </View>
              ))}
              {r.family.total === 0 && <Text style={s.small}>No family support recorded.</Text>}
            </View>
          </View>
        </View>

        {r.categoryChanges.filter((c) => c.current > 0 || c.previous > 0).length > 0 && (
          <View style={s.section}>
            <Text style={s.h2} minPresenceAhead={60}>Category changes</Text>
            <View style={[s.card, { padding: 0 }]}>
              {r.categoryChanges
                .filter((c) => c.current > 0 || c.previous > 0)
                .slice(0, 8)
                .map((c, i) => (
                  <View key={c.name} wrap={false} style={[s.row, { paddingVertical: 6, paddingHorizontal: 12, borderTopWidth: i ? 1 : 0, borderColor: C.border }]}>
                    <Text style={{ flexGrow: 1, fontWeight: 500 }}>{c.name}</Text>
                    <Text style={{ width: 70, textAlign: "right", fontWeight: 600 }}>{formatINR(c.current)}</Text>
                    <Text style={{ width: 70, textAlign: "right", color: C.muted }}>{formatINR(c.previous)}</Text>
                    <View style={{ width: 90, alignItems: "flex-end" }}>
                      <Delta change={c.change} pct={c.changePct} goodWhenUp={false} />
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {r.topExpenses.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2} minPresenceAhead={60}>Top expenses</Text>
            <TxTable rows={r.topExpenses.slice(0, 6)} />
          </View>
        )}

        {r.purchases.length > 0 && (
          <View style={s.section}>
            <View style={[s.row, { justifyContent: "space-between" }]} minPresenceAhead={60}>
              <Text style={s.h2}>Purchases</Text>
              <Text style={{ fontWeight: 600 }}>{formatINR(r.purchaseTotal)}</Text>
            </View>
            <TxTable rows={r.purchases} />
          </View>
        )}

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>Transaction summary</Text>
          <View style={[s.card, s.row, { justifyContent: "space-between" }]}>
            {[
              ["Transactions", String(r.totals.count)],
              ["Categories used", String(r.categories.length)],
              ["Purchases", String(r.purchases.length)],
              ["Largest expense", r.topExpenses[0] ? formatINR(r.topExpenses[0].amount) : "—"],
              ["Days", String(rangeDays(r.range))],
            ].map(([l, v]) => (
              <View key={l}>
                <Text style={s.small}>{l}</Text>
                <Text style={{ fontWeight: 600, marginTop: 2 }}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.small, { marginTop: 10 }]}>
            Figures are based on what you recorded in MoneyFollows. Planning suggestions are general guidelines, not financial advice.
          </Text>
        </View>

        <Footer generatedAt={r.generatedAt} />
      </Page>
    </Document>
  );
}
