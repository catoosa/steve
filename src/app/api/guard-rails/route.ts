import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { listGuardRails, createGuardRail } from "@/lib/bland";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await listGuardRails();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data = await createGuardRail(body);
  return NextResponse.json(data);
}
