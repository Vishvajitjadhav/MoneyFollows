"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "../actions";
import { AuthHeading, Field, FormError, SubmitButton } from "@/components/auth/form-parts";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, { error: initialError });

  return (
    <>
      <AuthHeading title="Welcome back" description="Log in to keep following your money." />
      <form action={action} className="grid gap-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
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
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          errors={state.fieldErrors?.password}
          required
          hint={
            <Link href="/forgot-password" className="text-sm font-medium text-brand-strong hover:underline">
              Forgot?
            </Link>
          }
        />
        <SubmitButton pending={pending}>Log in</SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand-strong hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
