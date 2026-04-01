import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

const PLAN_CALLS: Record<string, number> = {
  starter: 500,
  pro: 5000,
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orgId = session.metadata?.org_id;
      const plan = session.metadata?.plan;

      if (orgId && plan) {
        await supabase
          .from("organizations")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            call_balance: PLAN_CALLS[plan] || 50,
            monthly_call_limit: PLAN_CALLS[plan] || 50,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "invoice.paid": {
      // Monthly renewal — reset call balance
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      const { data: org } = await supabase
        .from("organizations")
        .select("id, plan, monthly_call_limit")
        .eq("stripe_customer_id", customerId)
        .single();

      if (org) {
        await supabase
          .from("organizations")
          .update({ call_balance: org.monthly_call_limit })
          .eq("id", org.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = sub.customer as string;

      await supabase
        .from("organizations")
        .update({
          plan: "free",
          stripe_subscription_id: null,
          call_balance: 50,
          monthly_call_limit: 50,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return Response.json({ received: true });
}
