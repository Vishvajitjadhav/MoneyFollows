"use client";

import { useActionState } from "react";
import { resetPassword, type AuthFormState } from "../actions";
import { AuthHeading, Field, FormError, SubmitButton } from "@/components/auth/form-parts";

export function ResetPasswordForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPassword, {});

  return (
    <>
      <AuthHeading
        title="Choose a new password"
        description={email ? `For ${email}.` : "Pick something you haven't used before."}
      />
      <form action={action} className="grid gap-4" noValidate>
        <FormError message={state.error} />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          errors={state.fieldErrors?.password}
          required
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          errors={state.fieldErrors?.confirmPassword}
          required
        />
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </>
  );
}
