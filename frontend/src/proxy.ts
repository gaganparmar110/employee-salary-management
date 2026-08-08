import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/authCookie";

const PUBLIC_PATHS = new Set(["/login"]);

function hasValidToken(request: NextRequest): boolean {
  const raw = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.state?.token);
  } catch {
    return false;
  }
}

// The single source of truth for route protection — runs server-side
// before any page renders, so there's no client-side flash of the wrong
// page (unlike the useEffect-based redirects this replaces). Named
// "proxy" per the Next.js 16 file convention (middleware.ts is deprecated).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = hasValidToken(request);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(authenticated ? "/dashboard" : "/login", request.url));
  }

  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!authenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
