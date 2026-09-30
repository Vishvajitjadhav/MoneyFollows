@AGENTS.md

# MoneyFollows

Mobile-first personal finance PWA — "Follow your money."

## Start of every session
1. Read `PLAN.md` — find **▶ NEXT UP** and continue from there.
2. Full product requirements live in `docs/SPEC.md` (product vision, categories, UX rules, schema). Check it before building a feature.
   Brand rules (logo, colors, type, components) live in `docs/BRAND.md`.
3. Build one task at a time. When a task is done **and verified**, tick it `[x]` in `PLAN.md`, move the **▶ NEXT UP** pointer, and add a line to the session log.

## Rules
- Next.js 16: read `node_modules/next/dist/docs/` before using an API; `proxy.ts` replaces `middleware.ts`.
- Server Components by default; mutations via Server Actions; Route Handlers only for PDF/CSV-style HTTP endpoints.
- Always get the user from the Supabase session server-side. Never trust a client-supplied `user_id`. Never ship the service-role key to the browser.
- Validate every input with Zod (`lib/validations`). Money math lives in `lib/calculations` as pure functions.
- Coral `#E85D5D` is for CTAs, active nav, highlights and selection only — don't make the UI red.
- No AI, no separate backend, no paid services in V1.
- Verify before ticking: `npm run check` (typecheck + lint + build).
