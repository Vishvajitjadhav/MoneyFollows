import type { Metadata } from "next";
import { safeNextPath } from "@/lib/validations/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  link: "That link is invalid or has expired. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(next, "");
  const initialError = typeof error === "string" ? ERRORS[error] : undefined;

  return <LoginForm next={nextPath || undefined} initialError={initialError} />;
}
