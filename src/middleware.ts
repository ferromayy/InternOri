import { verifySessionCookie } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "internori_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionCookie(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) {
      const from = request.nextUrl.searchParams.get("from");
      const dest = safeRedirectPath(from);
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    const returnPath = `${pathname}${request.nextUrl.search}${request.nextUrl.hash}`;
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", returnPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
