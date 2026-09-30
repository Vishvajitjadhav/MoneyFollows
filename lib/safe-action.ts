import type { ActionResult } from "@/types/app";

/**
 * Call a Server Action without letting a network/server failure crash the page.
 * The form keeps its input and shows the message instead.
 */
export async function safeAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    // Next.js redirect()/notFound() must keep propagating.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) throw err;
    console.error(err);
    return { ok: false, error: navigator.onLine === false ? "You're offline. Reconnect and try again." : "Couldn't reach MoneyFollows. Please try again." };
  }
}
