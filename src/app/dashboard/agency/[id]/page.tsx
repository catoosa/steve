import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SubAccountActions from "./sub-account-actions";

type SubAccount = {
  id: string;
  name: string;
  plan: string;
  call_balance: number;
  monthly_call_limit: number;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  calls_completed: number;
  calls_answered: number;
  total_contacts: number;
  created_at: string;
};

export default async function SubAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify user is agency owner
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, is_agency, plan)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;
  if (!org || org.is_agency !== true || org.plan !== "agency") {
    redirect("/dashboard/agency");
  }

  const agencyOrgId = org.id as string;

  // Fetch sub-account (must belong to this agency)
  const { data: subAccount } = await supabase
    .from("organizations")
    .select("id, name, plan, call_balance, monthly_call_limit, created_at")
    .eq("id", id)
    .eq("parent_org_id", agencyOrgId)
    .single();

  if (!subAccount) notFound();

  const account = subAccount as SubAccount;

  // Fetch this sub-account's campaigns (read-only view)
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, calls_completed, calls_answered, total_contacts, created_at")
    .eq("org_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const campaignList = (campaigns ?? []) as Campaign[];
  const callsUsed = Math.max(0, account.monthly_call_limit - account.call_balance);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/agency"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{account.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{account.plan} plan</p>
        </div>
      </div>

      {/* Usage summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Calls Used</p>
          <p className="text-2xl font-bold">{callsUsed.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Calls Remaining</p>
          <p className={`text-2xl font-bold ${account.call_balance <= 10 ? "text-red-500" : ""}`}>
            {account.call_balance.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Monthly Limit</p>
          <p className="text-2xl font-bold">{account.monthly_call_limit.toLocaleString()}</p>
        </div>
      </div>

      {/* Actions (client component) */}
      <SubAccountActions
        subAccountId={account.id}
        currentName={account.name}
        currentCallLimit={account.monthly_call_limit}
      />

      {/* Campaigns (read-only) */}
      <div className="mt-8">
        <h2 className="font-semibold mb-4">Campaigns</h2>
        {campaignList.length === 0 ? (
          <div className="border border-border rounded-xl p-8 text-center">
            <Building2 className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Contacts</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Completed</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Answered</th>
                </tr>
              </thead>
              <tbody>
                {campaignList.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs bg-muted rounded-full px-2 py-0.5">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{c.total_contacts.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{c.calls_completed.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{c.calls_answered.toLocaleString()}</td>
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
