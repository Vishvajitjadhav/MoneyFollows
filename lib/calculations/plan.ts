/**
 * Suggested monthly allocation — a general starting point, NOT financial advice.
 * Fixed commitments (rent, EMI, family support) are respected first, then the
 * rest is split across investing, saving and lifestyle.
 */

export type PlanInputs = {
  income: number;
  rent: number;
  emi: number;
  familySupport: number;
  investments: number;
  goals: number;
};

export const BUCKETS = [
  { key: "needs", label: "Needs", hint: "Rent, EMI, bills, groceries, commute" },
  { key: "family", label: "Family support", hint: "Money you send home" },
  { key: "investments", label: "Investments", hint: "SIPs, mutual funds, PPF" },
  { key: "savings", label: "Savings", hint: "Emergency fund and goals" },
  { key: "lifestyle", label: "Lifestyle", hint: "Eating out, shopping, fun" },
  { key: "flexible", label: "Flexible", hint: "Buffer for the unexpected" },
] as const;

export type BucketKey = (typeof BUCKETS)[number]["key"];
export type Allocation = Record<BucketKey, number>; // whole percentages, sum = 100

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function suggestAllocation(inputs: PlanInputs): Allocation {
  const income = inputs.income;
  if (income <= 0) return { needs: 50, family: 0, investments: 15, savings: 10, lifestyle: 20, flexible: 5 };

  // Needs: fixed housing + EMI, plus ~20% for food, bills and commute.
  let needs = clamp((inputs.rent + inputs.emi) / income + 0.2, 0.3, 0.75);
  const family = clamp(inputs.familySupport / income, 0, 0.4);
  let investments = Math.max(inputs.investments / income, 0.15);
  let savings = Math.max(inputs.goals / income, 0.1);

  let left = 1 - needs - family - investments - savings;
  if (left < 0.05) {
    // Not enough room — shrink investing/saving (keep at least what's already committed), then needs.
    const committedInv = Math.min(inputs.investments / income, investments);
    const committedSav = Math.min(inputs.goals / income, savings);
    const shortfall = 0.05 - left;
    const flex = investments - committedInv + (savings - committedSav);
    if (flex > 0) {
      const cut = Math.min(shortfall, flex);
      investments -= (cut * (investments - committedInv)) / flex;
      savings -= (cut * (savings - committedSav)) / flex;
    }
    left = 1 - needs - family - investments - savings;
    if (left < 0.05) needs = Math.max(0, needs - (0.05 - left));
    left = Math.max(0, 1 - needs - family - investments - savings);
  }

  const pct = {
    needs: Math.round(needs * 100),
    family: Math.round(family * 100),
    investments: Math.round(investments * 100),
    savings: Math.round(savings * 100),
    lifestyle: Math.round(left * 0.7 * 100),
    flexible: 0,
  };
  pct.flexible = Math.max(0, 100 - pct.needs - pct.family - pct.investments - pct.savings - pct.lifestyle);
  return pct;
}

export function allocationAmounts(income: number, allocation: Allocation) {
  return BUCKETS.map((b) => ({
    ...b,
    pct: allocation[b.key] ?? 0,
    amount: Math.round((income * (allocation[b.key] ?? 0)) / 100),
  }));
}

export const allocationTotal = (a: Partial<Allocation>) =>
  Object.values(a).reduce<number>((s, v) => s + (Number(v) || 0), 0);
