import { redirect } from "next/navigation";
import { Phone, PhoneCall, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, name, plan, call_balance, monthly_call_limit)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;
  const orgId = membership?.org_id;

  if (!orgId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">No organization found</h2>
        <p className="text-muted-foreground">Something went wrong during signup.</p>
      </div>
    );
  }

  // Get stats
  const [campaignRes, callsRes, recentCallsRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("calls")
      .select("id, status", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("calls")
      .select("id, phone, status, duration_seconds, created_at, campaign_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalCampaigns = campaignRes.count ?? 0;
  const totalCalls = callsRes.count ?? 0;
  const recentCalls = recentCallsRes.data ?? [];

  const stats = [
    {
      label: "Calls Remaining",
      value: (org?.call_balance as number) ?? 0,
      icon: Phone,
      color: "text-primary",
    },
    {
      label: "Total Calls",
      value: totalCalls,
      icon: PhoneCall,
      color: "text-accent",
    },
    {
      label: "Campaigns",
      value: totalCampaigns,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Plan",
      value: ((org?.plan as string) ?? "free").charAt(0).toUpperCase() + ((org?.plan as string) ?? "free").slice(1),
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent calls */}
      <div className="bg-background border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Recent Calls</h2>
        </div>
        {recentCalls.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <PhoneCall className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No calls yet. Create a campaign to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentCalls.map((call) => (
              <div
                key={call.id}
                className="px-6 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{call.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(call.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {call.duration_seconds && (
                    <span className="text-xs text-muted-foreground">
                      {call.duration_seconds}s
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      call.status === "completed"
                        ? "bg-success/10 text-success"
                        : call.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {call.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
