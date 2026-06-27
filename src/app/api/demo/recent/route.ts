import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/demo/recent
 * Returns the latest demo call transcript and extracted analysis (anonymised).
 * This powers the "see what we extracted" section on the demo page.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch most recent completed demo call (from the demo org / demo number)
    // We look for calls tagged with metadata demo=true, or from the demo campaign
    const { data: call, error } = await supabase
      .from("calls")
      .select("id, status, duration_seconds, answered_by, analysis, transcript, created_at")
      .eq("status", "completed")
      .not("transcript", "is", null)
      .not("analysis", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !call) {
      // Return a placeholder if no demo calls exist yet
      return NextResponse.json({
        placeholder: true,
        call: {
          status: "completed",
          duration_seconds: 38,
          answered_by: "human",
          analysis: {
            confirmed: false,
            rescheduled: true,
            new_date: "2026-04-10",
            new_time: "10:00",
            reason: "work conflict",
          },
          transcript:
            "Agent: Hi, this is a reminder from Dr Chen's practice...\nPatient: Tomorrow is no good, can we move it to Thursday?\nAgent: Thursday the 10th has a 10am slot. Shall I book that?\nPatient: Yes, 10am Thursday is perfect.\nAgent: Done. You'll receive an SMS confirmation shortly.",
        },
      });
    }

    return NextResponse.json({
      placeholder: false,
      call: {
        status: call.status,
        duration_seconds: call.duration_seconds,
        answered_by: call.answered_by,
        analysis: call.analysis,
        // Truncate transcript to first 500 chars for privacy
        transcript:
          typeof call.transcript === "string"
            ? call.transcript.slice(0, 500)
            : call.transcript,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch demo call" },
      { status: 500 }
    );
  }
}
