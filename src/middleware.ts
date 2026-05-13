import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PLAYGROUND_HOST, SITE_URL } from "@/lib/site-config";

function requestHost(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  return raw.split(":")[0].trim().toLowerCase();
}

function isPlaygroundAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("/opengraph-image")
  );
}

/**
 * `playground.devbench.co.in` is a branded entry point: `/` rewrites to the
 * playground route; everything else redirects to the main site so nav and
 * deep links stay on www.
 */
export function middleware(request: NextRequest) {
  if (requestHost(request) !== PLAYGROUND_HOST) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (isPlaygroundAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/" || pathname === "") {
    const url = request.nextUrl.clone();
    url.pathname = "/playground";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/playground" || pathname === "/playground/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  const target = new URL(pathname + search, SITE_URL);
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
