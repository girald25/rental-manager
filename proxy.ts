import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/signup"];
const INVITE_ROUTE = "/invitacion";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, supabaseResponse } = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isInvite = pathname.startsWith(INVITE_ROUTE);

  // Allow invitation acceptance without auth
  if (isInvite) return supabaseResponse;

  // Unauthenticated user trying to access a protected route → send to login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = user?.user_metadata?.role ?? "owner";

  // Authenticated user hitting an auth page → redirect based on role
  if (user && isPublic) {
    const dest = role === "tenant" ? "/portal" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Tenant trying to access owner routes → redirect to portal
  if (user && role === "tenant" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // Owner trying to access tenant portal → redirect to dashboard
  if (user && role === "owner" && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
