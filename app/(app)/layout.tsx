import { requireUser } from "@/lib/auth";

// Protected area. proxy.ts redirects signed-out visitors optimistically;
// this server-side check is the real gate. App shell arrives in PLAN.md 1.8.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return <div className="flex flex-1 flex-col">{children}</div>;
}
