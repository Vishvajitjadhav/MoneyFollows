"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, MailCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldProps = React.ComponentProps<"input"> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: React.ReactNode;
};

export function Field({ label, name, errors, hint, type = "text", className, ...props }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={name}>{label}</Label>
        {hint}
      </div>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={isPassword && show ? "text" : type}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(isPassword && "pr-11", className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hasError && (
        <p id={errorId} className="text-sm text-destructive">
          {errors![0]}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" />}
      {children}
    </Button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function FormSuccess({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-start gap-4">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success">
        <MailCheck className="size-6" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
      {children}
    </div>
  );
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
