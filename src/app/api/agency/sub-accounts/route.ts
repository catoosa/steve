import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// GET /api/agency/sub-accounts — list all sub-accounts for current agency org
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, is_agency, plan)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  if (!org || org.is_agency !== true || org.plan !== "agency") {
    return Response.json({ error: "Agency plan required" }, { status: 403 });
  }

  const { data: subAccounts, error } = await supabase
    .from("organizations")
    .select("id, name, plan, call_balance, monthly_call_limit, created_at")
    .eq("parent_org_id", org.id as string)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ sub_accounts: subAccounts ?? [] });
}

// POST /api/agency/sub-accounts — create a new sub-account
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name: string; owner_email: string; call_limit?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, owner_email, call_limit = 300 } = body;

  if (!name || !owner_email) {
    return Response.json({ error: "name and owner_email are required" }, { status: 400 });
  }

  // Get agency org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, name, is_agency, plan, sub_account_limit)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  if (!org || org.is_agency !== true || org.plan !== "agency") {
    return Response.json({ error: "Agency plan required" }, { status: 403 });
  }

  const agencyOrgId = org.id as string;
  const subAccountLimit = (org.sub_account_limit as number) ?? 10;

  // Check sub-account count
  const { count } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("parent_org_id", agencyOrgId);

  if ((count ?? 0) >= subAccountLimit) {
    return Response.json(
      { error: `Sub-account limit of ${subAccountLimit} reached` },
      { status: 409 }
    );
  }

  // Generate slug from name
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) +
    "-" +
    Math.random().toString(36).slice(2, 7);

  // We need a placeholder owner_id — use the agency owner for now
  // The invited user will become the real owner once they accept
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      owner_id: user.id,
      plan: "free",
      call_balance: call_limit,
      monthly_call_limit: call_limit,
      parent_org_id: agencyOrgId,
    })
    .select("id, name, slug, plan, call_balance, monthly_call_limit")
    .single();

  if (orgError || !newOrg) {
    return Response.json({ error: orgError?.message ?? "Failed to create org" }, { status: 500 });
  }

  // Create invitation for the owner email
  const { error: inviteError } = await supabase
    .from("org_invitations")
    .insert({
      org_id: newOrg.id,
      email: owner_email.toLowerCase(),
      role: "admin",
      invited_by: user.id,
    });

  if (inviteError) {
    // Org was created — log the invite error but don't fail the whole request
    console.error("Failed to create invitation:", inviteError.message);
  }

  return Response.json({ org: newOrg }, { status: 201 });
}
