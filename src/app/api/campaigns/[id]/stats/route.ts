import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify user has access to this campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("org_id")
      .eq("id", id)
      .single();

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("org_id", campaign.org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Count by status
    const { data: rows, error } = await supabase
      .from("calls")
      .select("status, answered_by")
      .eq("campaign_id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const counts = {
      total: 0,
      completed: 0,
      answered: 0,
      in_progress: 0,
      queued: 0,
    };

    for (const row of rows ?? []) {
      counts.total++;
      if (row.status === "completed") {
        counts.completed++;
        if (row.answered_by === "human") counts.answered++;
      } else if (row.status === "in_progress") {
        counts.in_progress++;
      } else if (row.status === "queued") {
        counts.queued++;
      }
    }

    const answer_rate =
      counts.completed > 0
        ? Math.round((counts.answered / counts.completed) * 100)
        : 0;

    return Response.json({ ...counts, answer_rate });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
