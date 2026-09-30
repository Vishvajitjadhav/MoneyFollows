import Link from "next/link";
import { Button } from "@/components/ui/button";

// Temporary landing until auth + app shell land (PLAN.md 1.5 / 1.8).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Money<span className="text-brand">Follows</span>
        </h1>
        <p className="text-lg text-muted-foreground">Follow your money.</p>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <Button asChild variant="soft">
          <Link href="/design">View design system</Link>
        </Button>
      )}
    </main>
  );
}
