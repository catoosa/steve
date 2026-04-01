import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Phone,
  PhoneCall,
  PhoneForwarded,
  MessageSquare,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Code2,
  Webhook,
  FileText,
  Clock,
  Users,
  Building2,
  Headphones,
  Bot,
  Mic,
  GitBranch,
  Activity,
  Settings,
  ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Outbound Calls",
    desc: "Launch thousands of AI-powered calls simultaneously. Surveys, reminders, data collection — all automated.",
  },
  {
    icon: PhoneForwarded,
    title: "Inbound Handling",
    desc: "Give your customers an AI receptionist. Route calls, answer FAQs, book appointments 24/7.",
  },
  {
    icon: MessageSquare,
    title: "SMS & Chat",
    desc: "Same AI agent, multiple channels. Text message campaigns and web chat — unified in one platform.",
  },
  {
    icon: GitBranch,
    title: "Conversation Pathways",
    desc: "Visual flow builder for complex call logic. Branch on responses, collect data, transfer to humans.",
  },
  {
    icon: Bot,
    title: "Custom Personas",
    desc: "Create distinct AI personalities for different use cases. Friendly Steve for surveys, professional Alex for sales.",
  },
  {
    icon: Mic,
    title: "Voice Cloning",
    desc: "Clone any voice or choose from our library. Your AI agent sounds exactly how you want.",
  },
  {
    icon: Webhook,
    title: "Webhooks & API",
    desc: "Real-time webhooks on every call event. RESTful API for full programmatic control.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "Monitor calls in real-time. Transcripts, structured extraction, sentiment analysis, and success rates.",
  },
  {
    icon: Shield,
    title: "Guard Rails",
    desc: "Automated compliance monitoring. Set boundaries on what your AI can and can't say.",
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: "Market Research",
    desc: "Run phone surveys at scale. 10,000 calls in an hour with structured data extraction from every response.",
    stat: "10,000+",
    statLabel: "calls/hour",
  },
  {
    icon: Clock,
    title: "Appointment Reminders",
    desc: "Reduce no-shows by 65%. Friendly reminders with confirm, reschedule, or cancel options.",
    stat: "65%",
    statLabel: "fewer no-shows",
  },
  {
    icon: FileText,
    title: "Stock & Availability Checks",
    desc: "Call suppliers, stores, or warehouses. Get real-time stock data in structured JSON.",
    stat: "$0.09",
    statLabel: "per call",
  },
  {
    icon: Headphones,
    title: "Customer Service",
    desc: "Handle inbound calls 24/7. Answer questions, route to departments, resolve issues automatically.",
    stat: "24/7",
    statLabel: "availability",
  },
  {
    icon: Users,
    title: "Lead Qualification",
    desc: "Screen inbound leads with qualifying questions. Only pass hot leads to your sales team.",
    stat: "3x",
    statLabel: "more qualified leads",
  },
  {
    icon: Globe,
    title: "Claims Follow-up",
    desc: "Insurance companies: automate claims status calls. Collect updates without burning agent hours.",
    stat: "80%",
    statLabel: "cost reduction",
  },
];

const INTEGRATIONS = [
  "Salesforce",
  "HubSpot",
  "Twilio",
  "Zapier",
  "Calendly",
  "Slack",
  "Google Sheets",
  "Webhooks",
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Try it out",
    calls: "50 calls included",
    cta: "Get Started Free",
    href: "/signup",
    features: [
      "50 calls/month",
      "1 persona",
      "Basic analytics",
      "Transcripts",
      "Community support",
    ],
  },
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    desc: "For growing teams",
    calls: "500 calls included",
    cta: "Start Free Trial",
    href: "/signup?plan=starter",
    popular: true,
    features: [
      "500 calls/month",
      "Unlimited personas",
      "CSV batch upload",
      "Conversation pathways",
      "Transcript export",
      "Webhook integrations",
      "$0.50/extra call",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$199",
    period: "/month",
    desc: "For serious operations",
    calls: "5,000 calls included",
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    features: [
      "5,000 calls/month",
      "Everything in Starter",
      "Full API access",
      "Voice cloning",
      "Guard rails",
      "Live call monitoring",
      "Custom analysis prompts",
      "Inbound numbers",
      "$0.30/extra call",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For scale",
    calls: "Unlimited calls",
    cta: "Talk to Us",
    href: "mailto:hello@skawk.io",
    features: [
      "Unlimited calls",
      "Custom pricing",
      "White-label option",
      "Dedicated infrastructure",
      "SSO / SAML",
      "SLA guarantee",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create a Persona",
    desc: "Tell Skawk who your AI agent is. Name, voice, personality, and what they need to accomplish.",
    color: "bg-primary",
  },
  {
    num: "02",
    title: "Design the Flow",
    desc: "Use our visual pathway builder or just write a prompt. Define questions, branches, and data extraction.",
    color: "bg-secondary",
  },
  {
    num: "03",
    title: "Upload Contacts",
    desc: "Paste numbers, upload a CSV, or send calls programmatically via API. Batch up to 10,000 at once.",
    color: "bg-accent",
  },
  {
    num: "04",
    title: "Launch & Monitor",
    desc: "Hit go. Watch calls in real-time. Get structured data, transcripts, and analytics as results flow in.",
    color: "bg-success",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/skawk-logo.png"
              alt="Skawk"
              width={120}
              height={40}
              className="h-9 w-auto"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors glow-orange"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium mb-8 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-accent" />
              AI Voice Agents — Build, Deploy, Scale
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Your AI makes the calls.
              <br />
              <span className="text-gradient">You get the data.</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Build voice AI agents that make and receive phone calls. Surveys, appointments, lead qualification, customer service — all on autopilot. From 9 cents per call.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-8 py-4 text-base font-medium text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                <Phone className="w-5 h-5" />
                Try a Demo Call
              </Link>
            </div>

            {/* Stats bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: "1M+", label: "Calls Made" },
                { value: "< 1s", label: "Latency" },
                { value: "$0.09", label: "Per Call" },
                { value: "99.9%", label: "Uptime" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-bold text-accent">{s.value}</p>
                  <p className="text-sm text-white/50 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo section */}
      <section id="demo" className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Try it right now</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Enter your phone number and pick a scenario. Our AI agent will call you in seconds.
          </p>
          <div className="bg-card border border-border rounded-2xl p-8 max-w-lg mx-auto shadow-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-left">Your Phone Number</label>
                <input
                  type="tel"
                  placeholder="0412 345 678"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-left">Demo Scenario</label>
                <select className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option>Appointment reminder</option>
                  <option>Customer survey</option>
                  <option>Lead qualification</option>
                  <option>Stock availability check</option>
                </select>
              </div>
              <button className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all glow-orange">
                <span className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call Me Now
                </span>
              </button>
              <p className="text-xs text-muted-foreground">Australian numbers only during beta. No credit card required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Live in minutes, not months</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Four steps from zero to thousands of automated calls.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="relative">
                <div className={`${step.color} w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4`}>
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to automate calls</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Build, deploy, monitor, and refine — the complete voice AI platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                <f.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API showcase */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                <Code2 className="w-4 h-4" />
                Developer Friendly
              </div>
              <h2 className="text-3xl font-bold mb-4">One API call to make a phone call</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Simple REST API. Send a POST with a phone number and a prompt — Skawk handles the rest. Get structured data back via webhook.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Single call or batch up to 10,000",
                  "Custom voice, language, and persona",
                  "Structured data extraction (JSON)",
                  "Real-time webhooks on every event",
                  "Recordings and full transcripts",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/api"
                className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
              >
                View API Docs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-[#1e1e2e] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-accent" />
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-white/40 ml-2 font-mono">POST /api/v1/calls</span>
              </div>
              <pre className="text-sm font-mono text-white/80 overflow-x-auto leading-relaxed">{`curl -X POST https://skawk.io/api/v1/calls \\
  -H "x-api-key: sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "0412345678",
    "prompt": "You are a friendly agent
      confirming a dental appointment
      for tomorrow at 2pm.",
    "analysis_prompt": "Extract JSON:
      {confirmed: bool, reschedule: str}",
    "voice": "mason",
    "language": "en-AU"
  }'`}</pre>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 font-mono mb-2">// Webhook response</p>
                <pre className="text-sm font-mono text-success/80 leading-relaxed">{`{
  "status": "completed",
  "analysis": {
    "confirmed": true,
    "reschedule": null
  },
  "duration_seconds": 34,
  "transcript": "Agent: Hi, this is..."
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-24 px-6 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for every industry</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              If your business makes or receives phone calls, Skawk can automate them.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <uc.icon className="w-8 h-8 text-primary" />
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{uc.stat}</p>
                    <p className="text-xs text-muted-foreground">{uc.statLabel}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Connects to everything</h2>
          <p className="text-muted-foreground mb-12">
            Push call results to your CRM, trigger workflows, or build custom integrations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {INTEGRATIONS.map((name) => (
              <div
                key={name}
                className="px-6 py-3 rounded-xl bg-card border border-border text-sm font-medium hover:border-primary/50 transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Transparent pricing</h2>
            <p className="text-muted-foreground">
              Start free. Pay as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col bg-card ${
                  plan.popular
                    ? "border-primary ring-2 ring-primary/20 relative shadow-lg"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.calls}</p>
                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`text-center rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary-hover glow-orange"
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
      <section className="py-24 px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Stop paying humans to make phone calls
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            50 free calls. No credit card. Live in under 5 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
          >
            Start Building Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Image
                src="/skawk-logo.png"
                alt="Skawk"
                width={100}
                height={33}
                className="h-8 w-auto mb-4"
              />
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI voice agents that make and receive phone calls. Built in Australia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5">
                {["Features", "Pricing", "Use Cases", "API Docs", "Changelog"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Security"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Skawk Pty Ltd. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              hello@skawk.io
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
