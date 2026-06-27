import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "./quote-builder";

export default async function NewQuotePage() {
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
  if (!membership) redirect("/login");

  const { data: rateCardItems } = await supabase
    .from("rate_card_items")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New Quote</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build a quote and send it to your customer
        </p>
      </div>
      <QuoteBuilder
        rateCardItems={rateCardItems ?? []}
        orgId={membership.org_id}
      />
    </div>
  );
}
