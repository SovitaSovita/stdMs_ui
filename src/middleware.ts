import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run i18n first
  const response = intlMiddleware(request);

  // Check auth
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

  // Public routes (allow access)
  const publicRoutes = ["/auth/signin", "/auth/reset-password"];
  if (publicRoutes.some((route) => pathname.includes(route))) {
    return response;
  }

  // Protected routes
  if (!token) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|km)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
