import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/cadastro", "/verificar-email"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("__session");

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|login|cadastro|verificar-email|.*\\..*).*)"],
};
