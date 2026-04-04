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

    const { data: workflows, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: workflows });
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
    const { steps, ...workflowData } = body;

    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .insert({
        ...workflowData,
        org_id: org.id,
      })
      .select()
      .single();

    if (workflowError)
      return Response.json({ error: workflowError.message }, { status: 500 });

    let insertedSteps = [];
    if (steps && steps.length > 0) {
      const stepsWithWorkflowId = steps.map(
        (step: Record<string, unknown>) => ({
          ...step,
          workflow_id: workflow.id,
        })
      );

      const { data: stepsData, error: stepsError } = await supabase
        .from("workflow_steps")
        .insert(stepsWithWorkflowId)
        .select();

      if (stepsError)
        return Response.json({ error: stepsError.message }, { status: 500 });

      insertedSteps = stepsData;
    }

    return Response.json(
      { data: { ...workflow, steps: insertedSteps } },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
