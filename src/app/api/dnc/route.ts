import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function normalizePhone(phone: string): string {
  // Strip all non-digit characters except a leading +
  const stripped = phone.trim();
  if (stripped.startsWith("+")) {
    return "+" + stripped.slice(1).replace(/\D/g, "");
  }
  return stripped.replace(/\D/g, "");
}

export async function GET() {
  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return Response.json({ error: "No organisation found" }, { status: 403 });
    }

    const { data: dncNumbers, error } = await supabase
      .from("dnc_numbers")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: dncNumbers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phones, reason } = body as { phones: string[]; reason?: string };

    if (!Array.isArray(phones) || phones.length === 0) {
      return Response.json({ error: "phones array is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return Response.json({ error: "No organisation found" }, { status: 403 });
    }

    const rows = phones
      .map((p) => normalizePhone(p))
      .filter((p) => p.length > 0)
      .map((phone) => ({
        org_id: membership.org_id,
        phone,
        reason: reason || null,
        source: "manual" as const,
      }));

    const { data, error } = await supabase
      .from("dnc_numbers")
      .upsert(rows, { onConflict: "org_id,phone", ignoreDuplicates: true })
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, added: data?.length ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
