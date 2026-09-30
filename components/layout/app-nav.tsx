"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { useTransactionSheet } from "@/components/transactions/transaction-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isActive, MORE_NAV, PRIMARY_NAV } from "./nav";

export function BottomNav() {
  const pathname = usePathname();
  const { openAdd } = useTransactionSheet();
  const [home, history, analysis, more] = PRIMARY_NAV;
  const moreActive = isActive(pathname, "/more") || MORE_NAV.some((g) => g.items.some((i) => isActive(pathname, i.href)));

  const item = (n: (typeof PRIMARY_NAV)[number], active: boolean) => (
    <Link
      key={n.href}
      href={n.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[0.7rem] font-medium text-muted-foreground transition",
        active && "text-brand",
      )}
    >
      <n.icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.9} />
      {n.label}
    </Link>
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        {item(home, isActive(pathname, home.href))}
        {item(history, isActive(pathname, history.href))}
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={() => openAdd("EXPENSE")}
            aria-label="Add expense, income or investment"
            className="-mt-5 inline-flex size-[60px] items-center justify-center rounded-full bg-brand text-white shadow-float ring-4 ring-background transition active:scale-95"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
        </div>
        {item(analysis, isActive(pathname, analysis.href) && !isActive(pathname, "/analysis/calendar"))}
        {item(more, moreActive)}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { openAdd } = useTransactionSheet();

  const link = (href: string, label: string, Icon: (typeof PRIMARY_NAV)[number]["icon"]) => {
    const active = isActive(pathname, href) && !(href === "/analysis" && pathname.startsWith("/analysis/calendar"));
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
          active && "bg-brand-soft text-brand-strong hover:bg-brand-soft hover:text-brand-strong",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.9} />
        {label}
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="px-5 pt-6 pb-4">
        <Link href="/" aria-label="MoneyFollows home">
          <Logo size="sm" />
        </Link>
      </div>
      <div className="px-4 pb-4">
        <Button size="lg" className="w-full rounded-xl shadow-float" onClick={() => openAdd("EXPENSE")}>
          <Plus /> Add expense
        </Button>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">{PRIMARY_NAV.filter((n) => n.href !== "/more").map((n) => link(n.href, n.label, n.icon))}</div>
        {MORE_NAV.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">{group.title}</p>
            {group.items.map((n) => link(n.href, n.label, n.icon))}
          </div>
        ))}
      </nav>
      <form action={logout} className="border-t p-3">
        <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <LogOut className="size-[18px]" /> Log out
        </button>
      </form>
    </aside>
  );
}
