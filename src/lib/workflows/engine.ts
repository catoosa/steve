import type { SupabaseClient } from "@supabase/supabase-js";
import type { CallContext, ConditionGroup } from "./conditions";
import { evaluateConditionGroup } from "./conditions";
import { executeAction } from "./actions";

const TRIGGER_MAP: Record<string, string> = {
  completed: "call_completed",
  no_answer: "call_no_answer",
  voicemail: "call_voicemail",
};

export async function executeWorkflows(
  context: CallContext,
  orgId: string,
  supabase: SupabaseClient
) {
  const triggerType = TRIGGER_MAP[context.status];
  if (!triggerType) return;

  const { data: workflows } = await supabase
    .from("workflows")
    .select("id, conditions")
    .eq("org_id", orgId)
    .eq("trigger_type", triggerType)
    .eq("enabled", true);

  if (!workflows || workflows.length === 0) return;

  for (const workflow of workflows) {
    const conditions = workflow.conditions as ConditionGroup | null;
    if (conditions && conditions.rules?.length > 0) {
      if (!evaluateConditionGroup(conditions, context)) continue;
    }

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id: workflow.id,
        call_id: context.id,
        contact_id: context.contact?.id,
        campaign_id: context.campaign_id,
        org_id: orgId,
        status: "running",
      })
      .select("id")
      .single();

    if (execError || !execution) {
      console.error("[workflow] Failed to create execution:", execError?.message);
      continue;
    }

    // Fetch steps
    const { data: steps } = await supabase
      .from("workflow_steps")
      .select("id, step_order, condition, action_type, action_config")
      .eq("workflow_id", workflow.id)
      .order("step_order", { ascending: true });

    let hasFailure = false;

    for (const step of steps || []) {
      // Evaluate per-step condition if present
      if (step.condition) {
        const stepCondition = step.condition as ConditionGroup;
        if (stepCondition.rules?.length > 0 && !evaluateConditionGroup(stepCondition, context)) {
          await supabase.from("workflow_step_executions").insert({
            execution_id: execution.id,
            step_id: step.id,
            status: "skipped",
            result: { reason: "Condition not met" },
          });
          continue;
        }
      }

      try {
        const result = await executeAction(
          step.action_type,
          (step.action_config || {}) as Record<string, unknown>,
          context,
          supabase
        );

        await supabase.from("workflow_step_executions").insert({
          execution_id: execution.id,
          step_id: step.id,
          status: result.success ? "success" : "failed",
          result,
        });

        if (!result.success) hasFailure = true;
      } catch (err) {
        hasFailure = true;
        await supabase.from("workflow_step_executions").insert({
          execution_id: execution.id,
          step_id: step.id,
          status: "failed",
          result: { error: String(err) },
        });
      }
    }

    await supabase
      .from("workflow_executions")
      .update({
        status: hasFailure ? "failed" : "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", execution.id);
  }
}
