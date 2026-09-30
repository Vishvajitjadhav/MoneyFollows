import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, Plus, Sprout, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon, CATEGORY_COLORS } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories";
import { formatCompact, formatINR } from "@/lib/format";
import { ToastDemo } from "./toast-demo";

export const metadata: Metadata = { title: "Design system" };

const TOKENS = [
  ["brand", "#E85D5D"],
  ["brand-soft", "#FFF1F1"],
  ["background", "#FAFAFA"],
  ["card", "#FFFFFF"],
  ["foreground", "#202020"],
  ["muted-foreground", "#737373"],
  ["border", "#EDEDED"],
  ["success", "#1F9D6B"],
  ["warning", "#C98A12"],
  ["invest", "#5B6CF0"],
] as const;

/** Dev-only visual reference for the MoneyFollows design system. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-12 px-4 py-8 md:px-8 md:py-12">
      <PageHeader
        eyebrow="MoneyFollows"
        title="Design system"
        description="Follow your money. Tokens, type and components in one place."
      />

      <Section title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TOKENS.map(([name, hex]) => (
            <div key={name} className="overflow-hidden rounded-xl border bg-card">
              <div className="h-14" style={{ background: `var(--${name})` }} />
              <div className="p-2.5">
                <p className="text-xs font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{hex}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
            <span
              key={key}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: c.bg, color: c.fg }}
            >
              {key}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Typography & money">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Remaining this month</p>
            <MoneyText amount={27650} size="hero" />
          </div>
          <div className="flex flex-wrap items-baseline gap-6">
            <MoneyText amount={75500} size="xl" tone="income" />
            <MoneyText amount={32850} size="lg" />
            <MoneyText amount={250} size="md" />
            <MoneyText amount={-1400} size="md" tone="warning" />
            <MoneyText amount={5000} size="md" tone="income" signed />
            <MoneyText amount={1234.5} size="sm" tone="muted" />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatINR(100000)} · {formatINR(12500000)} · compact ₹{formatCompact(450000)} · ₹{formatCompact(12500000)}
          </p>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Heading 1 — Follow your money.</h1>
            <h2 className="text-xl font-semibold tracking-tight">Heading 2 — Know where your money goes.</h2>
            <p className="text-base">Body — Recording an expense should take only a few seconds.</p>
            <p className="text-sm text-muted-foreground">Secondary — Lunch · Today, 1:20 PM</p>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xl" className="rounded-full shadow-float">
            <Plus /> Add Expense
          </Button>
          <Button size="lg">Save</Button>
          <Button>Primary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" inputMode="decimal" placeholder="₹0" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quick">Quick entry</Label>
            <Input id="quick" placeholder="250 food lunch" />
          </div>
        </div>
      </Section>

      <Section title="Stat cards (Home)">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Income" amount={75500} icon={ArrowDownLeft} tone="income" />
          <StatCard
            label="Spent"
            amount={32850}
            icon={ArrowUpRight}
            trend={{ value: 1400, label: "vs Aug", goodWhenUp: false }}
          />
          <StatCard label="Invested" amount={15000} icon={Sprout} tone="invest" />
          <StatCard label="Remaining" amount={27650} icon={Wallet} highlight hint="37% of income" />
        </div>
      </Section>

      <Section title="Categories">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {DEFAULT_CATEGORIES.map((c) => (
            <button
              key={`${c.type}-${c.name}`}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-xs font-medium transition hover:border-brand/40 aria-pressed:border-brand aria-pressed:bg-brand-soft"
              aria-pressed={c.name === "Food" && c.type === "EXPENSE"}
            >
              <CategoryIcon icon={c.icon} color={c.color} />
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Lunch", "Dinner", "Breakfast", "Milk", "Snacks", "Restaurant", "Other"].map((s) => (
            <span
              key={s}
              data-selected={s === "Lunch"}
              className="rounded-full border bg-card px-4 py-2 text-sm font-medium data-[selected=true]:border-brand data-[selected=true]:bg-brand-soft data-[selected=true]:text-brand-strong"
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Transaction list">
        <Card className="max-w-md gap-0 py-2">
          {[
            { cat: "food", color: "orange", title: "Lunch", sub: "Food · Office lunch", amt: 250 },
            { cat: "transport", color: "sky", title: "Petrol", sub: "Transport · Bike", amt: 500 },
            { cat: "family", color: "coral", title: "Parents", sub: "Family", amt: 10000 },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3 px-4 py-3">
              <CategoryIcon icon={t.cat} color={t.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">{t.sub}</p>
              </div>
              <MoneyText amount={t.amt} size="sm" />
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Budget progress">
        <div className="grid max-w-md gap-3">
          <BudgetRow name="Food" used={6500} total={8000} />
          <BudgetRow name="Shopping" used={2100} total={5000} />
          <BudgetRow name="Entertainment" used={2600} total={2500} />
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Purchase</Badge>
          <Badge variant="secondary">Monthly</Badge>
          <Badge variant="outline">SIP</Badge>
          <Badge className="bg-success-soft text-success">+12% vs Aug</Badge>
          <Badge className="bg-warning-soft text-warning">82% used</Badge>
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          className="max-w-md"
          title="No expenses yet"
          description="Your first expense takes 5 seconds to add."
          action={
            <Button>
              <Plus /> Add expense
            </Button>
          }
        />
      </Section>

      <Section title="Toasts">
        <ToastDemo />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

function BudgetRow({ name, used, total }: { name: string; used: number; total: number }) {
  const pct = used / total;
  const tone = pct >= 1 ? "bg-destructive" : pct >= 0.8 ? "bg-warning" : "bg-success";
  return (
    <Card size="sm" className="gap-2">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{name}</CardTitle>
        <span className="text-xs text-muted-foreground">{Math.round(pct * 100)}% used</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={Math.min(pct * 100, 100)} className="h-2" indicatorClassName={tone} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            <MoneyText amount={used} size="xs" tone="default" /> of <MoneyText amount={total} size="xs" tone="muted" />
          </span>
          <span>
            {pct >= 1 ? "Over by " : "Left "}
            <MoneyText amount={Math.abs(total - used)} size="xs" tone={pct >= 1 ? "warning" : "default"} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
