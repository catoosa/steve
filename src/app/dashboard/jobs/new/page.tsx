import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "./job-form";

export default async function NewJobPage() {
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

  // Fetch quotes and deals for optional linking
  const [quotesRes, dealsRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, customer_name, total_cents")
      .eq("org_id", membership.org_id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("deals")
      .select("id, title, contact_name")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New Job</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new job to track work for a customer.
        </p>
      </div>

      <JobForm
        orgId={membership.org_id}
        quotes={quotesRes.data ?? []}
        deals={dealsRes.data ?? []}
      />
    </div>
  );
}
