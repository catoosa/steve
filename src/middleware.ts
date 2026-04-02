import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "skawk2026";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the beta unlock route through
  if (pathname === "/api/beta-unlock") {
    return NextResponse.next();
  }

  // Check for beta access cookie
  const betaAccess = request.cookies.get("beta_access")?.value;
  if (betaAccess !== BETA_PASSWORD) {
    // Show the beta gate page
    if (pathname === "/beta") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/beta", request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.ico).*)",
  ],
};
