import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("org_id");
  const key = req.nextUrl.searchParams.get("key");

  if (!orgId || !key) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Use service client to bypass RLS — auth is via api_key check
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, api_key")
    .eq("id", orgId)
    .eq("api_key", key)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, name, status, total_contacts, calls_completed, calls_answered, created_at"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ campaigns: campaigns ?? [] });
}
