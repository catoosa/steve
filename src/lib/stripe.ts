import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    calls: 50,
    perCallOverage: null, // no overage allowed
    features: ["50 calls/month", "1 campaign", "Email support"],
  },
  starter: {
    name: "Starter",
    price: 49,
    calls: 500,
    perCallOverage: 0.5,
    priceId: "", // set after creating Stripe products
    features: [
      "500 calls/month",
      "Unlimited campaigns",
      "CSV upload",
      "Transcript export",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 199,
    calls: 5000,
    perCallOverage: 0.3,
    priceId: "",
    features: [
      "5,000 calls/month",
      "Unlimited campaigns",
      "API access",
      "Custom voice & prompts",
      "Webhook integrations",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null, // custom
    calls: null,
    perCallOverage: null,
    priceId: "",
    features: [
      "Unlimited calls",
      "Custom pricing",
      "White-label option",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations",
    ],
  },
} as const;
