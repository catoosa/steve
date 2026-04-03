import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const orgId = membership.org_id;
  const now = new Date().toISOString();

  // Fetch members
  const { data: members, error: membersError } = await supabase
    .from("org_members")
    .select("user_id, role, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  // Fetch pending invitations
  const { data: invitations, error: invitesError } = await supabase
    .from("org_invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (invitesError) {
    return NextResponse.json({ error: invitesError.message }, { status: 500 });
  }

  // Enrich members with emails using service role
  const serviceClient = createServiceClient();
  const userIds = (members ?? []).map((m) => m.user_id);

  let userEmailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: allUsers } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    if (allUsers?.users) {
      for (const u of allUsers.users as { id: string; email?: string }[]) {
        if (userIds.includes(u.id)) {
          userEmailMap[u.id] = u.email ?? "";
        }
      }
    }
  }

  const enrichedMembers = (members ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    email: userEmailMap[m.user_id] ?? null,
  }));

  return NextResponse.json({
    members: enrichedMembers,
    invitations: invitations ?? [],
    orgId,
    currentUserId: user.id,
  });
}
