import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  // Look up the invitation
  const { data: invitation, error: fetchError } = await serviceClient
    .from("org_invitations")
    .select("id, org_id, email, role, accepted_at, expires_at")
    .eq("token", token)
    .single();

  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invalid invitation token." }, { status: 404 });
  }

  if (invitation.accepted_at) {
    return NextResponse.json({ error: "This invitation has already been accepted." }, { status: 409 });
  }

  if (invitation.expires_at < now) {
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  }

  // Check if user is already a member
  const { data: existingMember } = await serviceClient
    .from("org_members")
    .select("id")
    .eq("org_id", invitation.org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    // Already a member — just mark accepted and redirect
    await serviceClient
      .from("org_invitations")
      .update({ accepted_at: now })
      .eq("id", invitation.id);

    return NextResponse.json({ success: true, orgId: invitation.org_id });
  }

  // Insert into org_members
  const { error: insertError } = await serviceClient
    .from("org_members")
    .insert({
      org_id: invitation.org_id,
      user_id: user.id,
      role: invitation.role,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Mark invitation as accepted
  await serviceClient
    .from("org_invitations")
    .update({ accepted_at: now })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true, orgId: invitation.org_id });
}
