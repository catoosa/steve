import { createClient, createServiceClient } from "@/lib/supabase/server";

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
      .select("phone, reason, source, created_at")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const rows = dncNumbers ?? [];
    const csv = [
      "phone,reason,source,created_at",
      ...rows.map((r: any) =>
        [
          `"${r.phone}"`,
          `"${(r.reason ?? "").replace(/"/g, '""')}"`,
          `"${r.source}"`,
          `"${r.created_at}"`,
        ].join(",")
      ),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="dnc-list.csv"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
