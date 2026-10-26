import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session-cookie";

/**
 * Keeps the sign-in cookie alive for as long as the app is used, so
 * nobody gets signed out after the browser's cookie limit.
 * Only page loads (GET) renew it – server actions set the cookie themselves.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && request.method === "GET") {
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg).*)"],
};
