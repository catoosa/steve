import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RateCardManager } from "./rate-card-manager";

export default async function RateCardPage() {
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

  const { data: items } = await supabase
    .from("rate_card_items")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Rate Card</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your standard pricing for quick quoting
          </p>
        </div>
      </div>
      <RateCardManager items={items ?? []} orgId={membership.org_id} />
    </div>
  );
}
