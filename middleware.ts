import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const redirects: Record<string, string> = {
  "/projects": "/deal-rooms",
  "/opportunity": "/deal-rooms",
  "/opportunity-rooms": "/deal-rooms",
  "/deal": "/deal-rooms",
  "/pressure": "/pain-rooms",
  "/pressure-rooms": "/pain-rooms",
  "/pain-feed": "/pain-rooms",
  "/pain-rooms-old": "/pain-rooms",
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (redirects[path]) {
    return NextResponse.redirect(new URL(redirects[path], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/projects",
    "/opportunity",
    "/opportunity-rooms",
    "/deal",
    "/pressure",
    "/pressure-rooms",
    "/pain-feed",
    "/pain-rooms-old",
  ],
};
