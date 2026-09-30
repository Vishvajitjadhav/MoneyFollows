# MoneyFollows — Brand Guide

> **Follow your money.** · *Know where your money goes.*

Modern, minimal, friendly, slightly playful, trustworthy. A Gen-Z fintech product — not a bank, not accounting software.
The same rules apply to the web app, the PWA icon and the PDF reports.

---

## 1. Logo

### Concept — the MF trail
An **MF ligature** drawn as one confident rounded stroke:
- The **M** rises, dips and rises again — money moving.
- The M's right leg **is** the F's stem, so the two letters share one line — *Money* flows straight into *Follows*.
- The F's top bar runs forward into a **dot**: the money. The line follows it.

It reads as "MF" at 16px, looks like a moving path at large sizes, and uses no currency symbols, coins, wallets or piggy banks.

### Geometry
Defined once in [`components/brand/mark.ts`](../components/brand/mark.ts): 48×48 grid, 5-unit round stroke, round joins, tile corner radius 13.
Change the mark there, then run `npm run icons` to regenerate every asset.

### Versions
| Asset | File | Use |
|---|---|---|
| Horizontal logo — light bg | `public/brand/logo-light.svg` | Website header, emails, PDF cover |
| Horizontal logo — dark bg | `public/brand/logo-dark.svg` | Dark surfaces, social banners |
| Horizontal logo — monochrome | `public/brand/logo-mono.svg` | Print, single-color contexts |
| Icon (coral tile) | `public/brand/mark.svg`, `mark-1024.png` | App icon, social avatar |
| Icon — dark tile | `public/brand/mark-dark.svg` | Dark-mode avatar |
| Mark only — coral / ink / white | `public/brand/mark-coral.svg`, `mark-mono.svg`, `mark-white.svg` | Watermarks, PDF footer, overlays |
| Favicon | `app/icon.svg`, `app/favicon.ico` (16/32/48) | Browser tab (auto-linked by Next.js) |
| Apple touch icon | `app/apple-icon.png` (180) | iOS home screen |
| PWA icons | `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` | Web app manifest (Phase 8) |

In React use `<Logo />` (lockup) or `<LogoMark />` (icon) from `components/brand/logo.tsx`.

### Rules
- Minimum size: mark 16px, lockup 96px wide.
- Clear space around the mark: at least ¼ of its height.
- Don't recolor the mark outside coral / ink / white, add gradients, shadows or outlines, rotate it, or re-typeset the wordmark.
- Wordmark: **Money** in ink (or white on dark) + **Follows** in coral; one word, no space.

---

## 2. Color

| Token | Hex | Role |
|---|---|---|
| `brand` | `#E85D5D` | Primary CTA, active nav, selected states, highlights, logo |
| `brand-strong` | `#D44848` | Hover/pressed coral, coral text on soft backgrounds |
| `brand-soft` | `#FFF1F1` | Selected chip/background tint, soft buttons |
| `background` | `#FAFAFA` | Page background |
| `card` | `#FFFFFF` | Cards, sheets, inputs |
| `foreground` | `#202020` | Primary text, expense amounts |
| `muted-foreground` | `#737373` | Secondary text, labels |
| `border` | `#EDEDED` | Card and divider borders |
| `success` / `success-soft` | `#1F9D6B` / `#EAF7F0` | Income, positive trends, budgets on track |
| `warning` / `warning-soft` | `#C98A12` / `#FFF6E5` | Budget ≥ 80%, negative trends (subtle) |
| `invest` | `#5B6CF0` | Investments |
| `destructive` | `#DC3D3D` | Delete, over budget |

**Coral is an accent, not a surface.** One coral hero element per screen (e.g. the + button or the Remaining card). Never coral page backgrounds or coral text blocks.

Charts: `chart-1…5` = coral, indigo, green, amber, violet. Category tints live in `components/category-icon.tsx`.

---

## 3. Typography

- **Inter** everywhere (web + PDF). Weights: 400 body, 500 labels, 600 amounts/titles, 700 headings & hero numbers.
- Tight tracking on headings (`-0.02em`) and big numbers (`-0.035em`).
- **Money is the hero:** always tabular figures (`money` / `money-hero` utilities, or `<MoneyText />`), Indian grouping via `formatINR()` — ₹1,00,000.
- Scale: hero 40px · h1 28–30px · h2 20px · body 16px · secondary 14px · caption 12px.

---

## 4. Icons

- **Lucide**, rounded, ~1.9 stroke, 16–24px.
- Category icons sit in a soft-tinted rounded square (`<CategoryIcon />`) — tinted background + saturated icon of the same hue.
- No clip-art, no 3D, no emoji as UI icons.

---

## 5. Components

| Element | Style |
|---|---|
| **Border radius** | Base 12px. Buttons/inputs `rounded-xl` (~17px), cards `rounded-2xl` (~22px), chips & hero CTA fully rounded |
| **Primary button** | Coral fill, white text, 44px tall (`xl` = 56px for "+ Add Expense"), hover → `brand-strong` |
| **Soft button** | `brand-soft` fill, `brand-strong` text — secondary coral actions |
| **Outline / ghost** | White or transparent, 1px border — neutral actions |
| **Cards** | White, 1px `#EDEDED` border, very soft shadow (`shadow-card`), 20px padding |
| **Inputs** | 44px tall, white, 1px border, coral focus ring at 20% |
| **Chips** | Pill, white + border; selected = `brand-soft` bg + coral border + `brand-strong` text |
| **Touch targets** | ≥ 44px everywhere |
| **Toasts** | Top-center, white card, short and specific: "₹250 Food expense added." |

---

## 6. Visual language

- Lots of white space, few lines, calm neutrals, one coral moment per screen.
- Numbers first, labels second.
- Friendly, direct microcopy: "Your first expense takes 5 seconds to add."
- Motion is quick and subtle (150–200ms), never bouncy for its own sake; respect reduced motion.

---

## 7. PDF reports

- Cover/header: `logo-light.svg`, report period, user name.
- Same palette: coral for key totals and chart series 1, neutrals for everything else.
- Inter, tabular figures, generous margins, cards rendered as light-bordered boxes.
- Footer: coral mark (`mark-coral.svg`) + "Follow your money." + page number.
