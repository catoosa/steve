import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function resolveOrg(
  supabase: ReturnType<typeof createServiceClient>,
  req: NextRequest
) {
  const slug = req.nextUrl.searchParams.get("__slug");
  const host = req.nextUrl.searchParams.get("__host");
  const orgId = req.nextUrl.searchParams.get("org_id");
  const key = req.nextUrl.searchParams.get("key");

  if (slug) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, api_key")
      .eq("slug", slug)
      .single();
    return data ?? null;
  }

  if (host) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, api_key")
      .eq("custom_domain", host)
      .single();
    return data ?? null;
  }

  if (orgId && key) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, api_key")
      .eq("id", orgId)
      .eq("api_key", key)
      .single();
    return data ?? null;
  }

  return null;
}

export async function GET(req: NextRequest) {
  // Use service client to bypass RLS — auth is via api_key / slug / custom_domain
  const supabase = createServiceClient();

  const org = await resolveOrg(supabase, req);

  if (!org) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, name, status, total_contacts, calls_completed, calls_answered, created_at"
    )
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    org_id: org.id,
    api_key: org.api_key,
    campaigns: campaigns ?? [],
  });
}
