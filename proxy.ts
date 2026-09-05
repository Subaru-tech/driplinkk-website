import { clerkMiddleware } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Next.js 16 request proxy.
 * Integrates Clerk middleware session handling while maintaining
 * Supabase auth token refreshes.
 *
 * Next.js 16 renamed `middleware` to `proxy` (runtime is always nodejs).
 *
 * The actual auth *decision* lives in `app/dashboard/layout.tsx` — one guard,
 * in one place, next to the thing it protects.
 */
export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touching getUser() is what triggers the refresh. Do not remove.
  await supabase.auth.getUser();

  return response;
});

export default proxy;

export const config = {
  matcher: [
    /* Everything except static assets and image optimisation. */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
