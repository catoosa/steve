import { redirect } from "next/navigation";
import { Key, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, api_key, plan)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">API Access</h1>

      <div className="bg-background border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Your API Key</h2>
        </div>

        {org?.plan === "free" ? (
          <p className="text-sm text-muted-foreground">
            API access is available on the Pro plan and above.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm font-mono">
                {org?.api_key as string}
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep this key secret. Do not expose it in client-side code.
            </p>
          </>
        )}
      </div>

      {/* API Docs */}
      <div className="bg-background border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Quick Start</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Make a single call</h3>
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`curl -X POST https://skawk.io/api/v1/calls \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "phone": "0412345678",
    "prompt": "You are a friendly agent calling to confirm an appointment at 2pm Tuesday.",
    "first_sentence": "Hi, this is Steve calling from Acme Health.",
    "analysis_prompt": "Extract: {\\\"confirmed\\\": true/false, \\\"notes\\\": \\\"\\\"}"
  }'`}</pre>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Batch calls</h3>
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`curl -X POST https://skawk.io/api/v1/calls \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "prompt": "Ask about stock availability",
    "analysis_prompt": "Extract: {\\\"in_stock\\\": true/false}",
    "calls": [
      { "phone": "0412345678", "metadata": { "store": "Sydney CBD" } },
      { "phone": "0498765432", "metadata": { "store": "Melbourne" } }
    ]
  }'`}</pre>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Webhook payload</h3>
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`// POST to your webhook URL
{
  "event": "call.completed",
  "call_id": "uuid",
  "phone": "+61412345678",
  "status": "completed",
  "duration_seconds": 45,
  "answered_by": "human",
  "transcript": "Agent: Hi, this is Steve...",
  "analysis": { "confirmed": true, "notes": "" },
  "metadata": { "store": "Sydney CBD" }
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
