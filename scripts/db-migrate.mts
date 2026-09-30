/**
 * Applies database/migrations/*.sql in filename order, once each.
 * Uses DIRECT_URL (session pooler) from .env.local.
 *
 *   npm run db:migrate           apply pending migrations
 *   npm run db:migrate -- --status   list applied / pending
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "database", "migrations");
const statusOnly = process.argv.includes("--status");

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DIRECT_URL is not set. Run with: node --env-file=.env.local scripts/db-migrate.mts");
  process.exit(1);
}

// Supabase requires TLS; strip sslmode so pg uses the explicit ssl option below.
const url = new URL(connectionString);
url.searchParams.delete("sslmode");
const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(`
    create schema if not exists app_private;
    revoke all on schema app_private from public, anon, authenticated;
    create table if not exists app_private.migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await client.query<{ name: string }>("select name from app_private.migrations")).rows.map((r) => r.name),
  );
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (statusOnly) {
    files.forEach((f) => console.log(`${applied.has(f) ? "✓" : "·"} ${f}`));
  } else if (pending.length === 0) {
    console.log("✓ Database is up to date");
  } else {
    for (const file of pending) {
      const sql = await readFile(join(dir, file), "utf8");
      process.stdout.write(`→ ${file} … `);
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into app_private.migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log("done");
      } catch (err) {
        await client.query("rollback");
        console.log("FAILED");
        throw err;
      }
    }
    console.log(`✓ Applied ${pending.length} migration(s)`);
  }
} finally {
  await client.end();
}
