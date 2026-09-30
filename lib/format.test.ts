import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCompact, formatINR, formatPercent } from "./format.ts";
import { elapsedDays, formatRange, previousRange, resolvePeriod, todayISO } from "./dates.ts";
import { buildInsights } from "./insights.ts";
import { calculateBudgetUsage } from "./calculations/index.ts";

test("formatINR uses Indian grouping", () => {
  assert.equal(formatINR(100000), "₹1,00,000");
  assert.equal(formatINR(27650), "₹27,650");
  assert.equal(formatINR(1234.5), "₹1,234.50");
  assert.equal(formatINR(-1400), "−₹1,400");
  assert.equal(formatINR(5000, { signed: true }), "+₹5,000");
  assert.equal(formatCompact(450000), "4.5L");
  assert.equal(formatCompact(12500000), "1.3Cr");
  assert.equal(formatPercent(0.823), "82%");
});

test("todayISO is in India time", () => {
  // 20:00 UTC on 30 Sep is 01:30 IST on 1 Oct.
  assert.equal(todayISO(new Date("2026-09-30T20:00:00Z")), "2026-10-01");
});

test("periods", () => {
  const today = "2026-09-30";
  assert.deepEqual(
    { ...resolvePeriod("this-month", {}, today) },
    { from: "2026-09-01", to: "2026-09-30", label: "September 2026" },
  );
  assert.equal(resolvePeriod("last-month", {}, today).from, "2026-08-01");
  assert.equal(resolvePeriod("last-3-months", {}, today).from, "2026-07-01");
  assert.equal(resolvePeriod("this-year", {}, today).to, "2026-12-31");
  assert.equal(resolvePeriod("custom", { from: "2026-09-10", to: "2026-09-12" }, today).label, "10 Sep – 12 Sep 2026");
  assert.equal(resolvePeriod("custom", { from: "bad" }, today).from, "2026-09-01");
  assert.deepEqual(previousRange({ from: "2026-03-01", to: "2026-03-31" }), { from: "2026-02-01", to: "2026-02-28" });
  assert.deepEqual(previousRange({ from: "2026-07-01", to: "2026-09-30" }), { from: "2026-04-01", to: "2026-06-30" });
  assert.deepEqual(previousRange({ from: "2026-09-10", to: "2026-09-12" }), { from: "2026-09-07", to: "2026-09-09" });
  assert.equal(elapsedDays({ from: "2026-09-01", to: "2026-09-30" }, "2026-09-15"), 15);
  assert.equal(formatRange({ from: "2026-09-01", to: "2026-09-01" }), "1 Sep 2026");
});

test("insights only appear when supported by data", () => {
  const empty = buildInsights({
    periodLabel: "this month", previousLabel: "last month", expenses: 0, previousExpenses: 0,
    categories: [], previousCategories: [], averageDaily: 0, familySupport: 0, previousFamilySupport: 0, hasPrevious: false,
  });
  assert.deepEqual(empty, []);

  const texts = buildInsights({
    periodLabel: "this month", previousLabel: "last month", expenses: 31500, previousExpenses: 28000,
    categories: [{ name: "Food", total: 8200 }, { name: "Shopping", total: 1580 }],
    previousCategories: [{ name: "Food", total: 6800 }, { name: "Shopping", total: 2000 }],
    averageDaily: 1050, familySupport: 12000, previousFamilySupport: 10000, hasPrevious: true,
    budgets: [{ name: "Food", usage: calculateBudgetUsage(10000, 8200) }],
  }, 10).map((i) => i.text);

  assert.ok(texts.includes("You spent ₹8,200 on Food this month."), texts.join("\n"));
  assert.ok(texts.includes("Food spending increased by ₹1,400 compared with last month."), texts.join("\n"));
  assert.ok(texts.includes("Shopping spending is 21% lower than last month."), texts.join("\n"));
  assert.ok(texts.includes("You have used 82% of your Food budget."), texts.join("\n"));
  assert.ok(texts.includes("Family support increased by ₹2,000 this month."), texts.join("\n"));
  assert.ok(texts.includes("Your average daily spending is ₹1,050."), texts.join("\n"));
});
