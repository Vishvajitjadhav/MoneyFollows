"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
        <TriangleAlert className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this page. Your data is safe — try again in a moment.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </main>
  );
}
