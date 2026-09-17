import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decodeSession, SESSION_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    if (pathname.startsWith("/bibliotecario") || pathname.startsWith("/frequentador")) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const session = decodeSession(sessionCookie);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session.role) {
    const target = session.role === "bibliotecario" ? "/bibliotecario/home" : "/frequentador/home";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith("/bibliotecario") && session.role !== "bibliotecario") {
    return NextResponse.redirect(new URL("/login?error=acesso-negado", request.url));
  }

  if (pathname.startsWith("/frequentador") && session.role !== "frequentador") {
    return NextResponse.redirect(new URL("/login?error=acesso-negado", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/bibliotecario/:path*", "/frequentador/:path*"],
};
