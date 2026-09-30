import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Setup" };
export const dynamic = "force-dynamic";

const STEPS = [
  ["Create a free Supabase project", "supabase.com → New project. Pick the region closest to your users (e.g. Mumbai)."],
  ["Copy the API values", "Project Settings → API Keys: the Project URL and the publishable (or anon) key."],
  ["Add them to .env.local", "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — see .env.example. On Vercel, add them under Project → Settings → Environment Variables."],
  ["Create the database", "Put the database password into DIRECT_URL, then run: npm run db:migrate"],
  ["Allow auth redirects", "Supabase → Authentication → URL Configuration: add your site URL (http://localhost:3000 and your Vercel URL) with /** to Redirect URLs."],
];

/** Shown instead of the app until Supabase is configured. Contains no secrets. */
export default function SetupPage() {
  if (hasSupabaseEnv()) redirect("/");
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-12">
      <LogoMark size={48} />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Almost there</h1>
        <p className="text-muted-foreground">MoneyFollows needs a Supabase project to store your data. Five minutes, all free.</p>
      </div>
      <ol className="space-y-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-card">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">{i + 1}</span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">Then restart the dev server (or redeploy) and reload this page.</p>
    </main>
  );
}
