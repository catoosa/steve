import { redirect } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const EMOTION_COLORS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  happy: "bg-success/10 text-success",
  angry: "bg-destructive/10 text-destructive",
  sad: "bg-blue-100 text-blue-600",
  fear: "bg-yellow-100 text-yellow-600",
};

function EmotionBadge({ emotion }: { emotion: string }) {
  const key = emotion.toLowerCase();
  const colors = EMOTION_COLORS[key] || EMOTION_COLORS.neutral;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors}`}>
      {emotion}
    </span>
  );
}

export default async function CallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  const { data: calls } = await supabase
    .from("calls")
    .select("*, campaigns(name)")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Call Logs</h1>

      <div className="bg-background border border-border rounded-xl">
        {!calls || calls.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground">
            <PhoneCall className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <p>No calls yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Campaign</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Answered By</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Emotion</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium">{call.phone}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {(call.campaigns as Record<string, unknown>)?.name as string ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          call.status === "completed"
                            ? "bg-success/10 text-success"
                            : call.status === "failed" ||
                                call.status === "no_answer"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {call.answered_by || "—"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {call.duration_seconds ? `${call.duration_seconds}s` : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {call.analysis?.emotion ? (
                        <EmotionBadge emotion={call.analysis.emotion.primary_emotion ?? call.analysis.emotion.emotion ?? "neutral"} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(call.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
