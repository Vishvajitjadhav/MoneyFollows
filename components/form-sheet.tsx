"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/responsive-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeAction } from "@/lib/safe-action";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/app";

type FormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  successMessage: string;
  onSubmit: () => Promise<ActionResult<unknown>>;
  /** Shown as a trash button with confirmation. */
  onDelete?: () => Promise<ActionResult<unknown>>;
  deleteLabel?: string;
  children: React.ReactNode;
};

/** Sheet with a form body, sticky save button, errors and optional confirmed delete. */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  successMessage,
  onSubmit,
  onDelete,
  deleteLabel = "this item",
  children,
}: FormSheetProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<ActionResult<unknown>>, message: string) =>
    startTransition(async () => {
      setError(null);
      const r = await safeAction(fn);
      if (!r.ok) return setError(r.error);
      setConfirm(false);
      onOpenChange(false);
      toast.success(message);
    });

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={title} description={description} className="flex flex-col">
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          run(onSubmit, successMessage);
        }}
      >
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 pt-2 pb-4 md:px-6">{children}</div>
        <div className="border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:px-6 md:pb-5">
          {error && (
            <p role="alert" className="mb-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            {onDelete && (
              <Button type="button" variant="destructive" size="icon-lg" aria-label="Delete" onClick={() => setConfirm(true)}>
                <Trash2 />
              </Button>
            )}
            <Button type="submit" size="lg" className="flex-1" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>

      {onDelete && (
        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteLabel}?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => run(onDelete, "Deleted.")}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ResponsiveSheet>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AmountInput({ id, value, onChange, placeholder = "0" }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-semibold text-muted-foreground">₹</span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
        className="money pl-8 text-lg"
      />
    </div>
  );
}

export const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 md:text-sm";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(selectClass, className)} {...props} />;
}
