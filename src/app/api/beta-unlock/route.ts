import { NextResponse } from "next/server";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "skawk2026";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password !== BETA_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("beta_access", BETA_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
