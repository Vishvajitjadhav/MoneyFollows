# MoneyFollows

**Follow your money.** A mobile-first personal finance PWA: record an expense in five seconds, then understand where your money goes.

Next.js 16 · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth, RLS) · Recharts · react-pdf · Vercel free tier.

## Run it

```bash
npm install
cp .env.example .env.local   # fill Supabase URL, publishable key, DB password
npm run db:migrate           # create tables, RLS, functions in Supabase
npm run dev
```

Without Supabase env the app shows `/setup`; `/design/app` and `/design/sample-pdf` preview the UI and PDF with sample data.

## Checks

```bash
npm run check     # typecheck + lint + build
npm test          # unit tests
npm run db:test   # migrations + RLS + SQL tests on in-memory Postgres (PGlite)
```

## Docs

- [PLAN.md](PLAN.md) — roadmap and progress
- [docs/SPEC.md](docs/SPEC.md) — product spec
- [docs/BRAND.md](docs/BRAND.md) — brand guide

## Deploy (Vercel)

Import the repo, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (your Vercel URL), and add `https://<your-app>.vercel.app/**` to Supabase → Authentication → Redirect URLs.
