import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/backend/neon-auth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/panel") && !request.cookies.has(sessionCookieName)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/panel/:path*", "/api/auth/:path*", "/api/products/:path*"],
};