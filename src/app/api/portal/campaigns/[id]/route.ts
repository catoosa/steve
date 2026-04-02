import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "****";
  return phone.slice(-4).padStart(phone.length, "*");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Fetch campaign — ensure it belongs to this org
  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, name, status, total_contacts, calls_completed, calls_answered, created_at, prompt"
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Fetch calls — mask phone, expose disposition only (no transcript)
  const { data: rawCalls } = await supabase
    .from("calls")
    .select(
      "id, phone, status, duration_seconds, answered_by, created_at, analysis"
    )
    .eq("campaign_id", id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const calls = (rawCalls ?? []).map((c: {
    id: string;
    phone: string | null;
    status: string;
    duration_seconds: number | null;
    answered_by: string | null;
    created_at: string;
    analysis: unknown;
  }) => {
    const analysis = c.analysis as Record<string, unknown> | null;
    return {
      id: c.id,
      phone: maskPhone(c.phone ?? ""),
      status: c.status,
      duration_seconds: c.duration_seconds,
      answered_by: c.answered_by,
      created_at: c.created_at,
      disposition: analysis?.disposition ?? null,
    };
  });

  return NextResponse.json({ campaign, calls });
}
