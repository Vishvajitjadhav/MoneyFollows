"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthFormState } from "../actions";
import { AuthHeading, Field, FormError, FormSuccess, SubmitButton } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signup, {});

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
      <AuthHeading title="Create your account" description="Your first expense takes 5 seconds to add." />
      <form action={action} className="grid gap-4" noValidate>
        <FormError message={state.error} />
        <Field
          label="Name"
          name="fullName"
          autoComplete="name"
          placeholder="Your first name is fine"
          defaultValue={state.values?.fullName}
          errors={state.fieldErrors?.fullName}
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          errors={state.fieldErrors?.password}
          required
        />
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
