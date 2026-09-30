/**
 * Tiny DB adapter for scripts: real Postgres (Supabase, via DIRECT_URL) or
 * in-process PGlite with a Supabase auth stub (`--local`), same interface.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const migrationsDir = join(root, "database", "migrations");

export type Result<R> = { rows: R[]; rowCount: number };
export type Db = {
  kind: "postgres" | "pglite";
  /** Parameterised single statement, or a multi-statement script when no params. */
  query<R = Record<string, any>>(sql: string, params?: unknown[]): Promise<Result<R>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  close(): Promise<void>;
};

export const isLocal = () => process.argv.includes("--local");

export async function connect(): Promise<Db> {
  if (isLocal()) return connectPglite();

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set in .env.local (or pass --local)");
  if (/:\[[^\]]*\]@/.test(connectionString)) {
    throw new Error("DIRECT_URL still contains [YOUR-PASSWORD] — put your real database password in .env.local");
  }
  const { default: pg } = await import("pg");
  // Supabase requires TLS; strip sslmode so pg uses the explicit ssl option.
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  return {
    kind: "postgres",
    async query(sql, params) {
      const r = await client.query(sql, params as unknown[]);
      const last = Array.isArray(r) ? r[r.length - 1] : r;
      return { rows: last?.rows ?? [], rowCount: last?.rowCount ?? 0 };
    },
    close: () => client.end(),
  };
}

async function connectPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pgl = await PGlite.create();
  const db: Db = {
    kind: "pglite",
    async query(sql, params) {
      if (params && params.length) {
        const r = await pgl.query(sql, params);
        return { rows: r.rows as never[], rowCount: r.rows.length || (r.affectedRows ?? 0) };
      }
      const rs = await pgl.exec(sql);
      const last = rs[rs.length - 1];
      return { rows: (last?.rows ?? []) as never[], rowCount: last?.rows.length || (last?.affectedRows ?? 0) };
    },
    close: () => pgl.close(),
  };
  await db.query(await readFile(join(root, "database", "local", "supabase-stub.sql"), "utf8"));
  return db;
}

export async function migrationFiles() {
  return (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
}

/** Apply pending migrations, each in its own transaction. Returns names applied. */
export async function migrate(db: Db, log = true): Promise<string[]> {
  await db.query(`
    create schema if not exists app_private;
    revoke all on schema app_private from public;
    create table if not exists app_private.migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);
  const applied = new Set((await db.query<{ name: string }>("select name from app_private.migrations")).rows.map((r) => r.name));
  const pending = (await migrationFiles()).filter((f) => !applied.has(f));
  for (const file of pending) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    if (log) process.stdout.write(`→ ${file} … `);
    try {
      await db.query("begin");
      await db.query(sql);
      await db.query("insert into app_private.migrations (name) values ($1)", [file]);
      await db.query("commit");
      if (log) console.log("done");
    } catch (err) {
      await db.query("rollback");
      if (log) console.log("FAILED");
      throw err;
    }
  }
  return pending;
}
