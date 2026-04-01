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

// Pricing: call cost ~$0.20, minimum 50% margin = $0.30/call
export const PLANS = {
  starter: {
    name: "Starter",
    price: 149,
    calls: 300,
    perCallOverage: 0.55,
    priceId: "", // set after creating Stripe products
    features: [
      "300 calls/month",
      "3 personas",
      "CSV batch upload",
      "Conversation pathways",
      "Basic analytics",
      "Webhook integrations",
      "$0.55/extra call",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price: 499,
    calls: 1500,
    perCallOverage: 0.40,
    priceId: "",
    features: [
      "1,500 calls/month",
      "Unlimited personas",
      "Full API access",
      "Voice cloning",
      "Guard rails & compliance",
      "Inbound numbers",
      "Live call monitoring",
      "$0.40/extra call",
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
      "Custom per-call pricing",
      "White-label option",
      "Dedicated infrastructure",
      "SSO / SAML",
      "SLA guarantee",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
} as const;
