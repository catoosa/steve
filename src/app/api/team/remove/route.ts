import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Can't remove yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot remove yourself from the organization." }, { status: 400 });
  }

  // Get user's org and role
  const { data: requesterMembership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!requesterMembership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const { org_id: orgId, role: requesterRole } = requesterMembership;

  // Only owners and admins can remove members
  if (!["owner", "admin"].includes(requesterRole)) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  // Check the target member's role — can't remove the owner
  const { data: targetMembership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (targetMembership.role === "owner") {
    return NextResponse.json({ error: "The organization owner cannot be removed." }, { status: 400 });
  }

  // Delete the membership
  const { error: deleteError } = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
