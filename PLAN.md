# MoneyFollows — Build Plan

> **Follow your money.** · *Know where your money goes.*
>
> This file is the single source of truth for progress. Tick `[x]` when a task is done and verified.
> Every new Claude session: read this file, find **▶ NEXT UP**, continue from there.

**Philosophy:** Open → Record → Understand → Improve
**Golden rule:** Does this make managing or understanding money easier? If not, it's not V1.
**UX benchmark:** Open URL → Login → Tap + → ₹250 → Food → Lunch → Save in **5–10 seconds**.

**Legend:** `[x]` built **and** verified locally (typecheck + lint + build, unit tests, SQL tests on PGlite, or visual check in `/design/*` previews).
Anything that needs the real Supabase project is tracked separately in **Live verification** below.

---

## ▶ NEXT UP

**All V1 features are built** (branch `feature/supabase-auth`). What's left is **live verification against the real Supabase project**, then merge to `main` and deploy.

1. **User:** in `.env.local` replace `[YOUR-PASSWORD]` in `DATABASE_URL` + `DIRECT_URL` with the real DB password, and fill `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase → Project Settings → API Keys).
2. **User:** Supabase → Authentication → URL Configuration → Site URL `http://localhost:3000`, Redirect URLs `http://localhost:3000/**` (+ the Vercel URL once deployed).
3. `npm run db:migrate` (applies 0001–0005) → `npm run db:test-rls:live` → `node --env-file=.env.local scripts/test-db-functions.mts` — all must be ✓.
4. Work through **Live verification** below in the browser (mobile 375px + desktop), fix anything found, tick boxes.
5. Merge `feature/supabase-auth` → `main`, deploy to Vercel (env vars!), repeat the phone acceptance test on a real phone.

_Update this pointer whenever a task is completed._

---

## Live verification (needs real Supabase) — do these next

- [ ] Migrations applied to Supabase; RLS test (19) + function tests (22) pass against the live DB
- [ ] Sign up → confirmation email → lands in app with 24 default categories seeded
- [ ] Login (incl. `?next=` redirect), logout, wrong password message
- [ ] Forgot password → email link → `/reset-password` → new password works
- [ ] Two accounts: user B sees none of user A's data anywhere (Home, History, Analysis, CSV, PDF)
- [ ] **Phone acceptance:** + → 250 → Food → Lunch → Save in ≤ 10 s; toast "₹250 Food expense added." + Undo; Home updates immediately
- [ ] Quick add "250 food lunch" + Enter saves; unknown words open the sheet prefilled
- [ ] Edit + delete (with confirmation) a transaction
- [ ] History: search "movie", filters (Sept + Petrol), totals, pagination, CSV export
- [ ] Analysis: all periods, charts render, drill-down Food → Lunch → rows, calendar day tap
- [ ] Budgets (80% warning / over), goals (add money), recurring (rent back-fill + no duplicates on revisit), investments (auto-record SIP), purchases
- [ ] Financial plan saves; monthly review; PDF downloads and looks like `/design/sample-pdf`
- [ ] Categories: custom "Pets" + subcategories; archive/restore; custom field shows in the add sheet
- [ ] PWA: installable on Android/iOS, icon + standalone, "Add expense" shortcut
- [ ] Vercel production deploy + `NEXT_PUBLIC_SITE_URL` set to the production URL

---

## Session log

| Date | What was done |
|------|---------------|
| 2026-09-30 | Project setup: Next.js 16.3 + React 19 + TS + Tailwind v4 + shadcn/ui (radix-nova) + deps. Folder structure. PLAN.md created. Pushed to GitHub `main`. |
| 2026-09-30 | 1.2 Design system (`feature/design-system`) — merged to `main`. |
| 2026-09-30 | 1.3 Logo & branding (`feature/branding`) — merged to `main`. |
| 2026-09-30 | 1.4–Phase 8 on `feature/supabase-auth`: Supabase clients, proxy, auth, schema/RLS/analytics SQL (5 migrations), PGlite DB tests (41 ✓), unit tests (23 ✓), app shell, quick entry, CRUD, home, history, analysis, drill-down, calendar, budgets, goals, recurring, investments, purchases, plan, categories, custom fields, settings, monthly review, PDF, CSV, PWA manifest, setup page, dev previews. Blocked only on Supabase password + publishable key for live testing. |

---

## Tech stack (locked)

| Layer | Choice |
|---|---|
| Framework | Next.js **16** (App Router, Server Components, Server Actions) — ⚠️ read `node_modules/next/dist/docs/` before using an API. `middleware.ts` is **`proxy.ts`**. |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui (Radix, `radix-nova`), Lucide, Sonner, Vaul |
| Validation | Zod v4 (server-side in every action); forms use `useActionState`/controlled state (RHF not needed so far) |
| Charts | Recharts, lazy-loaded client-only (`components/charts/index.tsx`) |
| PDF | `@react-pdf/renderer` in a Route Handler, Inter embedded from `lib/pdf/fonts` |
| Dates | date-fns; app time zone **Asia/Kolkata** (`lib/dates.ts`) |
| DB / Auth | Supabase Postgres + Auth via `@supabase/ssr`; `getClaims()` for identity |
| Tests | `node --test` (unit), PGlite (in-process Postgres) for SQL + RLS |
| Hosting | Vercel free tier |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (without Supabase env it shows `/setup`; `/design`, `/design/app`, `/design/sample-pdf` work with sample data) |
| `npm run check` | typecheck + lint + build |
| `npm test` | Unit tests (calculations, parser, dates, format, insights, recurrence) |
| `npm run db:test` | All migrations + RLS + SQL function tests on in-memory PGlite (no Supabase needed) |
| `npm run db:migrate` | Apply pending migrations to Supabase (`DIRECT_URL`); `-- --status` to list |
| `npm run db:test-rls:live` | RLS tests against Supabase (rolled back) |
| `npm run icons` | Regenerate favicon / PWA / brand assets from `components/brand/mark.ts` |

---

## Project structure

```
app/
  (auth)/            login, signup, forgot-password, reset-password, actions.ts
  (app)/             protected: / (home), history, analysis (+category/[id], calendar), budgets, goals,
                     investments, recurring, purchases, plan, review, reports, categories, custom-fields,
                     settings, more · layout.tsx (shell + sheet provider) · loading.tsx · error.tsx
  api/export/csv     CSV route · api/reports/pdf  PDF route
  auth/callback      email link landing (PKCE + token_hash)
  setup/             shown until Supabase env is configured
  design/            DEV ONLY: design system, /design/app preview, /design/sample-pdf
  manifest.ts        PWA manifest
components/          ui/ (shadcn), brand/, layout/, transactions/, analysis/, charts/, budgets/, goals/,
                     recurring/, investments/, plan/, reports/, settings/, history/, auth/
lib/
  supabase/          server.ts, client.ts, proxy.ts, env.ts
  actions/           server actions: transactions.ts, planning.ts, settings.ts
  data/              server-only queries: analytics, categories, budgets, report, period
  calculations/      pure money math + plan allocation (+ tests)
  parsers/           quick-entry parser (+ tests)
  validations/       zod schemas (auth, transaction, planning, filters)
  pdf/               report document + fonts
  dates.ts format.ts insights.ts recurrence.ts safe-action.ts db-errors.ts
database/migrations  0001 schema · 0002 RLS · 0003 signup seed · 0004 analytics · 0005 top_transactions
database/local       Supabase auth stub for PGlite tests
scripts/             db-migrate, test-rls, test-db-functions, generate-icons, lib/db (pg | PGlite)
proxy.ts             session refresh + route protection
```

---

## Phase 1 — Foundation

### 1.1 Project setup ✅
- [x] Next.js 16 + TS + App Router + Tailwind v4 + ESLint; shadcn/ui + core components; deps; folders; `.env.example`; scripts; Inter; PLAN.md + CLAUDE.md

### 1.2 Design system ✅
- [x] Brand tokens, money typography, `formatINR`, StatCard/MoneyText/EmptyState/PageHeader/CategoryIcon, shadcn tweaks, Toaster, `/design`

### 1.3 Logo & branding ✅
- [x] MF-trail mark, Logo components, `npm run icons` (favicon, apple, PWA, brand kit), `docs/BRAND.md`

### 1.4 Supabase setup
- [ ] Supabase project fully configured in `.env.local` (URL ✓, publishable key ✗, DB password ✗) — **user**
- [x] Server/browser clients, `proxy.ts` session refresh + redirects, typed `Database` (tables, enums, functions)
- [x] `/setup` page instead of crashing when env is missing
- [x] Migration runner (`app_private.migrations`), PGlite adapter for local tests

### 1.5 Authentication
- [x] Sign up (name/email/password), login (`?next=`), logout, forgot → email → reset, callback route
- [x] `requireUser()`/`getCurrentUser()` (JWT-verified, per-request cached); never trust client `user_id`
- [x] Branded, mobile-first auth screens; friendly errors; no account enumeration
- [ ] Verified end-to-end against Supabase (see Live verification)

### 1.6 Database schema ✅ (verified on PGlite)
- [x] 11 tables per spec, composite ownership FKs, CHECKs, `updated_at` triggers, indexes
- [x] Signup trigger: profile + 24 default categories / 50 subcategories

### 1.7 Row Level Security ✅ (verified on PGlite)
- [x] RLS on every table, own-rows-only policies, anon revoked, functions granted to `authenticated` only
- [x] `npm run db:test` — 19 isolation checks pass

### 1.8 Responsive app shell ✅
- [x] Mobile bottom nav `Home | History | + | Analysis | More` with hero +; desktop sidebar with Add button
- [x] One add/edit sheet (drawer on mobile, dialog on desktop); safe areas; 44px+ targets
- [x] `loading.tsx` skeleton, `error.tsx` boundary

### 1.9 Mobile dashboard ✅
- [x] Month header, Income/Spent/Invested/Remaining (Remaining highlighted), vs-last-month trend
- [x] Big "+ Add Expense", quick add bar, Today's spending, Recent activity, Budgets to watch
- [x] Empty state; due recurring items generated on open

### 1.10 Quick expense entry ⭐ ✅
- [x] Amount (auto-focused, decimal keypad) → category grid → subcategory chips → Save; remark, date, purchase, notes, custom fields optional
- [x] Income + Investment tabs in the same sheet
- [x] Quick text "250 food lunch" — deterministic parser, aliases (uber, mom, swiggy, netflix…), custom categories, live preview
- [x] Toast "₹250 Food expense added." + Undo; `revalidatePath` refresh; failures keep input (`safeAction`)
- [x] Flow verified in `/design/app`: + → 250 → Food → Lunch → "Save ₹250" = 4 interactions

### 1.11 Transaction CRUD ✅
- [x] Zod-validated create/update/delete actions, edit sheet from any row, delete with confirmation

### 1.12 Foundation verification
- [x] `npm run check` passes · `npm test` 23 ✓ · `npm run db:test` 41 ✓
- [ ] Live checks — see **Live verification**

## Phase 2 — Categories & custom fields ✅
- [x] Categories page: tabs by type, custom category with icon + color, add/remove subcategories, archive/restore (unused ones deleted)
- [x] Custom fields: text/number/dropdown/yes-no/date, suggestions, shown under "More" in the add sheet, stored in `transaction_custom_fields`
- [x] Parser matches custom categories

## Phase 3 — Income, family support, investments ✅
- [x] Income categories + income in stats/analysis
- [x] Family support first-class: Analysis section with Parents/Brother/Sister breakdown, review + PDF, insights
- [x] Investments page: SIP/MF/Stocks/PPF/FD, month/year totals, monthly commitment, "Record" button, optional auto-recording
- [x] Calculation functions from the spec in `lib/calculations`

## Phase 4 — History, search, filters ✅
- [x] Day-grouped history with day totals; page-based pagination
- [x] Debounced search (category, subcategory, description, notes) with totals for the whole result
- [x] Filter sheet (date range, category, subcategory, type, amount range, purchases) + removable chips; URL-driven
- [x] CSV export of the current filter (formula-injection safe)

## Phase 5 — Analysis ✅
- [x] Periods: this month, last month, last 3 months, this year, custom
- [x] KPIs: income, expenses, invested, remaining + savings rate, avg daily, count
- [x] Charts (validated palette): income vs expense, category breakdown, daily spending, 12-month trend, MoM comparison
- [x] Drill-down category → subcategory → transactions; spending calendar heatmap with day breakdown
- [x] SQL aggregations (`0004_analytics.sql`); deterministic insights

## Phase 6 — Budgets, goals, recurring, purchases, plan ✅
- [x] Budgets per month with 80% / over states, copy last month, month navigation
- [x] Savings goals: progress, add/withdraw money, per-month needed for target date, presets
- [x] Recurring: daily/weekly/monthly/yearly, back-fill, idempotent generation, month-end anchoring, pause/resume, presets
- [x] Purchases page: month/year totals, largest, by category, history
- [x] Financial plan: prefilled inputs, suggested allocation, editable %, 100% check, saved per month, not-advice disclaimer

## Phase 7 — Monthly review, PDF, CSV ✅
- [x] Monthly review: 4 KPIs with MoM deltas, top category, largest purchase, family support, insights, charts, top expenses, purchases
- [x] PDF report (3 pages for a typical month, verified by rendering `/design/sample-pdf`): branding, name, period, KPIs, savings rate, highlights, 6-month chart, categories, MoM, family, top expenses, purchases, summary
- [x] Reports page: current / previous / custom range for PDF + CSV

## Phase 8 — PWA, performance, a11y, polish
- [x] `app/manifest.ts` (standalone, icons incl. maskable, shortcuts), apple web app meta, theme color
- [x] Performance: Server Components by default, SQL aggregation, pagination, lazy charts, per-request `cache()`
- [x] A11y: labels, `aria-pressed`/`aria-current`, focus rings, reduced motion, text never color-only in charts
- [x] Security headers (nosniff, frame deny, referrer, permissions)
- [ ] Lighthouse mobile ≥ 90 (run after deploy)
- [ ] Production deploy + real-phone acceptance test

---

## Future (NOT V1)
CSV/bank import · auto-categorization · subscription detection · AI insights · natural-language queries (question → intent → structured query → DB → calculation → LLM explanation; LLM never gets raw DB access) · multiple accounts · net worth · debt & credit cards · portfolio tracking · shared household / family accounts · advanced reports · offline sync · dark mode toggle (tokens already defined).

---

## Decisions log
- **2026-09-30** — Next.js 16.3.7; `proxy.ts` instead of `middleware.ts`.
- **2026-09-30** — shadcn `radix-nova`; shadcn uses the `cn` package.
- **2026-09-30** — Amounts `numeric(14,2)` > 0; `type` decides direction. INR default.
- **2026-09-30** — Category `icon`/`color` stored as string keys resolved by `components/category-icon.tsx`.
- **2026-09-30** — Feature branches, merged to `main` after verification.
- **2026-09-30** — Default categories seeded per user by trigger.
- **2026-09-30** — Identity via `getClaims()`; RLS is the real guard; composite `(id, user_id)` FKs stop cross-user references at the DB level.
- **2026-09-30** — Auth forms: Server Actions + `useActionState` + server-side Zod (less client JS).
- **2026-09-30** — Plain SQL migrations + own runner; PGlite + auth stub for local DB tests (no Docker).
- **2026-09-30** — App time zone fixed to Asia/Kolkata for "today" (servers run UTC).
- **2026-09-30** — Search/filter/totals in one SQL function (`find_transactions`, window totals) instead of loading rows client-side.
- **2026-09-30** — Recurring generation runs on Home open (idempotent, `for update skip locked`); Vercel Cron optional later.
- **2026-09-30** — Savings rate = (income − expenses) / income (investments count as saved).
- **2026-09-30** — PDF with `@react-pdf/renderer`; Inter latin + latin-ext registered as fallback pair so ₹ renders.
