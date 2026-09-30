/**
 * Tests for the SQL analytics/search/recurring functions (0004_analytics.sql).
 * Runs in one transaction and rolls back.
 *
 *   npm run db:test               (local PGlite, includes RLS tests)
 *   node --env-file=.env.local scripts/test-db-functions.mts   (Supabase)
 */
import { connect, isLocal, migrate } from "./lib/db.mts";

const db = await connect();
if (isLocal()) await migrate(db, false);

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail: unknown = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail !== "" ? ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
}
const num = (v: unknown) => Number(v);

async function actAs(userId: string) {
  await db.query("set local role authenticated");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
}

try {
  await db.query("begin");
  const [a, b] = (
    await db.query<{ id: string }>(`
      insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
      values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fa@test.local', '{"full_name":"A"}'),
             (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fb@test.local', '{"full_name":"B"}')
      returning id`)
  ).rows.map((r) => r.id);

  const cat = async (u: string, name: string, type = "EXPENSE") =>
    (await db.query("select id from public.categories where user_id=$1 and name=$2 and type=$3", [u, name, type])).rows[0].id;
  const sub = async (c: string, name: string) =>
    (await db.query("select id from public.subcategories where category_id=$1 and name=$2", [c, name])).rows[0].id;

  const food = await cat(a, "Food");
  const lunch = await sub(food, "Lunch");
  const dinner = await sub(food, "Dinner");
  const transport = await cat(a, "Transport");
  const petrol = await sub(transport, "Petrol");
  const ent = await cat(a, "Entertainment");
  const movie = await sub(ent, "Movie");
  const shopping = await cat(a, "Shopping");
  const watch = await sub(shopping, "Watch");
  const salary = await cat(a, "Salary", "INCOME");
  const sip = await cat(a, "SIP", "INVESTMENT");
  const bFood = await cat(b, "Food");

  const tx = (u: string, type: string, amount: number, c: string, s: string | null, date: string, desc: string | null = null, purchase = false) =>
    db.query(
      "insert into public.transactions (user_id, type, amount, category_id, subcategory_id, transaction_date, description, is_purchase) values ($1,$2,$3,$4,$5,$6,$7,$8)",
      [u, type, amount, c, s, date, desc, purchase],
    );

  await tx(a, "INCOME", 65000, salary, null, "2026-09-01", "September salary");
  await tx(a, "EXPENSE", 250, food, lunch, "2026-09-12", "Office lunch");
  await tx(a, "EXPENSE", 400, food, dinner, "2026-09-12");
  await tx(a, "EXPENSE", 500, transport, petrol, "2026-09-24", "Bike");
  await tx(a, "EXPENSE", 250, ent, movie, "2026-09-24", "Movie night");
  await tx(a, "EXPENSE", 350, ent, movie, "2026-08-18");
  await tx(a, "EXPENSE", 8500, shopping, watch, "2026-09-20", "Casio watch", true);
  await tx(a, "INVESTMENT", 10000, sip, null, "2026-09-05");
  await tx(a, "EXPENSE", 700, transport, petrol, "2026-08-10");
  await tx(b, "EXPENSE", 99999, bFood, null, "2026-09-12", "B's lunch movie");

  await db.query("savepoint as_a");
  await actAs(a);

  const summary = await db.query("select * from public.period_summary('2026-09-01','2026-09-30')");
  const by = Object.fromEntries(summary.rows.map((r) => [r.type, num(r.total)]));
  check("period_summary totals by type (and ignores user B)", by.INCOME === 65000 && by.EXPENSE === 9900 && by.INVESTMENT === 10000, by);

  const cats = await db.query("select * from public.category_totals('2026-09-01','2026-09-30')");
  check("category_totals sorted desc", cats.rows[0].name === "Shopping" && num(cats.rows[0].total) === 8500, cats.rows.map((r) => `${r.name}:${num(r.total)}`).join(" "));
  const foodRow = cats.rows.find((r) => r.name === "Food");
  check("category_totals Food = 650 over 2", num(foodRow?.total) === 650 && num(foodRow?.count) === 2);

  const purchases = await db.query("select * from public.category_totals('2026-09-01','2026-09-30','EXPENSE', true)");
  check("category_totals purchase-only", purchases.rows.length === 1 && purchases.rows[0].name === "Shopping");

  const subs = await db.query("select * from public.subcategory_totals($1,'2026-09-01','2026-09-30')", [food]);
  check("subcategory_totals drill-down", subs.rows.length === 2 && subs.rows[0].name === "Dinner" && num(subs.rows[0].total) === 400);

  const daily = await db.query("select day::text as day, total from public.daily_totals('2026-09-01','2026-09-30')");
  const d24 = daily.rows.find((r) => r.day === "2026-09-24");
  check("daily_totals per day", daily.rows.length === 3 && num(d24?.total) === 750, daily.rows.map((r) => num(r.total)));

  const monthly = await db.query("select * from public.monthly_totals('2026-08-01','2026-09-30')");
  check(
    "monthly_totals per month",
    monthly.rows.length === 2 && num(monthly.rows[0].expense) === 1050 && num(monthly.rows[1].expense) === 9900 && num(monthly.rows[1].income) === 65000,
    monthly.rows.map((r) => [num(r.income), num(r.expense), num(r.investment)]),
  );

  const search = await db.query("select * from public.find_transactions(p_query => 'movie')");
  check(
    "search 'movie' matches subcategory + description, total 600",
    search.rows.length === 2 && num(search.rows[0].total_count) === 2 && num(search.rows[0].total_expense) === 600,
    search.rows.map((r) => `${r.transaction_date}:${num(r.amount)}`),
  );
  check("search never returns other users' rows", !search.rows.some((r) => num(r.amount) === 99999));

  const petrolSep = await db.query(
    "select * from public.find_transactions(p_from => '2026-09-01', p_to => '2026-09-30', p_subcategory_id => $1)",
    [petrol],
  );
  check("filter September + Petrol", petrolSep.rows.length === 1 && num(petrolSep.rows[0].total_expense) === 500);

  const range = await db.query("select * from public.find_transactions(p_min => 300, p_max => 1000, p_type => 'EXPENSE')");
  check("amount range filter", range.rows.length === 4, range.rows.map((r) => num(r.amount)));

  const page = await db.query("select * from public.find_transactions(p_limit => 3, p_offset => 3)");
  check("pagination keeps whole-set totals", page.rows.length === 3 && num(page.rows[0].total_count) === 9);

  const text = await db.query("select * from public.find_transactions(p_query => 'food')");
  check("search by category name", text.rows.length === 2);

  // ── recurring
  const nx = async (start: string, after: string, f: string) =>
    String((await db.query("select public.recurrence_next($1::date,$2::date,$3::public.recurrence_frequency)::text d", [start, after, f])).rows[0].d);
  const iso = (v: string) => v.slice(0, 10);
  const rn1 = iso(await nx("2026-01-31", "2026-01-31", "MONTHLY"));
  const rn2 = iso(await nx("2026-01-31", "2026-02-28", "MONTHLY"));
  check("monthly recurrence anchors to start day (31 Jan → 28 Feb → 31 Mar)", rn1 === "2026-02-28" && rn2 === "2026-03-31", [rn1, rn2]);
  check("weekly recurrence", iso(await nx("2026-09-01", "2026-09-10", "WEEKLY")) === "2026-09-15");
  check("yearly recurrence (29 Feb → 28 Feb)", iso(await nx("2024-02-29", "2024-02-29", "YEARLY")) === "2025-02-28");

  const housing = await cat(a, "Housing");
  const rent = await sub(housing, "Rent");
  await db.query(
    "insert into public.recurring_transactions (type, amount, category_id, subcategory_id, description, frequency, start_date, next_run_date) values ('EXPENSE', 12000, $1, $2, 'Rent', 'MONTHLY', '2026-07-01', '2026-07-01')",
    [housing, rent],
  );
  const gen1 = await db.query("select public.generate_recurring_transactions('2026-09-30') n");
  const gen2 = await db.query("select public.generate_recurring_transactions('2026-09-30') n");
  const rentRows = await db.query("select transaction_date from public.transactions where subcategory_id = $1 order by 1", [rent]);
  const next = await db.query("select next_run_date::text as next_run_date from public.recurring_transactions where subcategory_id = $1", [rent]);
  check("recurring generates Jul, Aug, Sep once", num(gen1.rows[0].n) === 3 && rentRows.rows.length === 3);
  check("recurring is idempotent", num(gen2.rows[0].n) === 0);
  check("recurring advances next_run_date", iso(String(next.rows[0].next_run_date)) === "2026-10-01");

  await db.query("rollback to savepoint as_a");

  // anon may not call analytics
  await db.query("savepoint anon");
  await db.query("set local role anon");
  let anonBlocked = false;
  try {
    await db.query("select * from public.find_transactions()");
  } catch {
    anonBlocked = true;
  }
  await db.query("rollback to savepoint anon");
  check("anon cannot call find_transactions", anonBlocked);
} finally {
  await db.query("rollback").catch(() => {});
  await db.close();
}

console.log(`\n${failed === 0 ? "✓" : "✗"} ${passed} passed, ${failed} failed (rolled back)`);
process.exit(failed === 0 ? 0 : 1);
