/**
 * Deterministic quick-entry parser — no AI.
 *
 *   "250 food lunch"     → ₹250 · Food › Lunch
 *   "500 petrol bike"    → ₹500 · Transport › Petrol · "Bike"
 *   "10000 parents"      → ₹10,000 · Family › Parents
 *   "350 movie"          → ₹350 · Entertainment › Movie
 *   "65000 salary"       → ₹65,000 · Income · Salary
 *   "1.5k swiggy dinner" → ₹1,500 · Food › Dinner · "Swiggy"
 *
 * Matches the user's own categories (incl. custom ones) first, then a small
 * alias table for everyday words. Unmatched words become the description.
 */

export type ParserCategory = {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME" | "INVESTMENT";
  icon?: string;
  subcategories: { id: string; name: string }[];
};

export type QuickEntry = {
  amount: number;
  type: ParserCategory["type"];
  categoryId: string | null;
  subcategoryId: string | null;
  description: string | null;
};

/** word → [category name (or icon key), subcategory name?] */
const ALIASES: Record<string, [string, string?]> = {
  // Food
  breakfast: ["food", "Breakfast"], lunch: ["food", "Lunch"], dinner: ["food", "Dinner"],
  milk: ["food", "Milk"], snack: ["food", "Snacks"], coffee: ["food", "Snacks"], tea: ["food", "Snacks"],
  chai: ["food", "Snacks"], juice: ["food", "Snacks"], swiggy: ["food", "Restaurant"], zomato: ["food", "Restaurant"],
  restaurant: ["food", "Restaurant"], cafe: ["food", "Restaurant"], grocery: ["food", "Other"], groceries: ["food", "Other"],
  // Transport
  petrol: ["transport", "Petrol"], fuel: ["transport", "Petrol"], diesel: ["transport", "Petrol"],
  uber: ["transport", "Cab"], ola: ["transport", "Cab"], rapido: ["transport", "Cab"], taxi: ["transport", "Cab"],
  cab: ["transport", "Cab"], auto: ["transport", "Cab"], bus: ["transport", "Bus"], metro: ["transport", "Other"],
  train: ["transport", "Other"], parking: ["transport", "Parking"], toll: ["transport", "Other"],
  // Housing & bills
  rent: ["housing", "Rent"], maintenance: ["housing", "Maintenance"],
  electricity: ["bills", "Electricity"], light: ["bills", "Electricity"], internet: ["bills", "Internet"],
  wifi: ["bills", "Internet"], broadband: ["bills", "Internet"], recharge: ["bills", "Mobile"], mobile: ["bills", "Mobile"],
  phone: ["bills", "Mobile"], insurance: ["bills", "Insurance"],
  // Family
  parents: ["family", "Parents"], parent: ["family", "Parents"], mom: ["family", "Parents"], mum: ["family", "Parents"],
  mummy: ["family", "Parents"], mother: ["family", "Parents"], dad: ["family", "Parents"], papa: ["family", "Parents"],
  father: ["family", "Parents"], home: ["family", "Parents"], brother: ["family", "Brother"], bro: ["family", "Brother"],
  bhai: ["family", "Brother"], sister: ["family", "Sister"], sis: ["family", "Sister"], didi: ["family", "Sister"],
  // Lifestyle / shopping
  gym: ["lifestyle", "Gym"], skincare: ["lifestyle", "Skincare"], haircut: ["lifestyle", "Haircut"], salon: ["lifestyle", "Haircut"],
  clothes: ["lifestyle", "Clothing"], clothing: ["lifestyle", "Clothing"], shirt: ["lifestyle", "Clothing"],
  electronics: ["shopping", "Electronics"], headphones: ["shopping", "Electronics"], earphones: ["shopping", "Electronics"],
  laptop: ["shopping", "Electronics"], watch: ["shopping", "Watch"], shoes: ["shopping", "Shoes"], sneakers: ["shopping", "Shoes"],
  amazon: ["shopping"], flipkart: ["shopping"], myntra: ["shopping"],
  // Entertainment
  movie: ["entertainment", "Movie"], cinema: ["entertainment", "Movie"], netflix: ["entertainment", "OTT"],
  prime: ["entertainment", "OTT"], hotstar: ["entertainment", "OTT"], spotify: ["entertainment", "OTT"], ott: ["entertainment", "OTT"],
  game: ["entertainment", "Games"], games: ["entertainment", "Games"], concert: ["entertainment", "Events"], event: ["entertainment", "Events"],
  // Health & education
  medicine: ["health", "Medicine"], medicines: ["health", "Medicine"], pharmacy: ["health", "Medicine"], doctor: ["health", "Doctor"],
  course: ["education", "Course"], book: ["education", "Books"], books: ["education", "Books"], certification: ["education", "Certification"],
  // Income
  salary: ["salary"], freelance: ["freelance"], bonus: ["bonus"], refund: ["refund"], cashback: ["refund"], gift: ["gift"],
  // Investment
  sip: ["sip"], mf: ["mutual-fund"], stocks: ["stocks"], stock: ["stocks"], shares: ["stocks"], ppf: ["ppf"], fd: ["fd"],
};

const STOPWORDS = new Set(["rs", "inr", "for", "on", "at", "to", "the", "a", "an", "and", "of", "in", "paid", "spent", "bought", "rupees"]);

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/(?<=[a-z]{3})s$/, "");

/** "₹2,500", "2.5k", "1L", "250/-" → number */
export function parseAmount(token: string): number | null {
  const m = token
    .toLowerCase()
    .replace(/[₹,]|rs\.?|\/-$/g, "")
    .match(/^(\d+(?:\.\d{1,2})?)(k|l|lakh)?$/);
  if (!m) return null;
  const value = parseFloat(m[1]) * (m[2] === "k" ? 1_000 : m[2] ? 1_00_000 : 1);
  return value > 0 ? Math.round(value * 100) / 100 : null;
}

export function parseQuickEntry(text: string, categories: ParserCategory[]): QuickEntry | null {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const amountIndex = tokens.findIndex((t) => parseAmount(t) !== null);
  if (amountIndex === -1) return null;
  const amount = parseAmount(tokens[amountIndex])!;
  let words = tokens.filter((_, i) => i !== amountIndex);

  let category: ParserCategory | null = null;
  let subcategory: { id: string; name: string } | null = null;
  const used = new Set<number>();

  const findCategory = (key: string) =>
    categories.find((c) => c.icon === key) ?? categories.find((c) => norm(c.name) === norm(key)) ?? null;

  // Candidate phrases: two-word names first ("bike service", "mutual fund"), then single words.
  const phrases: { text: string; idx: number[] }[] = [];
  words.forEach((w, i) => {
    if (i < words.length - 1) phrases.push({ text: `${w} ${words[i + 1]}`, idx: [i, i + 1] });
  });
  words.forEach((w, i) => phrases.push({ text: w, idx: [i] }));
  const usable = (p: { text: string; idx: number[] }) => {
    const n = norm(p.text);
    return !p.idx.some((i) => used.has(i)) && !STOPWORDS.has(p.text.toLowerCase()) && n && n !== "other" ? n : null;
  };

  // 1a. Category named explicitly ("food", "transport", "pets").
  for (const p of phrases) {
    const n = usable(p);
    const cat = n ? categories.find((c) => norm(c.name) === n) : undefined;
    if (cat) {
      category = cat;
      p.idx.forEach((i) => used.add(i));
      break;
    }
  }

  // 1b. Subcategory — within that category if we have one, else anywhere.
  for (const p of phrases) {
    const n = usable(p);
    if (!n) continue;
    for (const c of category ? [category] : categories) {
      const s = c.subcategories.find((sc) => norm(sc.name) === n);
      if (s) {
        category = c;
        subcategory = s;
        p.idx.forEach((i) => used.add(i));
        break;
      }
    }
    if (subcategory) break;
  }

  // 2. Aliases for everyday words ("uber", "mom", "swiggy").
  if (!subcategory) {
    words.forEach((w, i) => {
      if (subcategory || used.has(i)) return;
      const alias = ALIASES[w.toLowerCase()] ?? ALIASES[norm(w)];
      if (!alias) return;
      const cat = findCategory(alias[0]);
      if (!cat || (category && category.id !== cat.id)) return;
      category = cat;
      used.add(i);
      if (alias[1]) subcategory = cat.subcategories.find((s) => norm(s.name) === norm(alias[1]!)) ?? null;
    });
  }

  words = words.filter((w, i) => !used.has(i) && !STOPWORDS.has(w.toLowerCase()));
  const description = words.length ? words.join(" ").replace(/^./, (c) => c.toUpperCase()) : null;

  const resolved = category as ParserCategory | null;
  return {
    amount,
    type: resolved?.type ?? "EXPENSE",
    categoryId: resolved?.id ?? null,
    subcategoryId: (subcategory as { id: string } | null)?.id ?? null,
    description,
  };
}
