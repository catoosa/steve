import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey)
      return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();
    if (!org)
      return Response.json({ error: "Invalid API key" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("quotes")
      .select("*, quote_line_items(*)")
      .eq("org_id", org.id);

    if (status) query = query.eq("status", status);

    const { data: quotes, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey)
      return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();
    if (!org)
      return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      description,
      notes,
      valid_until,
      line_items,
      contact_id,
      call_id,
      deal_id,
      status: reqStatus,
    } = body;

    if (!customer_name) {
      return Response.json(
        { error: "customer_name is required" },
        { status: 400 }
      );
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return Response.json(
        { error: "line_items array is required" },
        { status: 400 }
      );
    }

    // Get quote number
    const { data: quoteNumber } = await supabase.rpc("next_quote_number", {
      p_org_id: org.id,
    });

    // Calculate totals
    const subtotalCents = line_items.reduce(
      (sum: number, li: { quantity: number; unit_price_cents: number }) =>
        sum + (li.quantity || 1) * (li.unit_price_cents || 0),
      0
    );
    const taxCents = Math.round(subtotalCents * 0.1);
    const totalCents = subtotalCents + taxCents;

    const quoteStatus = reqStatus || "draft";

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        org_id: org.id,
        quote_number: quoteNumber || "QTE-0001",
        status: quoteStatus,
        customer_name,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        description: description || null,
        subtotal_cents: subtotalCents,
        tax_cents: taxCents,
        total_cents: totalCents,
        valid_until: valid_until || null,
        notes: notes || null,
        contact_id: contact_id || null,
        call_id: call_id || null,
        deal_id: deal_id || null,
        sent_at: quoteStatus === "sent" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (quoteError)
      return Response.json({ error: quoteError.message }, { status: 500 });

    // Insert line items
    const lineItemRows = line_items.map(
      (
        li: {
          rate_card_item_id?: string;
          name: string;
          description?: string;
          quantity?: number;
          unit?: string;
          unit_price_cents: number;
        },
        idx: number
      ) => ({
        quote_id: quote.id,
        rate_card_item_id: li.rate_card_item_id || null,
        name: li.name,
        description: li.description || null,
        quantity: li.quantity || 1,
        unit: li.unit || "each",
        unit_price_cents: li.unit_price_cents,
        total_cents: (li.quantity || 1) * li.unit_price_cents,
        sort_order: idx,
      })
    );

    const { error: liError } = await supabase
      .from("quote_line_items")
      .insert(lineItemRows);

    if (liError)
      return Response.json({ error: liError.message }, { status: 500 });

    // Fetch complete quote with line items
    const { data: fullQuote } = await supabase
      .from("quotes")
      .select("*, quote_line_items(*)")
      .eq("id", quote.id)
      .single();

    return Response.json({ data: fullQuote }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
