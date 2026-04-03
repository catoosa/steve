import { redirect } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CallsTable } from "./calls-table";

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
          <CallsTable calls={calls as Parameters<typeof CallsTable>[0]["calls"]} />
        )}
      </div>
    </div>
  );
}
