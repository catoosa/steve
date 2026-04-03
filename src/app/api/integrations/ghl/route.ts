import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { api_key?: string; location_id?: string; enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { api_key, location_id, enabled } = body;

  // Look up user's org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    ghl_enabled: enabled ?? false,
  };

  // Only update api_key if a new non-masked value is provided
  if (api_key !== undefined) {
    // If it looks like a masked value (starts with •), don't overwrite
    if (!api_key.startsWith("•")) {
      updates.ghl_api_key = api_key || null;
    }
  }

  if (location_id !== undefined) {
    updates.ghl_location_id = location_id || null;
  }

  const { data: org, error: updateError } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", membership.org_id)
    .select("id, ghl_api_key, ghl_location_id, ghl_enabled")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Mask api key in response — only show last 4 chars
  const maskedOrg = org
    ? {
        ...org,
        ghl_api_key: org.ghl_api_key
          ? "••••••••" + (org.ghl_api_key as string).slice(-4)
          : null,
      }
    : null;

  return NextResponse.json({ org: maskedOrg });
}
