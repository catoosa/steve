import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "skawk2026";

// Routes that require beta access
const PROTECTED = ["/login", "/signup", "/dashboard", "/portal"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Subdomain / custom domain detection ---
  const hostHeader = request.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0]; // strip port

  const skawkSuffix = ".skawk.io";
  const isSkawkSubdomain =
    host.endsWith(skawkSuffix) &&
    host !== "skawk.io" &&
    host !== `www${skawkSuffix}`;

  const isCustomDomain =
    !host.endsWith(".skawk.io") &&
    host !== "localhost" &&
    !host.endsWith(".vercel.app");

  if (isSkawkSubdomain || isCustomDomain) {
    const url = request.nextUrl.clone();

    // Determine destination pathname and inject identity param
    let destPathname = pathname;
    let paramKey: string;
    let paramValue: string;

    if (isSkawkSubdomain) {
      const slug = host.slice(0, host.length - skawkSuffix.length);
      paramKey = "__slug";
      paramValue = slug;
    } else {
      paramKey = "__host";
      paramValue = host;
    }

    // Map root → /portal, /campaign/... → /portal/campaign/...
    if (pathname === "/" || pathname === "") {
      destPathname = "/portal";
    } else if (pathname.startsWith("/campaign/")) {
      destPathname = `/portal${pathname}`;
    }

    url.pathname = destPathname;
    url.searchParams.set(paramKey, paramValue);

    const rewritten = NextResponse.rewrite(url);
    // Still run session update
    await updateSession(request);
    return rewritten;
  }

  // --- Normal beta password gate ---
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const betaAccess = request.cookies.get("beta_access")?.value;
    if (betaAccess !== BETA_PASSWORD) {
      return NextResponse.redirect(new URL("/beta", request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
