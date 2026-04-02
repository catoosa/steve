import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) {
      return Response.json({ error: "No org" }, { status: 403 });
    }

    // Verify campaign belongs to org
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("name, org_id")
      .eq("id", id)
      .single();

    if (!campaign || campaign.org_id !== membership.org_id) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Fetch all calls for this campaign
    const { data: calls } = await supabase
      .from("calls")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false });

    const rows = (calls ?? []).map((call) => {
      const analysis = call.analysis as Record<string, unknown> | null;
      const emotionData = analysis?.emotion as
        | Record<string, unknown>
        | undefined;
      const disposition = analysis?.disposition
        ? String(analysis.disposition)
        : "";
      const emotion = emotionData
        ? String(
            emotionData.primary_emotion ?? emotionData.emotion ?? ""
          )
        : "";
      const transcript = call.transcript
        ? String(call.transcript).slice(0, 200).replace(/[\r\n]+/g, " ")
        : "";

      return [
        call.phone ?? "",
        call.status ?? "",
        call.answered_by ?? "",
        call.duration_seconds ?? "",
        disposition,
        emotion,
        new Date(call.created_at).toISOString(),
        transcript,
      ];
    });

    const header = [
      "Phone",
      "Status",
      "Answered By",
      "Duration (s)",
      "Disposition",
      "Emotion",
      "Date",
      "Transcript (first 200 chars)",
    ];

    const csvContent = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const safeName = campaign.name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `campaign-${safeName}-${dateStr}.csv`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
