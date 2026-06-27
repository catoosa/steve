import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/bland";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // This endpoint can be called from the dashboard (no API key needed)
    // or from the API with an API key. Try both auth methods.
    let orgId: string | null = null;

    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (apiKey) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("api_key", apiKey)
        .single();
      if (org) orgId = org.id;
    }

    // Fetch the quote
    let query = supabase
      .from("quotes")
      .select("*, quote_line_items(*)")
      .eq("id", id);

    if (orgId) query = query.eq("org_id", orgId);

    const { data: quote, error } = await query.single();

    if (error || !quote)
      return Response.json({ error: "Quote not found" }, { status: 404 });

    // Get phone from request body or from the quote
    const body = await request.json().catch(() => ({}));
    const phone = body.phone || quote.customer_phone;

    if (!phone)
      return Response.json(
        { error: "No phone number available" },
        { status: 400 }
      );

    // Get org name for the message
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", quote.org_id)
      .single();

    const orgName = org?.name || "We";
    const total = `$${((quote.total_cents || 0) / 100).toFixed(2)}`;

    // Build line items summary (max 3 items shown)
    const items = quote.quote_line_items || [];
    const itemLines = items
      .slice(0, 3)
      .map(
        (li: { name: string; quantity: number; total_cents: number }) =>
          `- ${li.name} x${li.quantity}: $${(li.total_cents / 100).toFixed(2)}`
      )
      .join("\n");
    const moreItems =
      items.length > 3 ? `\n+ ${items.length - 3} more items` : "";

    const message = [
      `Hi ${quote.customer_name || "there"},`,
      ``,
      `${orgName} has sent you a quote (${quote.quote_number}):`,
      ``,
      itemLines,
      moreItems,
      ``,
      `Total (inc GST): ${total}`,
      quote.valid_until
        ? `Valid until: ${new Date(quote.valid_until).toLocaleDateString("en-AU")}`
        : "",
      ``,
      `Reply YES to accept or call us to discuss.`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendSMS(phone, message);

    // Update quote status and sent_at
    await supabase
      .from("quotes")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    return Response.json({ success: true, message: "Quote sent via SMS" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
