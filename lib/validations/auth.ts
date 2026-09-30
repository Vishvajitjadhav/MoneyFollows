import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "What should we call you?").max(80, "That name is a bit long."),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

/** Only allow same-origin relative redirects ("/history"), never "//evil.com". */
export function safeNextPath(next: unknown, fallback = "/"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
