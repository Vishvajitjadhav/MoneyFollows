"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  safeNextPath,
  signupSchema,
} from "@/lib/validations/auth";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Shown instead of the form, e.g. "Check your email". */
  success?: string;
  /** Echo non-secret inputs back so the form keeps them after an error. */
  values?: Record<string, string>;
};

const entries = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));

const fieldErrors = (error: z.ZodError) => z.flattenError(error).fieldErrors as Record<string, string[]>;

/** Translate Supabase auth errors into friendly copy. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists. Try logging in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("same as the old") || m.includes("different from the old")) return "Choose a password different from your current one.";
  if (m.includes("weak") || m.includes("pwned")) return "That password is too easy to guess. Try a stronger one.";
  return "Something went wrong. Please try again.";
}

export async function login(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = entries(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: { email: raw.email ?? "" } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendly(error.message), values: { email: parsed.data.email } };

  redirect(safeNextPath(raw.next));
}

export async function signup(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = entries(formData);
  const values = { fullName: raw.fullName ?? "", email: raw.email ?? "" };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/`,
    },
  });
  if (error) return { error: friendly(error.message), values };

  // Email confirmation disabled → already signed in.
  if (data.session) redirect("/");

  return {
    success: `We sent a confirmation link to ${email}. Open it on this device to start tracking.`,
  };
}

export async function forgotPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = entries(formData);
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: { email: raw.email ?? "" } };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });
  // Don't reveal whether the account exists; only surface rate limits.
  if (error && /rate limit|too many/i.test(error.message)) return { error: friendly(error.message) };

  return {
    success: `If an account exists for ${parsed.data.email}, a reset link is on its way.`,
  };
}

export async function resetPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(entries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendly(error.message) };

  redirect("/?password=updated");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
