import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  PhoneCall,
  Megaphone,
  ArrowRight,
  Activity,
  Plus,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const [campaignRes, callsRes, recentCallsRes] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("calls").select("id, status", { count: "exact", head: true }).eq("org_id", orgId),
    supabase
      .from("calls")
      .select("id, phone, status, duration_seconds, answered_by, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalCampaigns = campaignRes.count ?? 0;
  const totalCalls = callsRes.count ?? 0;
  const recentCalls = recentCallsRes.data ?? [];
  const balance = (org?.call_balance as number) ?? 0;

  return (
    <div>
      {/* Welcome header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back. Here&apos;s what&apos;s happening with your calls.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Calls Remaining",
            value: balance,
            icon: Phone,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Total Calls",
            value: totalCalls,
            icon: PhoneCall,
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            label: "Campaigns",
            value: totalCampaigns,
            icon: Megaphone,
            color: "text-secondary",
            bg: "bg-secondary/10",
          },
          {
            label: "Plan",
            value: ((org?.plan as string) ?? "free").charAt(0).toUpperCase() +
              ((org?.plan as string) ?? "free").slice(1),
            icon: Zap,
            color: "text-success",
            bg: "bg-success/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`${stat.bg} w-8 h-8 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions + Recent calls */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "Create Campaign", href: "/dashboard/campaigns/new", icon: Megaphone },
              { label: "View API Docs", href: "/dashboard/api", icon: Activity },
              { label: "Manage Billing", href: "/dashboard/billing", icon: Zap },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <action.icon className="w-4 h-4 text-muted-foreground" />
                  {action.label}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent calls */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent Calls</h2>
            <Link href="/dashboard/calls" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentCalls.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <PhoneCall className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No calls yet. Create a campaign to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentCalls.map((call) => (
                <div key={call.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{call.phone}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(call.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.duration_seconds && (
                      <span className="text-xs text-muted-foreground">{call.duration_seconds}s</span>
                    )}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        call.status === "completed"
                          ? "bg-success/10 text-success"
                          : call.status === "failed" || call.status === "no_answer"
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
    </div>
  );
}
