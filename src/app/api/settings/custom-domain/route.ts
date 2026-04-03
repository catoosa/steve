import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Basic domain validation: no protocol, no spaces, must have at least one dot
function isValidDomain(value: string): boolean {
  if (/\s/.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (value.includes("/")) return false;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(value);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { custom_domain?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { custom_domain } = body;

  // Validate if provided (null/undefined clears the domain)
  if (custom_domain !== null && custom_domain !== undefined && custom_domain !== "") {
    if (!isValidDomain(custom_domain)) {
      return NextResponse.json(
        { error: "Invalid domain format. Enter a plain domain like portal.yourclient.com (no protocol or path)." },
        { status: 400 }
      );
    }
  }

  // Look up user's org via membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const domainValue = custom_domain || null;

  const { data: org, error: updateError } = await supabase
    .from("organizations")
    .update({ custom_domain: domainValue })
    .eq("id", membership.org_id)
    .select("id, name, slug, custom_domain")
    .single();

  if (updateError) {
    // Unique constraint violation
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "This domain is already in use by another organization." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ org });
}
