import Link from "next/link";
import {
  Bird,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Webhook,
  FileText,
  Clock,
} from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    calls: "50 calls/month",
    cta: "Get Started",
    href: "/signup",
    features: [
      "50 calls included",
      "1 campaign",
      "Transcripts & analysis",
      "Email support",
    ],
  },
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    calls: "500 calls/month",
    cta: "Start Free Trial",
    href: "/signup?plan=starter",
    popular: true,
    features: [
      "500 calls included",
      "Unlimited campaigns",
      "CSV contact upload",
      "Transcript export",
      "$0.50/call overage",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$199",
    period: "/month",
    calls: "5,000 calls/month",
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    features: [
      "5,000 calls included",
      "Unlimited campaigns",
      "Full API access",
      "Custom voice & prompts",
      "Webhook integrations",
      "$0.30/call overage",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    calls: "Unlimited calls",
    cta: "Contact Sales",
    href: "mailto:hello@skawk.io",
    features: [
      "Unlimited calls",
      "Custom pricing",
      "White-label option",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations",
    ],
  },
];

const USE_CASES = [
  {
    icon: BarChart3,
    title: "Market Research",
    description:
      "Run phone surveys at scale. Collect structured data from thousands of calls automatically.",
  },
  {
    icon: Clock,
    title: "Appointment Reminders",
    description:
      "Reduce no-shows with friendly automated reminder calls. Confirm, reschedule, or cancel.",
  },
  {
    icon: FileText,
    title: "Data Collection",
    description:
      "Stock checks, availability surveys, compliance calls. Get structured answers from every call.",
  },
  {
    icon: Webhook,
    title: "Claims Follow-up",
    description:
      "Insurance companies: automate claims status calls. Get updates without human agents.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Bird className="w-6 h-6 text-primary" />
            Skawk
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#use-cases"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Use Cases
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Voice Calls
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Phone calls on autopilot.
            <br />
            <span className="text-primary">From 50c each.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Skawk makes AI-powered phone calls for you — surveys, data
            collection, appointment reminders, and more. Upload contacts, write a
            prompt, get structured results. No call centre needed.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Free — 50 Calls Included
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#use-cases"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium hover:bg-muted"
            >
              See Use Cases
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Three steps. That&apos;s it.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload contacts",
                desc: "CSV upload or paste phone numbers. Add any metadata you need.",
              },
              {
                step: "2",
                title: "Write your prompt",
                desc: 'Tell Skawk what to say. "Ask about stock levels" or "Confirm their appointment at 2pm Tuesday."',
              },
              {
                step: "3",
                title: "Get structured results",
                desc: "Transcripts, AI-extracted data, and analytics — delivered via dashboard, API, or webhook.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <Zap className="w-8 h-8 text-primary" />
              <h3 className="text-lg font-semibold">Batch Calling</h3>
              <p className="text-muted-foreground">
                Send up to 1,000 calls per batch. Skawk handles the
                conversations in parallel.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h3 className="text-lg font-semibold">Structured Extraction</h3>
              <p className="text-muted-foreground">
                Define what data you want extracted. Get clean JSON from every
                call — not just raw transcripts.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h3 className="text-lg font-semibold">API & Webhooks</h3>
              <p className="text-muted-foreground">
                Integrate Skawk into your existing systems. RESTful API and
                real-time webhooks for call results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Built for every industry
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            If your business makes phone calls for data collection, reminders,
            or surveys — Skawk can do it for a fraction of the cost.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="flex gap-4 p-6 rounded-xl bg-background border border-border"
              >
                <uc.icon className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">{uc.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {uc.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Start free. Scale when you&apos;re ready.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-primary ring-2 ring-primary/20 relative"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-4 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.calls}
                </p>
                <ul className="flex flex-col gap-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`text-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to automate your phone calls?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Start with 50 free calls. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-primary px-6 py-3 text-base font-medium hover:bg-white/90"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <Bird className="w-5 h-5 text-primary" />
            Skawk
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Skawk. AI Voice Calling as a
            Service.
          </p>
        </div>
      </footer>
    </div>
  );
}
