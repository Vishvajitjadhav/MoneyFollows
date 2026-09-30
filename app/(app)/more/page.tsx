import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Page } from "@/components/layout/page";
import { MORE_NAV } from "@/components/layout/nav";

export const metadata: Metadata = { title: "More" };

export default function MorePage() {
  return (
    <Page title="More">
      <div className="space-y-7">
        {MORE_NAV.map((group) => (
          <section key={group.title} aria-labelledby={`more-${group.title}`}>
            <h2 id={`more-${group.title}`} className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.title}
            </h2>
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60">
                    <span className="inline-flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                      <item.icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      {item.description && <span className="block truncate text-xs text-muted-foreground">{item.description}</span>}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <form action={logout}>
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-card px-4 py-3.5 text-sm font-semibold text-destructive shadow-card transition hover:bg-destructive/5">
            <LogOut className="size-4" /> Log out
          </button>
        </form>
      </div>
    </Page>
  );
}
