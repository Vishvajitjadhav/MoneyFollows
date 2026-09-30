import {
  CalendarDays,
  ChartPie,
  FileText,
  Goal,
  History,
  House,
  LayoutGrid,
  ListChecks,
  Repeat,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sprout,
  Target,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; description?: string };

/** Mobile bottom bar (the + sits in the middle). */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/history", label: "History", icon: History },
  { href: "/analysis", label: "Analysis", icon: ChartPie },
  { href: "/more", label: "More", icon: LayoutGrid },
];

/** Everything under "More" (and the desktop sidebar). */
export const MORE_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Plan & track",
    items: [
      { href: "/budgets", label: "Budgets", icon: Target, description: "Monthly limits per category" },
      { href: "/goals", label: "Savings goals", icon: Goal, description: "Emergency fund, laptop, travel" },
      { href: "/investments", label: "Investments", icon: Sprout, description: "SIPs, mutual funds, PPF, FD" },
      { href: "/recurring", label: "Recurring", icon: Repeat, description: "Rent, gym, Netflix, SIPs" },
      { href: "/plan", label: "Financial plan", icon: WalletCards, description: "A starting allocation for your income" },
    ],
  },
  {
    title: "Understand",
    items: [
      { href: "/review", label: "Monthly review", icon: ListChecks, description: "Your month at a glance" },
      { href: "/analysis/calendar", label: "Calendar", icon: CalendarDays, description: "Spending day by day" },
      { href: "/purchases", label: "Purchases", icon: ShoppingBag, description: "Things you bought" },
      { href: "/reports", label: "Reports & export", icon: FileText, description: "PDF report and CSV" },
    ],
  },
  {
    title: "Setup",
    items: [
      { href: "/categories", label: "Categories", icon: SlidersHorizontal, description: "Your categories and subcategories" },
      { href: "/custom-fields", label: "Custom fields", icon: LayoutGrid, description: "Brand, vehicle, payment method…" },
      { href: "/settings", label: "Settings", icon: Settings, description: "Profile and account" },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
