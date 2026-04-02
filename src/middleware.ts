import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "skawk2026";

// Routes that require beta access
const PROTECTED = ["/login", "/signup", "/dashboard", "/portal"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
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
  matcher: ["/dashboard/:path*", "/login", "/signup", "/portal/:path*"],
};
