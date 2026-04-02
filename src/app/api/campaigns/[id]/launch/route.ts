import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { makeBatchCalls } from "@/lib/bland";

export async function POST(
  request: NextRequest,
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

    // Get campaign with org
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*, organizations(id, call_balance)")
      .eq("id", id)
      .single();

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Verify user is in org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("org_id", campaign.org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (campaign.status !== "draft") {
      return Response.json(
        { error: "Campaign is not in draft status" },
        { status: 400 }
      );
    }

    // Get pending contacts
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("campaign_id", id)
      .eq("status", "pending")
      .limit(1000);

    if (!contacts || contacts.length === 0) {
      return Response.json({ error: "No pending contacts" }, { status: 400 });
    }

    const campaignMeta = (campaign.metadata as Record<string, unknown>) || {};
    const org = campaign.organizations as Record<string, unknown>;
    if ((org.call_balance as number) < contacts.length) {
      return Response.json(
        {
          error: "Insufficient call balance",
          balance: org.call_balance,
          required: contacts.length,
        },
        { status: 402 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";
    const webhookUrl = `${appUrl}/api/webhook/bland`;

    // Create call records — check for A/B variant data in contact metadata
    const batchCalls = await Promise.all(
      contacts.map(async (contact: Record<string, unknown>) => {
        const contactMeta = (contact.metadata as Record<string, unknown>) || {};

        const { data: callRecord } = await supabase
          .from("calls")
          .insert({
            org_id: campaign.org_id,
            campaign_id: id,
            contact_id: contact.id as string,
            phone: contact.phone as string,
            status: "queued",
            metadata: contactMeta,
          })
          .select("id")
          .single();

        await supabase
          .from("contacts")
          .update({ status: "queued" })
          .eq("id", contact.id as string);

        // If the contact has variant-specific prompt data, use it as a per-call override
        const variantPrompt = contactMeta.variant_prompt as string | undefined;
        const variantFirstSentence = contactMeta.variant_first_sentence as string | undefined;

        return {
          phone: contact.phone as string,
          ...(variantPrompt ? { prompt: variantPrompt } : {}),
          ...(variantFirstSentence ? { firstSentence: variantFirstSentence } : {}),
          metadata: {
            org_id: campaign.org_id,
            campaign_id: id,
            contact_id: contact.id as string,
            steve_call_id: callRecord?.id || "",
            contact_name: (contact.name as string) || "",
            ...(contactMeta.variant ? { variant: contactMeta.variant as string } : {}),
          },
        };
      })
    );

    // Resolve memory ID: use stored ID or pass undefined (Bland auto-creates if memory enabled)
    const memoryEnabled = campaignMeta.enable_memory === true;
    const resolvedMemoryId = memoryEnabled
      ? ((campaignMeta.memory_id as string | undefined) || undefined)
      : undefined;

    // Resolve compliance guard rails stored in campaign metadata
    const complianceGuardRails = Array.isArray(campaignMeta.guard_rails)
      ? (campaignMeta.guard_rails as Array<{ description: string; action: string }>)
      : undefined;

    // Send to Bland AI
    const result = await makeBatchCalls({
      calls: batchCalls,
      global: {
        prompt: campaign.agent_prompt,
        firstSentence: campaign.first_sentence || undefined,
        analysisPrompt: campaign.analysis_prompt || undefined,
        voice: campaign.voice,
        language: campaign.language,
        maxDuration: campaign.max_duration,
        webhookUrl,
        dispositions: campaign.dispositions || undefined,
        memoryId: resolvedMemoryId,
        ...(complianceGuardRails && complianceGuardRails.length > 0
          ? { guardRails: complianceGuardRails }
          : {}),
      },
      label: `Skawk: ${campaign.name} (${batchCalls.length} calls)`,
    });

    // Update campaign status
    await supabase
      .from("campaigns")
      .update({ status: "active" })
      .eq("id", id);

    return Response.json({
      success: true,
      batch_id: result.batch_id,
      calls_queued: batchCalls.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
