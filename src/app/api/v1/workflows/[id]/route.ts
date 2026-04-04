import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (workflowError)
      return Response.json({ error: "Workflow not found" }, { status: 404 });

    const { data: steps } = await supabase
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", id)
      .order("step_order", { ascending: true });

    const { data: executions } = await supabase
      .from("workflow_executions")
      .select("*")
      .eq("workflow_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    return Response.json({
      data: { ...workflow, steps: steps ?? [], executions: executions ?? [] },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify workflow belongs to org
    const { data: existing } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!existing)
      return Response.json({ error: "Workflow not found" }, { status: 404 });

    const body = await request.json();
    const { steps, ...workflowFields } = body;

    // Update workflow fields if any provided
    if (Object.keys(workflowFields).length > 0) {
      const { error: updateError } = await supabase
        .from("workflows")
        .update(workflowFields)
        .eq("id", id)
        .eq("org_id", org.id);

      if (updateError)
        return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Replace steps if provided
    if (steps) {
      const { error: deleteError } = await supabase
        .from("workflow_steps")
        .delete()
        .eq("workflow_id", id);

      if (deleteError)
        return Response.json({ error: deleteError.message }, { status: 500 });

      if (steps.length > 0) {
        const stepsWithWorkflowId = steps.map(
          (step: Record<string, unknown>) => ({
            ...step,
            workflow_id: id,
          })
        );

        const { error: insertError } = await supabase
          .from("workflow_steps")
          .insert(stepsWithWorkflowId);

        if (insertError)
          return Response.json(
            { error: insertError.message },
            { status: 500 }
          );
      }
    }

    // Fetch updated workflow with steps
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    const { data: updatedSteps } = await supabase
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", id)
      .order("step_order", { ascending: true });

    return Response.json({
      data: { ...workflow, steps: updatedSteps ?? [] },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id);

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
