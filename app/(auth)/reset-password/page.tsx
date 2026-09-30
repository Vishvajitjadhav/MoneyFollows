import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "New password" };

// Reached from the recovery email link, which signs the user in first (see /auth/callback).
export default async function ResetPasswordPage() {
  const user = await requireUser();
  return <ResetPasswordForm email={user.email} />;
}
