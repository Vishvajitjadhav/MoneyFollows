/**
 * Row Level Security smoke test — runs entirely inside one transaction and
 * ROLLS BACK, so it leaves no data behind.
 *
 * Creates users A and B (the signup trigger seeds their categories), then
 * impersonates each as the `authenticated` role and checks isolation.
 *
 *   npm run db:test-rls            against Supabase
 *   npm run db:test-rls -- --local on in-memory PGlite
 */
import { connect, isLocal, migrate } from "./lib/db.mts";

const db = await connect();
if (isLocal()) await migrate(db, false);

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Run `fn` as the given user (or anon), restoring the superuser role afterwards. */
async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.query("savepoint impersonate");
  if (userId) {
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
  } else {
    await db.query("set local role anon");
    await db.query("select set_config('request.jwt.claims', '{\"role\":\"anon\"}', true)");
  }
  try {
    return await fn();
  } finally {
    await db.query("rollback to savepoint impersonate");
  }
}

/** Expect a statement to fail (RLS violation or FK/ownership error). */
async function rejects(sql: string, params: unknown[] = []) {
  try {
    await db.query("savepoint attempt");
    await db.query(sql, params);
    await db.query("release savepoint attempt");
    return false;
  } catch {
    await db.query("rollback to savepoint attempt");
    return true;
  }
}

try {
  await db.query("begin");

  const [a, b] = (
    await db.query<{ id: string }>(`
      insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
      values
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@test.local', '{"full_name":"Asha"}', now(), now()),
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@test.local', '{"full_name":"Bala"}', now(), now())
      returning id`)
  ).rows.map((r) => r.id);

  // ── signup trigger
  const seeded = await db.query(
    "select user_id, count(*)::int n from public.categories where user_id = any($1) group by user_id",
    [[a, b]],
  );
  check("signup seeds 24 categories per user", seeded.rows.length === 2 && seeded.rows.every((r) => r.n === 24));
  const subs = await db.query("select count(*)::int n from public.subcategories where user_id = $1", [a]);
  check("signup seeds subcategories", subs.rows[0].n === 50, `${subs.rows[0].n}`);
  const prof = await db.query("select full_name from public.profiles where id = $1", [a]);
  check("signup creates profile with name", prof.rows[0]?.full_name === "Asha");

  const catOf = async (user: string, name: string, type = "EXPENSE") =>
    (await db.query("select id from public.categories where user_id=$1 and name=$2 and type=$3", [user, name, type]))
      .rows[0].id as string;
  const subOf = async (cat: string, name: string) =>
    (await db.query("select id from public.subcategories where category_id=$1 and name=$2", [cat, name])).rows[0]
      .id as string;

  const aFood = await catOf(a, "Food");
  const aLunch = await subOf(aFood, "Lunch");
  const aTransport = await catOf(a, "Transport");
  const bFood = await catOf(b, "Food");
  const bLunch = await subOf(bFood, "Lunch");

  // B records an expense (as B)
  const bTx = await as(b, async () => {
    const r = await db.query(
      "insert into public.transactions (type, amount, category_id, subcategory_id, description) values ('EXPENSE', 250, $1, $2, 'B lunch') returning id",
      [bFood, bLunch],
    );
    return r.rows[0].id as string;
  });
  // as() rolls back, so insert B's row for real as superuser for the read tests
  await db.query(
    "insert into public.transactions (id, user_id, type, amount, category_id, subcategory_id, description) values ($1, $2, 'EXPENSE', 250, $3, $4, 'B lunch')",
    [bTx, b, bFood, bLunch],
  );
  check("user can insert own transaction (user_id defaults to auth.uid())", Boolean(bTx));

  await as(a, async () => {
    const own = await db.query("select count(*)::int n from public.categories");
    check("A sees only own categories", own.rows[0].n === 24, `${own.rows[0].n}`);

    const other = await db.query("select * from public.transactions where id = $1", [bTx]);
    check("A cannot read B's transaction", other.rowCount === 0);

    const profiles = await db.query("select id from public.profiles");
    check("A sees only own profile", profiles.rowCount === 1 && profiles.rows[0].id === a);

    const upd = await db.query("update public.transactions set amount = 1 where id = $1", [bTx]);
    check("A cannot update B's transaction", upd.rowCount === 0);

    const del = await db.query("delete from public.transactions where id = $1", [bTx]);
    check("A cannot delete B's transaction", del.rowCount === 0);

    check(
      "A cannot insert a row owned by B",
      await rejects(
        "insert into public.transactions (user_id, type, amount, category_id) values ($1, 'EXPENSE', 10, $2)",
        [b, bFood],
      ),
    );
    check(
      "A cannot use B's category",
      await rejects("insert into public.transactions (type, amount, category_id) values ('EXPENSE', 10, $1)", [bFood]),
    );
    check(
      "subcategory must belong to the chosen category",
      await rejects(
        "insert into public.transactions (type, amount, category_id, subcategory_id) values ('EXPENSE', 10, $1, $2)",
        [aTransport, aLunch],
      ),
    );
    check(
      "transaction type must match category type",
      await rejects("insert into public.transactions (type, amount, category_id) values ('INCOME', 10, $1)", [aFood]),
    );
    check(
      "amount must be positive",
      await rejects("insert into public.transactions (type, amount, category_id) values ('EXPENSE', 0, $1)", [aFood]),
    );
    check(
      "A cannot move own row to B",
      await rejects("update public.categories set user_id = $1 where id = $2", [b, aFood]),
    );
    check(
      "A cannot call the seed function",
      await rejects("select public.seed_default_categories($1)", [a]),
    );

    const ok = await db.query(
      "insert into public.transactions (type, amount, category_id, subcategory_id) values ('EXPENSE', 250, $1, $2) returning user_id",
      [aFood, aLunch],
    );
    check("A can insert own expense", ok.rows[0].user_id === a);
  });

  await as(null, async () => {
    check("anon cannot read transactions", await rejects("select * from public.transactions"));
    check("anon cannot read categories", await rejects("select * from public.categories"));
  });
} finally {
  await db.query("rollback").catch(() => {});
  await db.close();
}

console.log(`\n${failed === 0 ? "✓" : "✗"} ${passed} passed, ${failed} failed (all test data rolled back)`);
process.exit(failed === 0 ? 0 : 1);
