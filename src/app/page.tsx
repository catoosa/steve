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
  ChevronRight,
  Upload,
  Settings,
  Rocket,
  Play,
  Lock,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Human-Like Voice AI",
    desc: "Natural conversations powered by advanced AI that adapts tone, pace, and personality to every prospect.",
  },
  {
    icon: Zap,
    title: "Instant Scale",
    desc: "Go from 10 to 10,000 simultaneous calls. No hiring, no training, no overhead.",
  },
  {
    icon: Activity,
    title: "Real-Time Analytics",
    desc: "Live dashboards tracking call outcomes, sentiment analysis, and conversion metrics.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    desc: "Reach global markets with AI agents fluent in 20+ languages and regional accents.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "SOC 2 compliant, encrypted calls, and full audit trails for regulatory peace of mind.",
  },
  {
    icon: Webhook,
    title: "CRM Integration",
    desc: "Seamless sync with Salesforce, HubSpot, and 50+ tools. Your data, always connected.",
  },
  {
    icon: GitBranch,
    title: "Conversation Pathways",
    desc: "Visual flow builder for branching logic. Handle objections, collect data, route to humans.",
  },
  {
    icon: Bot,
    title: "Custom Personas",
    desc: "Create distinct AI personalities. Friendly Steve for surveys, sharp Alex for sales.",
  },
  {
    icon: Shield,
    title: "Guard Rails",
    desc: "Set boundaries on what your AI says. Automated compliance monitoring on every call.",
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: "Market Research",
    desc: "Run phone surveys at scale. 10,000 calls in an hour with structured data from every response.",
    stat: "10,000+",
    statLabel: "calls/hour",
  },
  {
    icon: Clock,
    title: "Appointment Reminders",
    desc: "Reduce no-shows by 65%. Confirm, reschedule, or cancel — handled automatically.",
    stat: "65%",
    statLabel: "fewer no-shows",
  },
  {
    icon: FileText,
    title: "Stock & Availability",
    desc: "Call suppliers, stores, or warehouses. Get structured stock data back in JSON.",
    stat: "$0.30",
    statLabel: "per call",
  },
  {
    icon: Headphones,
    title: "Customer Service",
    desc: "Handle inbound calls 24/7. Answer questions, route calls, resolve issues on autopilot.",
    stat: "24/7",
    statLabel: "availability",
  },
  {
    icon: Users,
    title: "Lead Qualification",
    desc: "Screen leads with qualifying questions. Only pass hot prospects to your sales team.",
    stat: "3x",
    statLabel: "qualified leads",
  },
  {
    icon: PhoneForwarded,
    title: "Claims Follow-up",
    desc: "Automate insurance claims calls. Collect updates without burning human agent hours.",
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
  "Custom API",
];

const PLANS = [
  {
    name: "Starter",
    price: "$149",
    period: "/month",
    desc: "For small teams getting started",
    calls: "300 calls included",
    cta: "Get Started",
    href: "/signup?plan=starter",
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
  {
    name: "Pro",
    price: "$499",
    period: "/month",
    desc: "For growing operations",
    calls: "1,500 calls included",
    cta: "Get Started",
    href: "/signup?plan=pro",
    popular: true,
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
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For serious scale",
    calls: "Unlimited calls",
    cta: "Talk to Sales",
    href: "mailto:hello@skawk.io",
    features: [
      "Unlimited calls",
      "Volume pricing from $0.30/call",
      "White-label option",
      "Dedicated infrastructure",
      "SSO / SAML",
      "SLA guarantee",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a2e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "Use Cases", "Pricing"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
            <Link href="/docs" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              API Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Log in
            </Link>
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
      <section className="relative overflow-hidden bg-[#1a1a2e]">
        {/* Animated background orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-secondary/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-sm font-medium text-white/70 mb-8">
              <Zap className="w-4 h-4 text-accent" />
              AI-Powered Outbound Calling
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
              Every call,
              <br />
              <span className="text-gradient">brilliantly handled.</span>
            </h1>

            <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              Skawk supercharges your outbound calling with voice AI that sounds human, converts leads, and scales effortlessly. No scripts. No limits.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-medium text-white hover:bg-white/5 transition-colors">
                <Play className="w-5 h-5 text-accent" />
                Watch Demo
              </button>
            </div>

            <p className="text-sm text-white/30">Plans from $149/month. Up and running in minutes.</p>
          </div>

          {/* Hero visual — floating call cards */}
          <div className="relative mt-20 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              {/* Stats bar */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { value: "1M+", label: "Calls Made" },
                  { value: "< 300ms", label: "Avg Latency" },
                  { value: "$0.30", label: "Per Call" },
                  { value: "99.9%", label: "Uptime SLA" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl sm:text-3xl font-black text-accent">{s.value}</p>
                    <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Mini call visualization */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { phone: "+61 412 ***", status: "Completed", dur: "0:42", color: "bg-success" },
                  { phone: "+61 498 ***", status: "In Progress", dur: "0:18", color: "bg-accent" },
                  { phone: "+61 411 ***", status: "Completed", dur: "1:03", color: "bg-success" },
                ].map((call, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-white/60">{call.phone}</span>
                      <span className={`w-2 h-2 rounded-full ${call.color}`} />
                    </div>
                    <p className="text-[10px] text-white/30">{call.status} &middot; {call.dur}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-4xl font-black mb-4">Built for bold teams</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to automate outbound calling and close more deals, faster.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-4xl font-black mb-4">Three steps to liftoff</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                icon: Upload,
                title: "Upload Your Contacts",
                desc: "Import lead lists from CSV, CRM, or connect via API. We handle deduplication and validation.",
                color: "bg-primary",
              },
              {
                num: "02",
                icon: Settings,
                title: "Configure Your Agent",
                desc: "Set the voice, script outline, goals, and objection handling. Your AI agent learns your playbook.",
                color: "bg-secondary",
              },
              {
                num: "03",
                icon: Rocket,
                title: "Launch & Convert",
                desc: "Hit go and watch calls happen in real time. Qualified leads get routed to your team instantly.",
                color: "bg-accent",
              },
            ].map((step) => (
              <div key={step.num} className="relative text-center">
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{step.num}</span>
                <h3 className="text-xl font-bold mt-2 mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API showcase */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary mb-4">
                <Code2 className="w-4 h-4" />
                Developer First
              </div>
              <h2 className="text-3xl font-black mb-4">One API call to make a phone call</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Simple REST API. Send a POST with a phone number and a prompt — Skawk handles the conversation, transcription, and data extraction.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Single or batch up to 10,000 calls",
                  "Custom voice, language, and persona",
                  "Structured JSON data extraction",
                  "Real-time webhooks on every event",
                  "Full transcripts and recordings",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/api"
                className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
              >
                View API Docs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-[#1a1a2e] rounded-2xl p-6 shadow-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-accent/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
                <span className="text-xs text-white/30 ml-2 font-mono">POST /api/v1/calls</span>
              </div>
              <pre className="text-[13px] font-mono text-white/70 overflow-x-auto leading-relaxed">{`curl -X POST https://skawk.io/api/v1/calls \\
  -H "x-api-key: sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "0412345678",
    "prompt": "Confirm dental appointment
      for tomorrow at 2pm. Handle
      rescheduling if needed.",
    "analysis_prompt": "Extract:
      {confirmed: bool, new_time: str}",
    "voice": "mason",
    "language": "en-AU"
  }'`}</pre>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/30 font-mono mb-2">// webhook response</p>
                <pre className="text-[13px] font-mono text-success/70 leading-relaxed">{`{
  "status": "completed",
  "duration_seconds": 34,
  "answered_by": "human",
  "analysis": {
    "confirmed": true,
    "new_time": null
  },
  "transcript": "Agent: Hi, this is..."
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-24 px-6 bg-[#1a1a2e] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-accent uppercase tracking-wider mb-3">Use Cases</p>
            <h2 className="text-4xl font-black mb-4">Works across every industry</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              If your business makes phone calls, Skawk can automate them — for a fraction of the cost.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <uc.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-accent">{uc.stat}</p>
                    <p className="text-[10px] text-white/40 font-medium">{uc.statLabel}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{uc.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Integrations</p>
          <h2 className="text-3xl font-black mb-4">Connects to everything</h2>
          <p className="text-muted-foreground mb-10">
            Push call results to your CRM, trigger workflows, or build custom integrations via API.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {INTEGRATIONS.map((name) => (
              <div
                key={name}
                className="px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium hover:border-primary/30 hover:shadow-sm transition-all cursor-default"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-4xl font-black mb-4">Transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Pay as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col bg-card ${
                  plan.popular
                    ? "border-primary ring-2 ring-primary/20 relative shadow-xl shadow-primary/10"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-black">{plan.price}</span>
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
                  className={`text-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-hover glow-orange"
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
      <section className="py-28 px-6 bg-[#1a1a2e] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Ready to make
            <br />
            <span className="text-gradient">some noise?</span>
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-lg mx-auto">
            Start automating your outbound calls and let AI handle the heavy lifting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="mailto:hello@skawk.io"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-medium text-white hover:bg-white/5 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <Image src="/skawk-logo.png" alt="Skawk" width={100} height={33} className="h-8 w-auto mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                AI-powered outbound calling that sounds human, scales instantly, and converts more leads.
              </p>
              <p className="text-sm text-muted-foreground mt-3">skawk.io</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Integrations", href: "#" },
                  { label: "API Docs", href: "/dashboard/api" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Company</h4>
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
              <h4 className="font-bold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy", "Terms", "Security", "GDPR"].map((item) => (
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
