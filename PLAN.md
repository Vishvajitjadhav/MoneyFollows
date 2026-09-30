# MoneyFollows — Build Plan

> **Follow your money.** · *Know where your money goes.*
>
> This file is the single source of truth for progress. Tick `[x]` when a task is done and verified.
> Every new Claude session: read this file, find **▶ NEXT UP**, continue from there.

**Philosophy:** Open → Record → Understand → Improve
**Golden rule:** Does this make managing or understanding money easier? If not, it's not V1.
**UX benchmark:** Open URL → Login → Tap + → ₹250 → Food → Lunch → Save in **5–10 seconds**.

---

## ▶ NEXT UP

**Phase 1 → 1.3 Logo & branding** (MF monogram SVG, `components/brand/Logo.tsx`, favicon + PWA icons)

_Update this pointer whenever a task is completed._

---

## Session log

| Date | What was done |
|------|---------------|
| 2026-09-30 | Project setup: Next.js 16.3 + React 19 + TS + Tailwind v4 + shadcn/ui (radix-nova) + deps. Folder structure. PLAN.md created. Pushed to GitHub `main`. |
| 2026-09-30 | 1.2 Design system on branch `feature/design-system`: brand tokens, money utilities, `formatINR`, StatCard/MoneyText/EmptyState/PageHeader/CategoryIcon, Toaster, `/design` preview. |

---

## Tech stack (locked)

| Layer | Choice |
|---|---|
| Framework | Next.js **16** (App Router, Server Components, Server Actions) — ⚠️ breaking changes vs older Next: read `node_modules/next/dist/docs/` before using an API. `middleware.ts` is now **`proxy.ts`**. |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui (Radix base, `radix-nova` style), Lucide React, Sonner (toasts), Vaul (drawer) |
| Forms / validation | React Hook Form + Zod v4 (`@hookform/resolvers`) |
| Charts | Recharts (lazy-loaded) |
| Dates | date-fns |
| Backend | Server Actions (mutations) + Route Handlers only where HTTP is genuinely useful (PDF, CSV) |
| DB / Auth | Supabase PostgreSQL + Supabase Auth via `@supabase/ssr` |
| Hosting | Vercel (free tier) — `moneyfollows.vercel.app` |
| PWA | `app/manifest.ts` + icons, standalone mode, no offline sync in V1 |

**Not allowed in V1:** separate backend server, Docker, Kubernetes, Redis, Kafka, paid APIs, AI features, native apps.

---

## Project structure

```
app/                  routes (App Router)
  (auth)/             login, signup, forgot/reset password
  (app)/              protected app: home, history, analysis, more/...
  api/                route handlers (reports/pdf, export/csv) only
components/
  ui/                 shadcn primitives
  brand/              logo, icon, wordmark
  layout/             sidebar, bottom nav, app shell
  <feature>/          transactions, analysis, budgets, ...
lib/
  supabase/           server.ts, client.ts, proxy session helper
  calculations/       pure money math (unit-testable)
  validations/        zod schemas
  parsers/            quick-entry text parser ("250 food lunch")
  data/               server-only query functions
hooks/                client hooks
types/                shared TS types + generated DB types
database/
  migrations/         ordered SQL migrations (schema, RLS, seeds, functions)
proxy.ts              session refresh + route protection (Next 16 "middleware")
```

Separation rule: **UI ↔ business logic ↔ database ↔ validation ↔ calculations ↔ types** live in different places.

---

## Brand & design system (target)

- **Primary (coral):** `#E85D5D` — CTA, active nav, highlights, logo, selected states only. Never overwhelm with red.
- **Secondary light:** `#FFF1F1` · **Background:** `#FAFAFA` · **Cards:** `#FFFFFF`
- **Text:** `#202020` · **Secondary text:** `#737373` · **Borders:** `#EDEDED`
- **Success:** subtle green (e.g. `#22A06B` / bg `#EAF7F0`) · **Warning:** subtle amber (e.g. `#D99A1E` / bg `#FFF6E5`)
- **Font:** Inter; large tabular numbers (`font-variant-numeric: tabular-nums`) for money
- **Radius:** generous (cards ~16–20px, buttons ~12px / pill for primary CTA)
- **Cards:** white, 1px `#EDEDED` border, very soft shadow, no heavy gradients
- **Icons:** Lucide, 1.75px stroke, rounded
- **Logo direction:** MF monogram / money-trail flow — M flows into F as one continuous stroke; must read at 16px. Versions: horizontal, icon-only, monochrome, light-bg, dark-bg, favicon, PWA icon.
- Same tokens reused in PDF reports.

---

## Phase 1 — Foundation

### 1.1 Project setup ✅
- [x] Scaffold Next.js 16 + TypeScript + App Router + Tailwind v4 + ESLint
- [x] shadcn/ui init (Radix base, radix-nova) + core components (button, input, label, card, dialog, drawer, sheet, select, tabs, badge, separator, skeleton, dropdown-menu, popover, calendar, progress, switch, textarea, avatar, tooltip, alert-dialog)
- [x] Install: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `recharts`, `date-fns`, `sonner`, `lucide-react`
- [x] Folder structure (`hooks/ types/ database/ lib/* components/brand components/layout`)
- [x] `.env.example`, `.gitignore` allows it
- [x] Scripts: `npm run typecheck`, `npm run check` (typecheck + lint + build)
- [x] Inter font wired in `app/layout.tsx`, app metadata
- [x] PLAN.md + CLAUDE.md pointer

### 1.2 Design system ✅
- [x] Brand color tokens in `app/globals.css` (brand, brand-soft, success, warning, income/expense/invest, chart palette, `shadow-card`, `shadow-float`; `.dark` defined for later)
- [x] Money typography utilities (`money`, `money-hero` — tabular nums) + `pb-safe`/`pt-safe`
- [x] `lib/format.ts` — `formatINR` (₹, Indian grouping, signed/compact/paise), `formatCompact` (K/L/Cr), `formatPercent`
- [x] Base components: `components/stat-card.tsx`, `money-text.tsx`, `empty-state.tsx`, `page-header.tsx`, `category-icon.tsx` (icon + color registries, keys stored as strings in DB)
- [x] Default category definitions in `lib/constants/categories.ts` (expense / income / investment, icon + color + subcategories)
- [x] shadcn tweaks: Button (h-11 default, `xl` size, `soft` variant, coral hover), Card (rounded-2xl, border + soft shadow), Input/Textarea (h-11, rounded-xl), Progress (`indicatorClassName`)
- [x] Toaster (`components/ui/sonner.tsx`, top-center, branded) + TooltipProvider + mobile `viewport` in root layout
- [x] Design-system preview page `/design` (dev only, 404 in production)

### 1.3 Logo & branding
- [ ] Design MF monogram / money-trail SVG (icon-only) — test at 16/32/64/512px
- [ ] Horizontal logo (icon + "MoneyFollows" wordmark)
- [ ] Variants: monochrome, light-bg, dark-bg
- [ ] `components/brand/Logo.tsx` (props: variant, size, withWordmark)
- [ ] Favicon (`app/icon.svg` / `favicon.ico`), apple-icon, PWA icons 192/512 + maskable
- [ ] Brand guide section documented (colors, type, radius, buttons, cards)

### 1.4 Supabase setup
- [ ] Create Supabase project (user does this in dashboard) and fill `.env.local`
- [ ] `lib/supabase/server.ts` (server client, cookies) and `lib/supabase/client.ts` (browser client)
- [ ] `proxy.ts` — refresh session + redirect unauthenticated users away from app routes
- [ ] Generate DB types into `types/database.ts` (`supabase gen types` or hand-written)

### 1.5 Authentication
- [ ] Sign up (email + password, name)
- [ ] Login
- [ ] Logout
- [ ] Forgot password → email → reset password page
- [ ] Auth callback route (`app/auth/callback/route.ts` / confirm)
- [ ] Protected `(app)` routes; `getUser()` server-side helper — never trust client `user_id`
- [ ] Auth screens branded, mobile-first

### 1.6 Database schema (`database/migrations/0001_schema.sql`)
- [ ] `profiles` (id = auth.users.id, full_name, currency default 'INR', created_at) + trigger to auto-create on signup
- [ ] `categories` (user_id, name, type EXPENSE/INCOME/INVESTMENT, icon, color, sort_order, is_system, archived)
- [ ] `subcategories` (user_id, category_id FK, name, sort_order, archived)
- [ ] `transactions` (id, user_id, type, amount numeric(14,2) > 0, category_id, subcategory_id, transaction_date, description, notes, custom_metadata jsonb, is_purchase, recurring_id, created_at, updated_at)
- [ ] `custom_field_definitions` (user_id, name, field_type text/number/dropdown/boolean/date, options jsonb)
- [ ] `transaction_custom_fields` (transaction_id, field_id, value jsonb)
- [ ] `budgets` (user_id, category_id, month date, amount) unique(user, category, month)
- [ ] `investments` (user_id, name, type SIP/MF/STOCKS/PPF/FD/OTHER, amount, frequency, start_date, notes)
- [ ] `recurring_transactions` (user_id, type, amount, category_id, subcategory_id, frequency, start_date, end_date, next_run_date, active)
- [ ] `financial_goals` (user_id, name, target_amount, current_amount, target_date, icon)
- [ ] `monthly_plans` (user_id, month, income, allocations jsonb)
- [ ] Indexes: user_id, transaction_date, category_id, subcategory_id, type; composite (user_id, transaction_date desc)
- [ ] FKs + CHECK constraints + `updated_at` trigger
- [ ] Default categories seeded per user on signup (function `seed_default_categories(user_id)`) — Food, Transport, Housing, Bills, Family, Lifestyle, Shopping, Entertainment, Health, Education, Other + income categories (Salary, Freelance, Side income, Bonus, Gift, Refund, Other) + investment types

### 1.7 Row Level Security (`database/migrations/0002_rls.sql`)
- [ ] Enable RLS on every table
- [ ] Policies: select/insert/update/delete only where `user_id = auth.uid()`
- [ ] Child tables (subcategories, transaction_custom_fields) also check parent ownership
- [ ] Test: user A cannot read/write user B's rows (document test steps)

### 1.8 Responsive app shell
- [ ] Mobile: bottom nav `Home | History | + | Analysis | More`, center + is the hero
- [ ] + opens sheet: Expense / Income / Investment
- [ ] Desktop (≥ lg): left sidebar + wide content grid (not stretched mobile)
- [ ] Safe-area insets, 44px+ touch targets
- [ ] Loading skeletons (`loading.tsx`) + error boundaries (`error.tsx`)

### 1.9 Mobile dashboard (Home)
- [ ] Month header ("September")
- [ ] Stat cards: Income, Spent, Invested, Remaining
- [ ] Big `+ Add Expense` CTA
- [ ] Today's spending list
- [ ] Recent activity (last ~10)
- [ ] Empty state: "No expenses yet. Your first expense takes 5 seconds to add."

### 1.10 Quick expense entry ⭐ (most important feature)
- [ ] Step 1 amount keypad (big number, ₹)
- [ ] Step 2 category grid (tap)
- [ ] Step 3 subcategory chips (tap) → optional remark → SAVE
- [ ] Date defaults to today (changeable, not required)
- [ ] Quick text entry: `250 food lunch`, `500 petrol bike`, `10000 parents`, `350 movie` — deterministic parser in `lib/parsers/quick-entry.ts` (keyword → category/subcategory map, incl. user's custom categories)
- [ ] Income flow (Salary, Freelance, ...) and Investment flow reuse same component
- [ ] Toast: "₹250 Food expense added." + immediate UI update (optimistic / revalidatePath)
- [ ] Meets 5–10 second benchmark on phone

### 1.11 Transaction CRUD
- [ ] Server Actions: create / update / delete (Zod-validated, user from session)
- [ ] Edit sheet
- [ ] Delete with confirmation (+ undo toast if cheap)

### 1.12 ✋ Foundation verification (STOP here before advanced features)
- [ ] `npm run check` passes (typecheck, lint, build)
- [ ] Auth flows tested end-to-end
- [ ] CRUD tested
- [ ] RLS tested with two accounts
- [ ] Mobile (375px) + desktop (1440px) visually checked
- [ ] Loading / error / empty states checked
- [ ] Deploy to Vercel, test on real phone

---

## Phase 2 — Categories & custom fields
- [ ] Manage categories page (More → Categories): list, reorder, rename, archive
- [ ] Create custom category + subcategories (e.g. Pets → Food, Vet, Accessories)
- [ ] Custom field definitions (text / number / dropdown / boolean / date)
- [ ] Custom fields rendered in add/edit transaction (optional, collapsed)
- [ ] Quick-entry parser learns custom category names
- [ ] Verify (checklist below)

## Phase 3 — Income, family support, investments
- [ ] Income page / breakdown (Salary, Freelance, Side income, Bonus, Gift, Refund, Other)
- [ ] Family support as first-class: dedicated card + breakdown (Parents / Brother / Sister / Family / Other)
- [ ] Investments list + add/edit (name, type, amount, frequency, start date, notes) — no live market data
- [ ] Home dashboard reflects income/invested/remaining correctly
- [ ] `lib/calculations`: `calculateMonthlyIncome`, `calculateMonthlyExpenses`, `calculateInvestments`, `calculateRemaining`, `calculateSavingsRate`, `calculateFamilySupport`
- [ ] Verify

## Phase 4 — History, search, filters
- [ ] History grouped by day ("September 30") with day totals
- [ ] Cursor/offset pagination (never load all transactions)
- [ ] Search: category, subcategory, description, notes → results + **total**
- [ ] Filters: date range, category, subcategory, type, amount range → **total**
- [ ] Filters in URL search params (shareable, server-rendered)
- [ ] Edit/delete from history
- [ ] Verify

## Phase 5 — Analysis
- [ ] Time filters: This Month, Last Month, Last 3 Months, This Year, Custom
- [ ] KPIs: income, expenses, investments, remaining, avg daily spend, transaction count
- [ ] Charts (lazy-loaded Recharts): Income vs Expense, Category breakdown, Monthly trend, Daily spending, Month-over-month
- [ ] Category drill-down → subcategory totals → individual transactions (all categories)
- [ ] Calendar view: per-day spend; tap day → breakdown + total
- [ ] Aggregations done in SQL (views / RPC functions), not in the browser
- [ ] `calculateCategoryTotals`, `calculateSubcategoryTotals`, `calculateMonthlyComparison`
- [ ] Deterministic insights ("Food up ₹1,400 vs last month", "82% of Food budget used", ...) — only when backed by data
- [ ] Verify

## Phase 6 — Budgets, goals, recurring, purchases
- [ ] Monthly budgets per category: budget / used / remaining / %; subtle amber warning ≥ 80%, red ≥ 100%
- [ ] `calculateBudgetUsage`
- [ ] Savings goals: target, current, progress, add contribution
- [ ] Recurring transactions (daily/weekly/monthly/yearly, start/end) + generation strategy (on app open: generate due items idempotently via `next_run_date`; optional Vercel Cron later)
- [ ] Purchases: mark `is_purchase`; page with month/year totals, largest, by category, history
- [ ] `calculatePurchaseTotals`
- [ ] Financial Plan section: inputs (income, rent, EMI, family support, investments, goals) → suggested allocation (Needs / Lifestyle / Family / Investments / Savings / Flexible), editable %, clear "general guideline, not financial advice" note
- [ ] Verify

## Phase 7 — Monthly review, PDF, CSV
- [ ] Monthly Review page (income, expenses, investments, remaining, top category, largest purchase, family support, vs previous month, trends)
- [ ] PDF report (server-side Route Handler, e.g. `@react-pdf/renderer`): branding, user name, period, totals, savings rate, category breakdown, family support, top expenses, purchases, MoM, charts, transaction summary — designed, not a table dump
- [ ] PDF options: current month, previous month, custom range
- [ ] CSV export (Route Handler) respecting date range/filters: `Date,Type,Category,Subcategory,Amount,Description,Notes`
- [ ] Verify

## Phase 8 — PWA, performance, a11y, polish
- [ ] `app/manifest.ts`, icons, theme color, standalone, apple-touch-icon
- [ ] Install prompt hint (subtle)
- [ ] Performance pass: server components by default, minimal client JS, lazy charts, SQL indexes verified, no waterfalls
- [ ] Accessibility: labels, focus rings, contrast, keyboard nav, reduced motion
- [ ] Empty / loading / error / success states everywhere
- [ ] Lighthouse mobile ≥ 90 across the board
- [ ] Production deploy + final phone acceptance test (5–10 sec expense)

---

## Per-phase verification checklist (run after EVERY phase)
- [ ] `npm run typecheck` · `npm run lint` · `npm run build`
- [ ] Auth still works · CRUD works · RLS holds
- [ ] Mobile + desktop layouts
- [ ] Loading / error / empty states

---

## Future (NOT V1 — keep architecture open)
CSV/bank statement import · auto-categorization · subscription detection · AI insights · natural-language queries (question → intent → structured query → DB → calculation → LLM explanation; LLM never gets raw DB access) · multiple accounts · net worth · debt & credit cards · portfolio tracking · shared household / family accounts · advanced reports.

---

## Decisions log
- **2026-09-30** — Next.js 16.3.7 (latest) chosen; uses `proxy.ts` instead of `middleware.ts`.
- **2026-09-30** — shadcn `radix-nova` style with Radix primitives; shadcn now uses the `cn` package (`lib/utils.ts` re-exports it).
- **2026-09-30** — Amounts stored as `numeric(14,2)` (always positive); `type` decides sign. Currency INR by default (stored on profile for future).
- **2026-09-30** — Category `icon`/`color` stored as string keys (e.g. `food`, `orange`) resolved by `components/category-icon.tsx`; unknown keys fall back to `other`/`slate`.
- **2026-09-30** — Feature work happens on branches (`feature/<name>`), merged to `main` after verification.
- **2026-09-30** — Default categories are seeded **per user** (rows owned by user) so users can rename/archive freely without global tables.
