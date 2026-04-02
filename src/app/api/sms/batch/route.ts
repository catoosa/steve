import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMSBatch } from "@/lib/bland";

/** POST /api/sms/batch — Send batch SMS messages (dashboard auth) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each message has to and message fields
    for (const msg of body.messages) {
      if (!msg.to || !msg.message) {
        return Response.json(
          { error: "Each message must have to and message fields" },
          { status: 400 }
        );
      }
    }

    const result = await sendSMSBatch(body.messages);
    return Response.json({ success: true, count: body.messages.length, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
