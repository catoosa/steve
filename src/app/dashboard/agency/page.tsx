import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Plus, Users, Phone, BarChart3, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type SubAccount = {
  id: string;
  name: string;
  plan: string;
  call_balance: number;
  monthly_call_limit: number;
  created_at: string;
};

export default async function AgencyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select(
      "org_id, role, organizations(id, name, plan, is_agency, sub_account_limit, call_balance)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  if (!org) redirect("/dashboard");

  const isAgency = org.is_agency === true && org.plan === "agency";

  // Upgrade prompt for non-agency orgs
  if (!isAgency) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">Agency</h1>
        <div className="border border-border rounded-xl p-10 text-center max-w-lg">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agency Plan Required</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Upgrade to the Agency plan to create and manage client sub-accounts,
            set per-client call limits, and export usage reports for invoicing.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Agency Plan
          </Link>
        </div>
      </div>
    );
  }

  const orgId = org.id as string;
  const subAccountLimit = (org.sub_account_limit as number) ?? 10;

  // Fetch sub-accounts
  const { data: subAccounts } = await supabase
    .from("organizations")
    .select("id, name, plan, call_balance, monthly_call_limit, created_at")
    .eq("parent_org_id", orgId)
    .order("created_at", { ascending: false });

  const accounts = (subAccounts ?? []) as SubAccount[];

  const totalCallsUsedThisMonth = accounts.reduce(
    (sum, a) => sum + Math.max(0, a.monthly_call_limit - a.call_balance),
    0
  );
  const totalCallsRemaining = accounts.reduce((sum, a) => sum + a.call_balance, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Client Accounts</h1>
        <div className="flex items-center gap-3">
          <a
            href="/api/agency/usage?format=csv"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Usage CSV
          </a>
          {accounts.length < subAccountLimit && (
            <Link
              href="/dashboard/agency/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </Link>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Clients</span>
          </div>
          <p className="text-3xl font-bold">{accounts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            of {subAccountLimit} allowed
          </p>
        </div>
        <div className="border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Calls This Month</span>
          </div>
          <p className="text-3xl font-bold">{totalCallsUsedThisMonth.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">across all clients</p>
        </div>
        <div className="border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Calls Remaining</span>
          </div>
          <p className="text-3xl font-bold">{totalCallsRemaining.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">sum of all balances</p>
        </div>
      </div>

      {/* Sub-accounts table */}
      {accounts.length === 0 ? (
        <div className="border border-border rounded-xl p-10 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No client accounts yet. Add your first client to get started.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Calls Used</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Calls Remaining</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const callsUsed = Math.max(0, account.monthly_call_limit - account.call_balance);
                const usagePct =
                  account.monthly_call_limit > 0
                    ? Math.min(100, (callsUsed / account.monthly_call_limit) * 100)
                    : 0;
                const isLow = account.call_balance <= 10;
                return (
                  <tr key={account.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{account.name}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs bg-muted rounded-full px-2 py-0.5">
                        {account.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${usagePct}%` }}
                          />
                        </div>
                        <span>{callsUsed.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isLow ? "text-red-500" : ""}`}>
                      {account.call_balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                          isLow
                            ? "bg-red-500/10 text-red-500"
                            : "bg-green-500/10 text-green-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-red-500" : "bg-green-500"}`}
                        />
                        {isLow ? "Low Balance" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/agency/${account.id}`}
                          className="text-xs rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
