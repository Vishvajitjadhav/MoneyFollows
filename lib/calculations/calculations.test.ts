import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAverageDaily,
  calculateBudgetUsage,
  calculateCategoryTotals,
  calculateFamilySupport,
  calculateInvestments,
  calculateMonthlyComparison,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculatePurchaseTotals,
  calculateRemaining,
  calculateSavingsRate,
  calculateSubcategoryTotals,
  compareCategoryTotals,
  summarize,
  type TxLike,
} from "./index.ts";
import { allocationTotal, suggestAllocation } from "./plan.ts";

const txs: TxLike[] = [
  { type: "INCOME", amount: 65000, category_name: "Salary" },
  { type: "INCOME", amount: 8000, category_name: "Freelance" },
  { type: "INCOME", amount: 2500, category_name: "Side income" },
  { type: "EXPENSE", amount: 12000, category_id: "h", category_name: "Housing", subcategory_name: "Rent" },
  { type: "EXPENSE", amount: 250, category_id: "f", category_name: "Food", subcategory_id: "l", subcategory_name: "Lunch" },
  { type: "EXPENSE", amount: 150, category_id: "f", category_name: "Food", subcategory_id: "l", subcategory_name: "Lunch" },
  { type: "EXPENSE", amount: 400, category_id: "f", category_name: "Food", subcategory_id: "d", subcategory_name: "Dinner" },
  { type: "EXPENSE", amount: 10000, category_id: "fam", category_name: "Family", subcategory_name: "Parents" },
  { type: "EXPENSE", amount: 8500, category_id: "s", category_name: "Shopping", is_purchase: true, description: "Watch" },
  { type: "EXPENSE", amount: 1550, category_id: "s", category_name: "Shopping", is_purchase: true, description: "Shoes" },
  { type: "INVESTMENT", amount: 15000, category_name: "SIP" },
];

test("income / expenses / investments / remaining (spec example)", () => {
  assert.equal(calculateMonthlyIncome(txs), 75500);
  assert.equal(calculateMonthlyExpenses(txs), 32850);
  assert.equal(calculateInvestments(txs), 15000);
  assert.equal(calculateRemaining(75500, 32850, 15000), 27650);
});

test("savings rate", () => {
  assert.equal(calculateSavingsRate(100000, 60000), 0.4);
  assert.equal(calculateSavingsRate(0, 500), null);
});

test("summarize period_summary rows", () => {
  const t = summarize([
    { type: "INCOME", total: 75500, count: 3 },
    { type: "EXPENSE", total: 32850, count: 7 },
    { type: "INVESTMENT", total: 15000, count: 1 },
  ]);
  assert.equal(t.remaining, 27650);
  assert.equal(t.count, 11);
  assert.ok(Math.abs(t.savingsRate! - 0.5649) < 0.001);
  assert.equal(summarize([]).remaining, 0);
});

test("category + subcategory totals", () => {
  const cats = calculateCategoryTotals(txs);
  assert.equal(cats[0].name, "Housing");
  assert.equal(cats.find((c) => c.name === "Food")?.total, 800);
  const subs = calculateSubcategoryTotals(txs, "f");
  assert.deepEqual(subs.map((s) => [s.name, s.total, s.count]), [["Lunch", 400, 2], ["Dinner", 400, 1]]);
  assert.ok(Math.abs(cats.reduce((s, c) => s + c.share, 0) - 1) < 1e-9);
});

test("month-over-month comparison", () => {
  assert.deepEqual(calculateMonthlyComparison(8200, 6800), { current: 8200, previous: 6800, change: 1400, changePct: 1400 / 6800 });
  assert.equal(calculateMonthlyComparison(500, 0).changePct, null);
});

test("budget usage thresholds", () => {
  assert.deepEqual(calculateBudgetUsage(8000, 6500), { budget: 8000, used: 6500, remaining: 1500, ratio: 0.8125, status: "warning" });
  assert.equal(calculateBudgetUsage(8000, 2000).status, "ok");
  assert.equal(calculateBudgetUsage(8000, 8001).status, "over");
  assert.equal(calculateBudgetUsage(8000, 8000).status, "warning");
});

test("family support by icon (survives renames)", () => {
  assert.equal(calculateFamilySupport([{ name: "Home", icon: "family", total: 12000 }, { name: "Food", icon: "food", total: 800 }]), 12000);
  assert.equal(calculateFamilySupport([{ name: "Family", total: 5000 }]), 5000);
});

test("purchases", () => {
  const p = calculatePurchaseTotals(txs);
  assert.equal(p.total, 10050);
  assert.equal(p.count, 2);
  assert.equal(p.largest?.description, "Watch");
});

test("average daily + category changes", () => {
  assert.equal(calculateAverageDaily(31500, 30), 1050);
  assert.equal(calculateAverageDaily(100, 0), 0);
  const ch = compareCategoryTotals([{ name: "Food", total: 8200 }, { name: "Shopping", total: 1000 }], [{ name: "Food", total: 6800 }, { name: "Travel", total: 3000 }]);
  assert.equal(ch[0].name, "Travel");
  assert.equal(ch.find((c) => c.name === "Food")?.change, 1400);
});

test("plan allocation always sums to 100 and respects commitments", () => {
  const cases = [
    { income: 75500, rent: 12000, emi: 0, familySupport: 10000, investments: 15000, goals: 5000 },
    { income: 30000, rent: 15000, emi: 5000, familySupport: 8000, investments: 3000, goals: 0 },
    { income: 200000, rent: 30000, emi: 20000, familySupport: 0, investments: 50000, goals: 20000 },
    { income: 0, rent: 0, emi: 0, familySupport: 0, investments: 0, goals: 0 },
  ];
  for (const c of cases) {
    const a = suggestAllocation(c);
    assert.equal(allocationTotal(a), 100, JSON.stringify({ c, a }));
    Object.values(a).forEach((v) => assert.ok(v >= 0));
    if (c.income > 0) assert.ok(a.family >= Math.floor((c.familySupport / c.income) * 100) - 1);
  }
});
