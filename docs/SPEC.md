# MoneyFollows — Product Spec (V1)

Source: original product brief (2026-09-30). `PLAN.md` tracks progress; this file is the reference for *what* to build.

**Tagline:** Follow your money. · **Supporting:** Know where your money goes.
**Users:** students, bachelors, working/young professionals, people living away from home.
**Feel:** modern Gen-Z fintech — not accounting software, not a bank website, not corporate.
**Philosophy:** Open → Record → Understand → Improve.
**Golden test:** Does this make managing or understanding money easier? If not, not V1.

## 1. Questions the app must answer
How much did I earn / spend / invest / save? Where did my money go? How much on food, petrol, parents, shopping, movies? What did I buy this month? Spend on a specific day? Am I spending more than last month? Which categories are increasing? How much do I have left?

## 2. Branding
- Modern, Gen-Z, premium, minimal, friendly, fintech, slightly playful, trustworthy.
- No generic clip-art finance icons, no bank look.

### Logo
Must communicate **money + movement + tracking + flow**. Must work as website logo, app icon, favicon (16px), PWA icon, social avatar, PDF branding.
Directions: (A) money trail, (B) MF monogram — F continues the movement of the M, (C) circular flow Income → Spend → Save → Invest → Repeat, (D) abstract path.
Avoid: dollar-only, generic rupee, piggy banks, wallets, coin stacks, complex gradients, detail.
Deliver: horizontal logo, icon-only, monochrome, light-bg, dark-bg, favicon, PWA/mobile icon. Coral + white.
Also define: primary/secondary color, typography, icon style, button style, card style, border radius, visual language — shared by web app **and PDF reports**.

## 3. Colors
Primary `#E85D5D` (soft coral) · Secondary light `#FFF1F1` · Background `#FAFAFA` · Cards `#FFFFFF` · Text `#202020` · Secondary text `#737373` · Borders `#EDEDED` · Success subtle green · Warning subtle amber.
Coral only for primary CTA, active nav, important highlights, logo, selected states.

## 4. Typography
Inter. Large, readable, prominent numbers for Income / Expenses / Savings / Investments.

## 5. Stack & architecture
Next.js (App Router, TS, React) · Tailwind · shadcn/ui · Lucide · Server Actions (+ Route Handlers where useful) · Supabase Postgres + Auth · Zod + React Hook Form · Recharts · Vercel · PWA.
Serverless: Device → Next.js on Vercel → Server Actions/Route Handlers → Supabase → Postgres.
No always-running API server, Spring Boot, Docker, K8s, Redis, Kafka. Keep extensible for a dedicated backend later.
Free-first: Vercel free, Supabase free, no paid AI, no app-store. Works at `moneyfollows.vercel.app`, installable PWA.

## 6. Mobile-first
Bottom nav: **Home | History | + | Analysis | More**. Center + most prominent → Expense / Income / Investment. Thumb-friendly, large targets, minimal typing & scrolling.
Desktop: sidebar, intentional wide layouts (not stretched mobile).

## 7. Home screen
```
MoneyFollows
September
Income ₹75,500   Spent ₹32,850   Invested ₹15,000   Remaining ₹27,650
[ + Add Expense ]
Today's spending:  Food · Lunch ₹250 | Petrol · Bike ₹500 | Gym ₹100
Recent activity …
```
Clean. No wall of charts.

## 8. Quick expense entry (most important)
Amount (₹250) → Category → Subcategory → optional remark ("Office lunch") → SAVE. No forced fields.
Text entry: `250 food lunch`, `500 petrol bike`, `10000 parents`, `350 movie` — deterministic parsing, no AI.
**Acceptance:** Open URL → Login → + → ₹250 → Food → Lunch → Save in ~5–10 s.

## 9. Income
Salary, Freelance, Side income, Bonus, Gift, Refund, Other. Separate from expenses. Example: 65,000 + 8,000 + 2,500 = 75,500.

## 10. Family support (first-class)
Category **Family**: Parents, Brother, Sister, Family, Other. Analytics show Family Support total + breakdown. Never mixed into lifestyle.

## 11. Default expense categories
- **Food:** Lunch, Dinner, Breakfast, Milk, Snacks, Restaurant, Other
- **Transport:** Petrol, Bike Service, Car Service, Cab, Bus, Parking, Other
- **Housing:** Rent, Maintenance, Other
- **Bills:** Electricity, Internet, Mobile, Insurance, Other
- **Family:** Parents, Brother, Sister, Family, Other
- **Lifestyle:** Gym, Skincare, Haircut, Clothing, Accessories, Other
- **Shopping:** Electronics, Watch, Shoes, Accessories, Other
- **Entertainment:** Movie, OTT, Games, Events, Other
- **Health:** Medicine, Doctor, Other
- **Education:** Course, Books, Certification, Other
- **Other**

## 12. Custom categories & fields
Users create custom categories/subcategories (e.g. Pets → Food, Vet, Accessories) — rows, never schema changes.
Custom fields (Brand, Vehicle, Location, Occasion, Payment Method): Text, Number, Dropdown, Boolean, Date — metadata architecture, never user-modified schema.

## 13. Transaction model
`id, user_id, type (EXPENSE|INCOME|INVESTMENT), amount, category_id, subcategory_id, transaction_date, description, notes, custom_metadata, is_purchase, created_at, updated_at`. Every transaction belongs to a user.

## 14. History, search, filters
Chronological, grouped by date. Edit, delete, search, filters (date, category, subcategory, type, amount range), pagination.
Search across category, subcategory, description, remark, notes → results **with total** (e.g. "movie" → 3 rows, total ₹800).
Filters show matching rows **with total** (e.g. September + Petrol → ₹2,250).

## 15. Analysis
Time filters: This Month, Last Month, Last 3 Months, This Year, Custom.
KPIs: total income, expenses, investments, remaining, average daily spending, transaction count.
Charts: Income vs Expense, Category breakdown, Monthly spending trend, Daily spending, Month-over-month. Don't overuse charts.
**Drill-down:** Food → subcategory totals → tap Lunch → transactions. Works for every category.
**Calendar:** each day shows spend; tap → breakdown + total.

## 16. Purchases
Mark transactions as purchases (Watch ₹8,500, Headphones ₹4,999). Page: month total, year total, largest, by category, history.

## 17. Investments
Types: SIP, Mutual Fund, Stocks, PPF, FD, Other. Fields: name, type, amount, frequency, start date, notes. No live market data.

## 18. Recurring transactions
Rent, Gym, Netflix, Internet, Insurance, SIP. Fields: amount, category, subcategory, frequency (daily/weekly/monthly/yearly), start, end. Designed to auto-generate future transactions.

## 19. Budgets
Monthly per category: budget, used, remaining, %. Subtle warnings.

## 20. Savings goals
Emergency Fund, Laptop, Travel, Bike, Vacation… target, current, progress.

## 21. Financial plan
Inputs: monthly income, rent, debt/EMI, family support, investments, goals. Suggested starting allocation: Needs, Lifestyle, Family Support, Investments, Savings, Flexible. User-customizable %. Clearly labelled general guideline, **not** financial advice.

## 22. Insights (deterministic)
"You spent ₹8,200 on Food this month." · "Food up ₹1,400 vs last month." · "Shopping 21% lower than last month." · "82% of Food budget used." · "Family support up ₹2,000." · "Average daily spending ₹1,050." Only when backed by data.

## 23. Monthly review
Income, expenses, investments, remaining, top category, largest purchase, family support, comparison with previous month, trends.

## 24. PDF report
Options: current month, previous month, custom range. Contents: branding, user name, period, income, expenses, investments, remaining, savings rate, category breakdown, family support, top expenses, purchases, MoM comparison, spending chart, category chart, transaction summary. Professionally designed, server-side, no separate microservice.

## 25. CSV export
Columns `Date,Type,Category,Subcategory,Amount,Description,Notes`; respects date range/filters.
```
2026-09-30,EXPENSE,Food,Lunch,250,Office lunch,
2026-09-29,EXPENSE,Transport,Petrol,500,Bike,
2026-09-28,INCOME,Freelance,,5000,Website work,
```

## 26. Database
Tables: profiles, categories, subcategories, transactions, custom_field_definitions, transaction_custom_fields, budgets, investments, recurring_transactions, financial_goals, monthly_plans. Every user table has `user_id`. Indexes on user_id, transaction_date, category_id, subcategory_id, type. FKs + constraints.

## 27. Auth & security
Supabase Auth: sign up, login, logout, password reset, protected routes. RLS on everything — users only access their own data. Never trust frontend user_id; identity server-side. Never expose service-role key. Zod validation.

## 28. PWA
Add to Home Screen, app icon, standalone, mobile viewport, fast startup. No offline sync in V1.

## 29. Performance
Server Components, Server Actions, efficient SQL, pagination, indexes, optimistic UI where safe, caching, lazy charts, minimal client JS. Avoid loading all transactions, excessive useEffect, unnecessary API calls, giant client components, global state. UI updates immediately after saving.

## 30. Future AI (not V1)
Question → intent extraction → structured query → DB → calculation → LLM explanation. LLM never gets unrestricted DB access.

## 31. Future features (not V1)
CSV import, bank statement import, auto-categorization, subscription detection, AI insights, NL queries, multiple accounts, net worth, debt tracking, credit cards, portfolio tracking, shared household, family accounts, advanced reports.

## 32. Reusable calculation functions
`calculateMonthlyIncome, calculateMonthlyExpenses, calculateInvestments, calculateRemaining, calculateSavingsRate, calculateCategoryTotals, calculateSubcategoryTotals, calculateMonthlyComparison, calculateBudgetUsage, calculateFamilySupport, calculatePurchaseTotals`

## 33. UX details
Great empty states ("No expenses yet. Your first expense takes 5 seconds to add."), useful loading states, clear success feedback ("₹250 Food expense added."), confirmation for destructive actions, no annoying popups.

## 34. Final feel
"I can manage my entire personal money situation in a few minutes." — not "I have to maintain an accounting system." Reduce friction; make users *want* to record expenses.
