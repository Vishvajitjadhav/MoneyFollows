"use client";

import { useState, useTransition } from "react";
import { differenceInCalendarMonths } from "date-fns";
import { Goal, PartyPopper, Plus } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { AmountInput, Field, FormSheet } from "@/components/form-sheet";
import { MoneyText } from "@/components/money-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { contributeToGoal, deleteGoal, saveGoal } from "@/lib/actions/planning";
import { formatShortDate, fromISO, todayISO } from "@/lib/dates";
import { formatINR, formatPercent } from "@/lib/format";
import type { Tables } from "@/types/database";

type GoalRow = Pick<Tables<"financial_goals">, "id" | "name" | "target_amount" | "current_amount" | "target_date" | "icon" | "color" | "achieved_at">;
type Draft = { id?: string; name: string; target: string; current: string; date: string; icon: string; color: string };

const PRESETS = [
  { name: "Emergency Fund", icon: "health", color: "green" },
  { name: "New Laptop", icon: "freelance", color: "indigo" },
  { name: "Travel", icon: "growth", color: "sky" },
  { name: "Bike", icon: "transport", color: "orange" },
  { name: "Vacation", icon: "entertainment", color: "amber" },
];

export function GoalsManager({ goals }: { goals: GoalRow[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<{ goal: GoalRow; amount: string } | null>(null);

  const openNew = (preset?: (typeof PRESETS)[number]) => {
    setDraft({ name: preset?.name ?? "", target: "", current: "", date: "", icon: preset?.icon ?? "growth", color: preset?.color ?? "green" });
    setOpen(true);
  };

  return (
    <>
      <Button onClick={() => openNew()}>
        <Plus /> New goal
      </Button>

      {goals.length === 0 ? (
        <div className="mt-5 space-y-4">
          <EmptyState icon={Goal} title="Save for something" description="Set a target and watch the bar fill up. Start with one of these:" />
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <Button key={p.name} variant="outline" size="sm" onClick={() => openNew(p)}>
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                setDraft({
                  id: g.id,
                  name: g.name,
                  target: String(g.target_amount),
                  current: String(g.current_amount),
                  date: g.target_date ?? "",
                  icon: g.icon,
                  color: g.color,
                });
                setOpen(true);
              }}
              onAdd={() => setAdding({ goal: g, amount: "" })}
            />
          ))}
        </div>
      )}

      {draft && (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title={draft.id ? "Edit goal" : "New goal"}
          successMessage="Goal saved."
          onSubmit={() =>
            saveGoal(draft.id ?? null, {
              name: draft.name,
              targetAmount: draft.target,
              currentAmount: draft.current || 0,
              targetDate: draft.date,
              icon: draft.icon,
              color: draft.color,
            })
          }
          onDelete={draft.id ? () => deleteGoal(draft.id!) : undefined}
          deleteLabel="this goal"
        >
          <Field label="Goal" htmlFor="g-name">
            <Input id="g-name" value={draft.name} placeholder="Emergency Fund" maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target" htmlFor="g-target">
              <AmountInput id="g-target" value={draft.target} onChange={(target) => setDraft({ ...draft, target })} placeholder="100000" />
            </Field>
            <Field label="Saved so far" htmlFor="g-current">
              <AmountInput id="g-current" value={draft.current} onChange={(current) => setDraft({ ...draft, current })} />
            </Field>
          </div>
          <Field label="Target date (optional)" htmlFor="g-date">
            <Input id="g-date" type="date" min={todayISO()} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
        </FormSheet>
      )}

      {adding && (
        <ContributionSheet
          key={adding.goal.id}
          goal={adding.goal}
          onClose={() => setAdding(null)}
        />
      )}
    </>
  );
}

function GoalCard({ goal, onEdit, onAdd }: { goal: GoalRow; onEdit: () => void; onAdd: () => void }) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const ratio = target > 0 ? current / target : 0;
  const done = current >= target;
  const monthsLeft = goal.target_date ? Math.max(1, differenceInCalendarMonths(fromISO(goal.target_date), fromISO(todayISO()))) : null;
  const perMonth = monthsLeft && !done ? Math.ceil((target - current) / monthsLeft) : null;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <button type="button" onClick={onEdit} className="flex w-full items-center gap-3 text-left">
        <CategoryIcon icon={goal.icon} color={goal.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            {done ? "Goal reached 🎉" : goal.target_date ? `By ${formatShortDate(goal.target_date)}${perMonth ? ` · ${formatINR(perMonth)}/month` : ""}` : "No deadline"}
          </p>
        </div>
        <span className="text-sm font-semibold">{formatPercent(Math.min(ratio, 1))}</span>
      </button>
      <Progress value={Math.min(ratio * 100, 100)} className="mt-4 h-2.5" indicatorClassName={done ? "bg-success" : "bg-brand"} />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm">
          <MoneyText amount={current} size="md" /> <span className="text-muted-foreground">of </span>
          <MoneyText amount={target} size="sm" tone="muted" />
        </p>
        {!done && (
          <Button size="sm" variant="soft" onClick={onAdd}>
            <Plus /> Add money
          </Button>
        )}
      </div>
    </div>
  );
}

function ContributionSheet({ goal, onClose }: { goal: GoalRow; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [, start] = useTransition();
  return (
    <FormSheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Add to ${goal.name}`}
      submitLabel="Add"
      successMessage="Saved."
      onSubmit={async () => {
        const r = await contributeToGoal({ id: goal.id, amount });
        if (r.ok && r.data.achieved) start(() => void toast(`You reached ${goal.name}!`, { icon: <PartyPopper className="size-4 text-brand" /> }));
        return r;
      }}
    >
      <Field label="Amount" htmlFor="c-amt" hint="Tip: use a negative amount to take money out.">
        <AmountInput id="c-amt" value={amount} onChange={setAmount} />
      </Field>
    </FormSheet>
  );
}
