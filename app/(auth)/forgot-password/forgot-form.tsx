"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { forgotPassword, type AuthFormState } from "../actions";
import { AuthHeading, Field, FormError, FormSuccess, SubmitButton } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(forgotPassword, {});

  if (state.success) {
    return (
      <FormSuccess title="Check your email" message={state.success}>
        <Button asChild variant="outline">
          <Link href="/login">Back to log in</Link>
        </Button>
      </FormSuccess>
    );
  }

  return (
    <>
      <AuthHeading title="Reset your password" description="We'll email you a link to choose a new one." />
      <form action={action} className="grid gap-4" noValidate>
        <FormError message={state.error} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
          required
        />
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
      </form>
      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to log in
      </Link>
    </>
  );
}
