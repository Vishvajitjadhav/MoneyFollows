/**
 * Applies database/migrations/*.sql in filename order, once each.
 *
 *   npm run db:migrate                 apply pending migrations to Supabase (DIRECT_URL)
 *   npm run db:migrate -- --status     list applied / pending
 *   npm run db:migrate -- --local      dry-run all migrations on in-memory PGlite
 */
import { connect, migrate, migrationFiles } from "./lib/db.mts";

const db = await connect();
try {
  if (process.argv.includes("--status")) {
    await migrate(db, false).catch(() => {});
    const applied = new Set(
      (await db.query<{ name: string }>("select name from app_private.migrations")).rows.map((r) => r.name),
    );
    (await migrationFiles()).forEach((f) => console.log(`${applied.has(f) ? "✓" : "·"} ${f}`));
  } else {
    const applied = await migrate(db);
    console.log(applied.length ? `✓ Applied ${applied.length} migration(s) [${db.kind}]` : "✓ Database is up to date");
  }
} finally {
  await db.close();
}
