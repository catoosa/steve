import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, password, orgName } = await req.json();

  if (!email || !password || !orgName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Sign up the user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // let Supabase send the confirmation email
    user_metadata: { org_name: orgName },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Create the org using service role (bypasses RLS — user not confirmed yet)
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error: orgError } = await supabase.from("organizations").insert({
    name: orgName,
    slug: slug || `org-${Date.now()}`,
    owner_id: data.user.id,
  });

  if (orgError) {
    // Clean up — delete the user if org creation fails
    await supabase.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: "Failed to create organization: " + orgError.message }, { status: 500 });
  }

  // Return confirmation needed flag
  return NextResponse.json({ success: true, confirmationRequired: true, email });
}
