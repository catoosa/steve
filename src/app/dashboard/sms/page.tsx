import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Send, Ghost, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listSMSConversations } from "@/lib/bland";

export default async function SMSPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let conversations: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    const result = await listSMSConversations();
    conversations = Array.isArray(result)
      ? result
      : result?.conversations ?? result?.data ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load conversations";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">SMS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send individual or batch SMS messages and view conversation threads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sms/batch"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
          >
            <Send className="w-4 h-4" />
            Batch SMS
          </Link>
          <Link
            href="/dashboard/sms/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Send SMS
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!error && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Ghost className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No conversations yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Send your first SMS message to start a conversation thread.
          </p>
          <Link
            href="/dashboard/sms/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Send SMS
          </Link>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="space-y-3">
          {conversations.map((c) => {
            const id = String(c.id || c.conversation_id || "");
            const phone = String(c.phone_number || c.to || c.phone || "Unknown");
            const lastMessage = String(
              c.last_message || c.preview || c.message || ""
            );
            const date = c.updated_at || c.created_at || c.date;
            const dateStr = date
              ? new Date(String(date)).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <Link
                key={id || phone}
                href={`/dashboard/sms/conversations/${id}`}
                className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow"
              >
                <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-sm font-mono truncate">
                      {phone}
                    </h3>
                    {dateStr && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {dateStr}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {lastMessage}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
