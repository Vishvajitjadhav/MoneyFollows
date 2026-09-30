import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Temporary home until the mobile dashboard lands (PLAN.md 1.9).
export default async function Home() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);
  const name = profile?.full_name?.split(" ")[0];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <LogoMark size={64} title="MoneyFollows" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Hi{name ? `, ${name}` : ""} 👋</h1>
        <p className="text-muted-foreground">
          Signed in as {user.email}. {count ?? 0} categories ready.
        </p>
      </div>
      <form action={logout}>
        <Button variant="outline" type="submit">
          <LogOut /> Log out
        </Button>
      </form>
    </main>
  );
}
