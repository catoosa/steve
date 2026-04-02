import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id, organizations(stripe_customer_id)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return Response.json({ error: "Organization not found" }, { status: 404 });
  }

  const org = membership.organizations as unknown as {
    stripe_customer_id: string | null;
  };

  if (!org.stripe_customer_id) {
    return Response.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/billing`,
  });

  return Response.json({ url: session.url });
}
