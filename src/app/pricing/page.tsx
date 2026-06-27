import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Star } from "lucide-react";
import { PLANS } from "@/lib/stripe";
import { RoiCalculator } from "./roi-calculator";

export const metadata = {
  title: "Pricing | Skawk",
  description:
    "Transparent pricing for AI voice calling. Start free with 50 calls, scale to enterprise. See plans, features, and ROI calculator.",
};

const PLAN_ORDER = ["free", "starter", "pro", "agency", "enterprise"] as const;

const PLAN_BADGES: Record<string, string | null> = {
  free: null,
  starter: null,
  pro: "Most Popular",
  agency: null,
  enterprise: null,
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "Try the platform with no commitment.",
  starter: "For growing teams running regular campaigns.",
  pro: "Full power for serious outbound and inbound ops.",
  agency: "Manage multiple clients from one account.",
  enterprise: "Custom everything. Dedicated infrastructure.",
};

export default function PricingPage() {
  const planSummaries = PLAN_ORDER.map((key) => ({
    key,
    name: PLANS[key].name,
    price: PLANS[key].price,
    calls: PLANS[key].calls,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a2e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm font-medium text-white/60 hover:text-white transition-colors">API Docs</Link>
            <Link href="/demo" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Demo</Link>
            <Link href="/help" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Help</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Log in</Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-all glow-orange"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1a1a2e] py-20 px-6">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Pricing</p>
          <h1 className="text-5xl font-black text-white mb-4">
            Transparent pricing for teams of every size
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-6">
            Start free with 50 calls. Scale up as you grow. No hidden fees, no surprises.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/40">
            <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
              <Check className="w-3.5 h-3.5 text-green-400" /> No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
              <Check className="w-3.5 h-3.5 text-green-400" /> 50 free calls to start
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
              <Check className="w-3.5 h-3.5 text-green-400" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-5">
            {PLAN_ORDER.map((key) => {
              const plan = PLANS[key];
              const badge = PLAN_BADGES[key];
              const desc = PLAN_DESCRIPTIONS[key];
              const isPopular = badge === "Most Popular";

              return (
                <div
                  key={key}
                  className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
                    isPopular
                      ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  {badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                        <Star className="w-3 h-3" /> {badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{desc}</p>

                  <div className="mb-4">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl font-black">${plan.price}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </>
                    ) : (
                      <span className="text-2xl font-black">Custom</span>
                    )}
                  </div>

                  {plan.calls !== null && plan.calls > 0 && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.calls.toLocaleString()} calls/month
                    </p>
                  )}
                  {plan.calls === 0 && key === "agency" && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Client-managed allocations
                    </p>
                  )}

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={
                      plan.price === null
                        ? "mailto:hello@skawk.io?subject=Enterprise%20inquiry"
                        : `/signup?plan=${key}`
                    }
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                      isPopular
                        ? "bg-primary text-white hover:bg-primary-hover glow-orange"
                        : plan.price === null
                        ? "border border-border text-foreground hover:bg-muted"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {plan.price === null ? "Talk to Sales" : plan.price === 0 ? "Start Free" : "Get Started"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Overage note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Need more calls? Starter overages at $0.55/call, Pro at $0.40/call. Enterprise gets custom per-call pricing.
          </p>
        </div>
      </section>

      {/* ROI Calculator */}
      <RoiCalculator plans={planSummaries} />

      {/* FAQ mini */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-4">Pricing FAQ</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Is there a free trial?",
                a: "Yes. Every account starts with 50 free calls. No credit card required. Full platform access.",
              },
              {
                q: "What happens if I exceed my call limit?",
                a: "On Starter and Pro plans, additional calls are billed at the per-call overage rate shown above. You will never be cut off mid-campaign.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes. Upgrade or downgrade anytime from your dashboard. Changes take effect on your next billing cycle.",
              },
              {
                q: "Is there a contract?",
                a: "No contracts. All plans are month-to-month. Cancel anytime from the billing dashboard.",
              },
              {
                q: "Do you offer annual pricing?",
                a: "Yes. Contact us for annual pricing with a discount. Enterprise plans are typically annual.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="bg-card border border-border rounded-2xl px-6 py-4 group"
              >
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-muted-foreground text-xl group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#1a1a2e] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-black mb-4">Start with 50 free calls</h2>
          <p className="text-white/50 mb-8">No credit card. Full platform access. See for yourself.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 CareplanAI Pty Ltd | ABN 92 691 158 237
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:hello@skawk.io" className="hover:text-foreground transition-colors">hello@skawk.io</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
