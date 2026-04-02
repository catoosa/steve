import { redirect } from "next/navigation";
import { CreditCard, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/stripe";
import {
  SuccessBanner,
  UpgradeButton,
  ManageSubscriptionButton,
} from "./billing-actions";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select(
      "org_id, organizations(id, name, plan, call_balance, monthly_call_limit, stripe_subscription_id)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;
  const currentPlan = (org?.plan as string) || "free";
  const hasSubscription = !!org?.stripe_subscription_id;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Billing</h1>

      <SuccessBanner />

      {/* Current plan */}
      <div className="bg-background border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Current Plan</h2>
            </div>
            <p className="text-2xl font-bold">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {org?.call_balance as number} / {org?.monthly_call_limit as number} calls
              remaining this period
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Usage bar */}
            <div className="w-48">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.min(100, ((1 - (org?.call_balance as number) / (org?.monthly_call_limit as number)) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {(org?.monthly_call_limit as number) - (org?.call_balance as number)} used
              </p>
            </div>
            {hasSubscription && <ManageSubscriptionButton />}
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="font-semibold text-lg mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(PLANS).map(([key, plan]) => (
          <div
            key={key}
            className={`border rounded-xl p-5 ${
              key === currentPlan
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            }`}
          >
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="text-2xl font-bold mt-2">
              {plan.price !== null ? (plan.price === 0 ? "Free" : `$${plan.price}`) : "Custom"}
              {plan.price !== null && plan.price > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.calls !== null ? `${plan.calls.toLocaleString()} calls` : "Unlimited calls"}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {key === currentPlan ? (
                <span className="block text-center text-sm text-muted-foreground py-2">
                  Current plan
                </span>
              ) : (
                <UpgradeButton plan={key} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
