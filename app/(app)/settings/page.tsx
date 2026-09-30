import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, KeyRound, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/brand/logo";
import { Page, Section } from "@/components/layout/page";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, currency, created_at").eq("id", user.id).maybeSingle();

  const row = "flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition hover:bg-muted/60";

  return (
    <Page title="Settings">
      <div className="space-y-7">
        <Section title="Profile">
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
            <ProfileForm fullName={profile?.full_name ?? ""} />
            <div className="grid gap-1 text-sm">
              <span className="font-medium">Email</span>
              <span className="text-muted-foreground">{user.email}</span>
            </div>
            <div className="grid gap-1 text-sm">
              <span className="font-medium">Currency</span>
              <span className="text-muted-foreground">Indian Rupee (₹) · India time</span>
            </div>
          </div>
        </Section>

        <Section title="Account">
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
            <li>
              <Link href="/reset-password" className={row}>
                <KeyRound className="size-4 text-muted-foreground" />
                <span className="flex-1">Change password</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
            <li>
              <a href="/api/export/csv" download className={row}>
                <Download className="size-4 text-muted-foreground" />
                <span className="flex-1">Export all transactions (CSV)</span>
              </a>
            </li>
            <li>
              <form action={logout}>
                <button className={`${row} w-full text-destructive`}>
                  <LogOut className="size-4" />
                  <span className="flex-1 text-left">Log out</span>
                </button>
              </form>
            </li>
          </ul>
        </Section>

        <div className="flex flex-col items-center gap-2 pt-4 text-center text-xs text-muted-foreground">
          <LogoMark size={28} />
          <p>MoneyFollows · Follow your money.</p>
          <p>Your data is private to your account and protected by row-level security.</p>
        </div>
      </div>
    </Page>
  );
}
