import { createClient } from "@/lib/supabase/server";

// Basic phone validation — format checks, carrier type heuristics
function validatePhone(phone: string): { valid: boolean; type: string; normalized: string; reason?: string } {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Normalize Australian numbers
  if (cleaned.startsWith("0")) cleaned = "+61" + cleaned.slice(1);
  if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;

  // Must have at least 10 digits
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) return { valid: false, type: "unknown", normalized: cleaned, reason: "Too few digits" };
  if (digits.length > 15) return { valid: false, type: "unknown", normalized: cleaned, reason: "Too many digits" };

  // Australian mobile: +614XX
  if (cleaned.startsWith("+614")) return { valid: true, type: "mobile", normalized: cleaned };

  // Australian landline: +61[2-9] (not 4)
  if (cleaned.startsWith("+61") && !cleaned.startsWith("+614")) return { valid: true, type: "landline", normalized: cleaned };

  // International — assume valid mobile
  if (cleaned.startsWith("+1")) return { valid: true, type: "mobile", normalized: cleaned }; // US/CA
  if (cleaned.startsWith("+44")) return { valid: true, type: "mobile", normalized: cleaned }; // UK

  // Generic international
  return { valid: true, type: "unknown", normalized: cleaned };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { campaign_id } = await request.json();
    if (!campaign_id) return Response.json({ error: "campaign_id required" }, { status: 400 });

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (!membership) return Response.json({ error: "No org" }, { status: 403 });

    // Fetch unvalidated contacts
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, phone")
      .eq("campaign_id", campaign_id)
      .eq("org_id", membership.org_id)
      .is("phone_valid", null)
      .limit(1000);

    if (!contacts || contacts.length === 0) {
      return Response.json({ message: "All contacts already validated", validated: 0 });
    }

    let valid = 0;
    let invalid = 0;
    let mobile = 0;
    let landline = 0;

    for (const contact of contacts) {
      const result = validatePhone(contact.phone);
      await supabase
        .from("contacts")
        .update({ phone_valid: result.valid, phone_type: result.type })
        .eq("id", contact.id);

      if (result.valid) valid++;
      else invalid++;
      if (result.type === "mobile") mobile++;
      if (result.type === "landline") landline++;
    }

    return Response.json({
      validated: contacts.length,
      valid,
      invalid,
      mobile,
      landline,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
