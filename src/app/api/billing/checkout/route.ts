import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan: string };

  if (plan !== "starter" && plan !== "pro") {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    return Response.json(
      { error: "Price not configured for this plan" },
      { status: 400 }
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select(
      "org_id, organizations(id, name, stripe_customer_id)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return Response.json({ error: "Organization not found" }, { status: 404 });
  }

  const org = membership.organizations as unknown as {
    id: string;
    name: string;
    stripe_customer_id: string | null;
  };
  const orgId = membership.org_id as string;

  const stripe = getStripe();
  let customerId = org.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { org_id: orgId, user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", orgId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${APP_URL}/dashboard/billing`,
    customer: customerId,
    metadata: { org_id: orgId, plan },
  });

  return Response.json({ url: session.url });
}
