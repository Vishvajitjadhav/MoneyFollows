import { BottomNav, Sidebar } from "@/components/layout/app-nav";
import { TransactionSheetProvider } from "@/components/transactions/transaction-sheet";
import { requireUser } from "@/lib/auth";
import { getCategories, getCustomFields } from "@/lib/data/categories";

// Protected area. proxy.ts redirects signed-out visitors optimistically;
// requireUser() here is the real gate, and RLS guards every query.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  const [categories, customFields] = await Promise.all([getCategories(), getCustomFields()]);

  return (
    <TransactionSheetProvider categories={categories} customFields={customFields}>
      <div className="flex min-h-dvh flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </div>
      <BottomNav />
    </TransactionSheetProvider>
  );
}
