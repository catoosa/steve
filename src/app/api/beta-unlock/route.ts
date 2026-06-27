import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const betaPassword = process.env.BETA_PASSWORD;
  if (!betaPassword) {
    // Beta gate disabled when no password configured — allow all
    const response = NextResponse.json({ success: true });
    response.cookies.set("beta_access", "open", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  const { password } = await req.json();

  if (password !== betaPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("beta_access", betaPassword, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
