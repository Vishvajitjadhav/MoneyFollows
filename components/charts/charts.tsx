"use client";

/**
 * Recharts charts. Loaded lazily via ./index.tsx so they never block first paint.
 * Colors: series follow the entity (income = green, spend = coral, invest = indigo),
 * grid/axes recessive, 2px lines, 4px rounded bar ends, hover tooltips on every chart.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatINR } from "@/lib/format";
import { formatMonth, formatShortDate } from "@/lib/dates";

export const SERIES = {
  income: { label: "Income", color: "var(--income)" },
  expense: { label: "Spent", color: "var(--brand)" },
  investment: { label: "Invested", color: "var(--invest)" },
} as const;

const axis = { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false } as const;
const grid = <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />;
const yTick = (v: number) => (v === 0 ? "0" : `₹${formatCompact(v)}`);

type TipProps = {
  active?: boolean;
  label?: unknown;
  payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown; color?: string }[];
};

function ChartTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border bg-card px-3 py-2 text-xs shadow-card">
      <p className="mb-1.5 font-semibold">{String(label)}</p>
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {String(p.name)}
            </span>
            <span className="money font-semibold text-foreground">{formatINR(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Legend({ keys }: { keys: (keyof typeof SERIES)[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {keys.map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: SERIES[k].color }} />
          {SERIES[k].label}
        </li>
      ))}
    </ul>
  );
}

type MonthRow = { month: string; income: number; expense: number; investment: number };

/** 1. Income vs expense (vs invested) per month — grouped bars. */
export function IncomeExpenseChart({ data }: { data: MonthRow[] }) {
  const rows = data.map((d) => ({ ...d, label: formatMonth(d.month, "MMM") }));
  return (
    <div className="space-y-3">
      <Legend keys={["income", "expense", "investment"]} />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            {grid}
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={48} tickFormatter={yTick} />
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={(p) => <ChartTooltip active={p.active} label={p.label} payload={p.payload} />} />
            {(["income", "expense", "investment"] as const).map((k) => (
              <Bar key={k} dataKey={k} name={SERIES[k].label} fill={SERIES[k].color} radius={[4, 4, 0, 0]} maxBarSize={18} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** 3. Monthly spending trend — single series area. */
export function SpendingTrendChart({ data }: { data: MonthRow[] }) {
  const rows = data.map((d) => ({ ...d, label: formatMonth(d.month, "MMM") }));
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={48} tickFormatter={yTick} />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={(p) => <ChartTooltip active={p.active} label={p.label} payload={p.payload} />}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Spent"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#spendFill)"
            dot={false}
            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2, fill: "var(--brand)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 4. Daily spending — bars per day. */
export function DailySpendingChart({ data }: { data: { day: string; total: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: formatShortDate(d.day) }));
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barCategoryGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...axis} width={48} tickFormatter={yTick} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={(p) => <ChartTooltip active={p.active} label={p.label} payload={p.payload} />} />
          <Bar dataKey="total" name="Spent" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
