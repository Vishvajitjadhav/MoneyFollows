import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, parseQuickEntry, type ParserCategory } from "./quick-entry.ts";
import { DEFAULT_CATEGORIES } from "../constants/categories.ts";

const cats: ParserCategory[] = DEFAULT_CATEGORIES.map((c, i) => ({
  id: `${c.type}:${c.name}`,
  name: c.name,
  type: c.type,
  icon: c.icon,
  subcategories: c.subcategories.map((s) => ({ id: `${c.type}:${c.name}:${s}`, name: s })),
}));
// A custom category, like a user would create.
cats.push({ id: "EXPENSE:Pets", name: "Pets", type: "EXPENSE", icon: "pets", subcategories: [
  { id: "EXPENSE:Pets:Food", name: "Food" }, { id: "EXPENSE:Pets:Vet", name: "Vet" },
] });

const parse = (t: string) => parseQuickEntry(t, cats);

test("spec examples", () => {
  assert.deepEqual(parse("250 food lunch"), {
    amount: 250, type: "EXPENSE", categoryId: "EXPENSE:Food", subcategoryId: "EXPENSE:Food:Lunch", description: null,
  });
  assert.deepEqual(parse("500 petrol bike"), {
    amount: 500, type: "EXPENSE", categoryId: "EXPENSE:Transport", subcategoryId: "EXPENSE:Transport:Petrol", description: "Bike",
  });
  assert.equal(parse("10000 parents")?.subcategoryId, "EXPENSE:Family:Parents");
  assert.equal(parse("350 movie")?.subcategoryId, "EXPENSE:Entertainment:Movie");
});

test("word order and plurals don't matter", () => {
  assert.equal(parse("lunch 250 food")?.subcategoryId, "EXPENSE:Food:Lunch");
  assert.equal(parse("120 snack")?.subcategoryId, "EXPENSE:Food:Snacks");
  assert.equal(parse("600 books")?.subcategoryId, "EXPENSE:Education:Books");
  assert.equal(parse("1200 shoe")?.subcategoryId, "EXPENSE:Shopping:Shoes");
});

test("two-word subcategories", () => {
  assert.equal(parse("800 bike service")?.subcategoryId, "EXPENSE:Transport:Bike Service");
});

test("category chosen explicitly wins for shared subcategory names", () => {
  assert.equal(parse("900 shopping accessories")?.subcategoryId, "EXPENSE:Shopping:Accessories");
  assert.equal(parse("900 accessories shopping")?.subcategoryId, "EXPENSE:Shopping:Accessories");
  assert.equal(parse("400 pets food")?.subcategoryId, "EXPENSE:Pets:Food");
  assert.equal(parse("400 vet")?.categoryId, "EXPENSE:Pets");
});

test("aliases for everyday words", () => {
  assert.equal(parse("180 uber")?.subcategoryId, "EXPENSE:Transport:Cab");
  assert.equal(parse("5000 mom")?.subcategoryId, "EXPENSE:Family:Parents");
  assert.equal(parse("649 netflix")?.subcategoryId, "EXPENSE:Entertainment:OTT");
  const swiggy = parse("450 swiggy dinner");
  assert.equal(swiggy?.subcategoryId, "EXPENSE:Food:Dinner");
  assert.equal(swiggy?.description, "Swiggy");
});

test("income and investment", () => {
  assert.deepEqual(parse("65000 salary"), {
    amount: 65000, type: "INCOME", categoryId: "INCOME:Salary", subcategoryId: null, description: null,
  });
  assert.equal(parse("10000 sip")?.type, "INVESTMENT");
});

test("amount formats", () => {
  assert.equal(parseAmount("₹2,500"), 2500);
  assert.equal(parseAmount("2.5k"), 2500);
  assert.equal(parseAmount("1L"), 100000);
  assert.equal(parseAmount("99.50"), 99.5);
  assert.equal(parseAmount("0"), null);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parse("1.5k swiggy dinner")?.amount, 1500);
});

test("unknown words become the description; no amount → null", () => {
  const r = parse("300 random thing");
  assert.equal(r?.categoryId, null);
  assert.equal(r?.description, "Random thing");
  assert.equal(parse("food lunch"), null);
});
