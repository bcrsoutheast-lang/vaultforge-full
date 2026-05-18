import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const retiredRoomPaths = new Set([
  "/dashboard",
  "/opportunity",
  "/opportunity-rooms",
  "/projects",
  "/project",
  "/deal",
  "/deal-rooms",
  "/pressure",
  "/pressure-rooms",
  "/pain-feed",
  "/pain-rooms",
  "/routing-room",
  "/routing-inbox",
  "/signals",
  "/intelligence",
  "/alerts",
]);

function shouldBypass(pathname: string) {
  if (retiredRoomPaths.has(pathname)) return true;

  return (
    pathname.startsWith("/opportunity/") ||
    pathname.startsWith("/opportunity-rooms/") ||
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/project/") ||
    pathname.startsWith("/deal/") ||
    pathname.startsWith("/deal-rooms/") ||
    pathname.startsWith("/pressure/") ||
    pathname.startsWith("/pressure-rooms/") ||
    pathname.startsWith("/pain-feed/") ||
    pathname.startsWith("/pain-rooms/") ||
    pathname.startsWith("/routing-room/") ||
    pathname.startsWith("/signals/") ||
    pathname.startsWith("/alerts/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (shouldBypass(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/rooms";
    url.search = search || "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/opportunity",
    "/opportunity/:path*",
    "/opportunity-rooms",
    "/opportunity-rooms/:path*",
    "/projects",
    "/projects/:path*",
    "/project",
    "/project/:path*",
    "/deal",
    "/deal/:path*",
    "/deal-rooms",
    "/deal-rooms/:path*",
    "/pressure",
    "/pressure/:path*",
    "/pressure-rooms",
    "/pressure-rooms/:path*",
    "/pain-feed",
    "/pain-feed/:path*",
    "/pain-rooms",
    "/pain-rooms/:path*",
    "/routing-room",
    "/routing-room/:path*",
    "/routing-inbox",
    "/signals",
    "/signals/:path*",
    "/intelligence",
    "/alerts",
    "/alerts/:path*"
  ],
};