import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

/** Routes reachable without signing in. Everything else requires a session. */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/auth", "/design", "/setup"];
/** Signed-in users visiting these are sent to the app instead. */
const AUTH_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Refreshes the Supabase session cookie and does an optimistic auth redirect.
 * Real authorization still happens server-side (getUser + RLS) on every query.
 */
export async function updateSession(request: NextRequest) {
  // Not configured yet → explain how, instead of crashing every page.
  if (!hasSupabaseEnv()) {
    const { pathname } = request.nextUrl;
    if (pathname === "/setup" || pathname.startsWith("/design")) return NextResponse.next({ request });
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not run code between createServerClient and getClaims():
  // it validates the JWT and refreshes an expired session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && !matches(pathname, PUBLIC_PATHS)) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(to, response);
  }

  if (signedIn && matches(pathname, AUTH_ONLY_PATHS)) {
    const to = request.nextUrl.clone();
    to.pathname = "/";
    to.search = "";
    return redirectWithCookies(to, response);
  }

  return response;
}

/** Keep any refreshed session cookies when redirecting. */
function redirectWithCookies(to: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(to);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
