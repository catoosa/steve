import Link from "next/link";
import Image from "next/image";
import { MiracleSimulations } from "./miracle-simulations";
import { FeaturesTabs } from "@/components/features-tabs";
import { FaqSection } from "@/components/faq-section";
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
  Lock,
  Brain,
  FlaskConical,
  Tag,
  PhoneIncoming,
  Fingerprint,
  LayoutTemplate,
  Briefcase,
  Heart,
  Home,
  Radio,
  DollarSign,
  ListOrdered,
  AlertTriangle,
  PhoneOff,
} from "lucide-react";

export const metadata = {
  title: "AI Voice Agents That Return JSON, Not Just Transcripts",
  description:
    "One API call. One phone call. Structured data back. Agentic voice orchestration for developers. AI voice agents that follow conversational pathways, extract structured JSON, and trigger actions mid-call. 10 to 10,000 simultaneous calls.",
  alternates: {
    canonical: "https://skawk.io",
  },
};

const FEATURES = [
  // Campaign Intelligence
  {
    icon: FlaskConical,
    title: "A/B Testing",
    desc: "Split contacts 50/50 across prompt variants. Compare answer rates, call duration, and dispositions. Let data pick the winning script.",
    hover: "Create two or more prompt variants when building a campaign. Skawk randomly assigns contacts and tracks metrics per variant so you can compare side by side.",
    category: "Campaign Intelligence",
  },
  {
    icon: Activity,
    title: "Emotion Analysis",
    desc: "AI detects caller sentiment (happy, neutral, angry, sad) on every call. Spot friction before it becomes churn.",
    hover: "Sentiment is scored from the transcript after each call. Filter your campaign results by emotion to find the calls that need human follow-up.",
    category: "Campaign Intelligence",
  },
  {
    icon: Tag,
    title: "Disposition Tracking",
    desc: "Every call tagged automatically: INTERESTED, NOT_INTERESTED, FOLLOW_UP, or DO_NOT_CALL. Route and action contacts instantly.",
    hover: "The AI reads the conversation and assigns a disposition tag. Use these tags to trigger workflows, build segments, or export qualified leads.",
    category: "Campaign Intelligence",
  },
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    desc: "Answer rates, duration stats, and disposition breakdowns in one view. Export to CSV or PDF with one click.",
    hover: "Every campaign gets a live dashboard with answer rate, avg duration, disposition breakdown, and sentiment distribution. Export any view instantly.",
    category: "Campaign Intelligence",
  },
  // AI Agents
  {
    icon: Bot,
    title: "Custom Personas",
    desc: "Named AI agents with custom voice, language, and personality. Build a stable of characters tailored to each campaign.",
    hover: "Create a persona with a name, voice, language, and system prompt. Assign it to any campaign. Swap personas without rebuilding the campaign.",
    category: "AI Agents",
  },
  {
    icon: Mic,
    title: "Voice Cloning",
    desc: "Clone any voice from a short audio clip. Deploy your brand voice, or a client's, across every call.",
    hover: "Upload a 30-second audio clip in the dashboard. Skawk generates a voice model you can assign to any persona and use across all campaigns.",
    category: "AI Agents",
  },
  {
    icon: FileText,
    title: "Knowledge Bases",
    desc: "Upload docs, FAQs, or URLs your agent references in real time. AI answers caller questions from your own content.",
    hover: "Upload text files, PDFs, or paste URLs. The agent retrieves relevant chunks during the call using RAG so answers stay grounded in your content.",
    category: "AI Agents",
  },
  {
    icon: Webhook,
    title: "Custom Tools",
    desc: "Agent calls your APIs mid-conversation: check inventory, book appointments, look up CRM data without breaking the flow.",
    hover: "Define a tool with a name, description, and endpoint URL. The agent decides when to call it based on the conversation and passes structured params.",
    category: "AI Agents",
  },
  {
    icon: Brain,
    title: "Persistent Memory",
    desc: "Agents remember prior interactions with each contact. Every follow-up call starts with context. No repeating yourself.",
    hover: "After each call, key facts are saved to the contact record. On the next call, the agent loads that context automatically so it picks up where it left off.",
    category: "AI Agents",
  },
  {
    icon: GitBranch,
    title: "Visual Pathway Builder",
    desc: "Drag-and-drop conversation flows with branching logic, conditions, transfers, and live test chat. No code required.",
    hover: "Build conversation trees visually. Add nodes for questions, conditions, transfers, and tool calls. Test the full flow in a live chat simulator before launching.",
    category: "AI Agents",
  },
  // Outreach Channels
  {
    icon: PhoneCall,
    title: "Outbound Voice Campaigns",
    desc: "Bulk AI calling with contact upload via CSV or API. Go from 10 to 10,000 simultaneous calls with no added headcount.",
    hover: "Upload a CSV or push contacts via API. Set your persona, schedule, and compliance rules. Hit launch and Skawk dials every contact in parallel.",
    category: "Channels",
  },
  {
    icon: PhoneIncoming,
    title: "Inbound Numbers",
    desc: "Purchase numbers directly from the dashboard. Configure your AI agent to answer inbound calls 24/7 with pre-built persona templates for common roles.",
    hover: "Buy a local or toll-free number in the dashboard. Pick a role template (Receptionist, Support Agent, Scheduler) or write a custom prompt. The agent picks up every inbound call.",
    category: "Channels",
  },
  {
    icon: MessageSquare,
    title: "SMS Campaigns",
    desc: "AI text message sequences that run alongside voice campaigns. Same contacts, same analytics, full omnichannel reach.",
    hover: "Add SMS steps to any campaign. The AI generates personalised messages per contact and tracks delivery, replies, and opt-outs in the same dashboard.",
    category: "Channels",
  },
  // Compliance & Safety
  {
    icon: Shield,
    title: "Guard Rails",
    desc: "TCPA, Australian Spam Act, and GDPR presets as one-click toggles. Custom rules available for any jurisdiction.",
    hover: "Toggle a compliance preset and Skawk enforces calling windows, consent checks, recording notices, and opt-out handling automatically on every call.",
    category: "Compliance",
  },
  {
    icon: Fingerprint,
    title: "AI Disclosure",
    desc: "Automatic caller identification and opt-out handling on every call. Compliant by default, not an afterthought.",
    hover: "The agent identifies itself, states the company name, and offers an opt-out at the start of every call. All configurable per campaign.",
    category: "Compliance",
  },
  // Platform
  {
    icon: Users,
    title: "Client Portal",
    desc: "Branded read-only dashboards for end clients. They see results, transcripts, and analytics. No platform access required.",
    hover: "Generate a share link or invite a client by email. They get a branded view of their campaign results — no login to your main dashboard needed.",
    category: "Platform",
  },
  {
    icon: Code2,
    title: "Full API Access",
    desc: "Complete REST API. Trigger calls, pull analytics, manage campaigns from any system.",
    hover: "Generate an API key in settings. Use it to trigger single or batch calls, pull transcripts, manage contacts, and read analytics programmatically.",
    category: "Platform",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    desc: "Agents fluent in 40+ languages. Auto-detect and switch mid-call for global campaigns or multilingual markets.",
    hover: "Set a language per persona or enable auto-detect. The agent identifies the caller's language and switches seamlessly without restarting the call.",
    category: "Platform",
  },
  {
    icon: LayoutTemplate,
    title: "Campaign Templates",
    desc: "12+ industry templates covering healthcare, real estate, recruitment, property management, and more. Launch in minutes.",
    hover: "Pick a template, customise the prompt and persona, upload your contacts, and launch. Templates include pre-built pathways and compliance settings.",
    category: "Platform",
  },
  // Automation & Intelligence
  {
    icon: Zap,
    title: "Workflow Automation",
    desc: "When a call ends, workflows evaluate the results and chain actions: send SMS, schedule callbacks, create escalations, hit webhooks — automatically.",
    hover: "Build if/then rules on call outcomes. Example: if disposition is INTERESTED, send an SMS and notify your sales channel via webhook — all hands-free.",
    category: "Automation",
  },
  {
    icon: ListOrdered,
    title: "Multi-Touch Sequences",
    desc: "Day 1 call, Day 3 SMS, Day 7 follow-up. Define multi-step journeys that run themselves. Contacts progress automatically.",
    hover: "Define steps with delays and channel (call or SMS). Contacts move through the sequence automatically. Stop conditions prevent over-contacting.",
    category: "Automation",
  },
  {
    icon: AlertTriangle,
    title: "Escalation System",
    desc: "Critical outcomes flag instantly. Priority routing (critical, high, medium, low) with acknowledge and resolve tracking for your team.",
    hover: "Define escalation rules on dispositions or keywords. Flagged calls appear in a priority queue. Team members acknowledge and resolve with audit trail.",
    category: "Automation",
  },
  {
    icon: Radio,
    title: "Live Call Monitor",
    desc: "Watch calls happen in real time. Active call cards, live duration tickers, sentiment indicators, and a completions feed — like air traffic control.",
    hover: "Open the monitor during a campaign. See every active call with live duration, sentiment colour, and status. Completed calls stream into a live feed below.",
    category: "Automation",
  },
  {
    icon: Brain,
    title: "Conversation Intelligence",
    desc: "AI reads every transcript and reports: top objections, winning phrases, contact archetypes, and recommendations to improve your script.",
    hover: "After a campaign completes, Skawk analyses all transcripts and generates a report: common objections, effective phrases, and suggested prompt tweaks.",
    category: "Automation",
  },
  {
    icon: DollarSign,
    title: "ROI Dashboard",
    desc: "See cost per call, cost per lead, human-equivalent savings, and ROI by campaign. Make the business case undeniable.",
    hover: "Enter your average human call cost. Skawk calculates cost per call, cost per qualified lead, and total savings compared to a human team.",
    category: "Automation",
  },
  // Differentiation
  {
    icon: FlaskConical,
    title: "Call Playground",
    desc: "Test your prompts without making real calls. AI simulates both sides of the conversation. Free. Unlimited. Iterate until it's perfect.",
    hover: "Write a prompt, pick a persona, and hit Test. The AI plays both sides of the call so you can hear exactly how it sounds before spending a cent.",
    category: "Platform",
  },
  {
    icon: Clock,
    title: "Smart Scheduling",
    desc: "Heatmap shows answer rates by day and time. Skawk recommends the best windows so you call when people actually pick up.",
    hover: "Skawk analyses your past campaign data to build a per-contact heatmap. Schedule campaigns for the recommended window or let auto-schedule pick the slot.",
    category: "Automation",
  },
  {
    icon: PhoneOff,
    title: "Phone Validation",
    desc: "Check every number before you call. Format validation, mobile vs landline detection. Stop wasting calls on dead numbers.",
    hover: "Numbers are checked on upload. Invalid, disconnected, and landline-only numbers get flagged so your campaign only dials real, reachable mobiles.",
    category: "Compliance",
  },
];

const USE_CASES = [
  {
    icon: Heart,
    title: "Aged Care Outreach",
    desc: "Compassionate, compliant outreach for residents and families. Memory ensures every follow-up call feels personal.",
    stat: "24/7",
    statLabel: "availability",
  },
  {
    icon: PhoneForwarded,
    title: "Patient Follow-up",
    desc: "Post-discharge and appointment follow-up calls with structured responses, disposition tracking, and escalation to clinical staff when it matters.",
    stat: "80%",
    statLabel: "admin time saved",
  },
  {
    icon: Briefcase,
    title: "Recruitment Screening",
    desc: "Screen hundreds of applicants in parallel. Extract structured responses, score candidates, and surface the best to your team.",
    stat: "10x",
    statLabel: "faster screening",
  },
  {
    icon: Building2,
    title: "Insurance Claims",
    desc: "Automate first-notice-of-loss calls and policy renewal outreach. Disposition tracking flags urgent cases for human follow-up.",
    stat: "65%",
    statLabel: "handling cost saved",
  },
  {
    icon: Home,
    title: "Property Management",
    desc: "Maintenance reminders, rent arrears calls, and inspection confirmations. Fully automated, fully compliant.",
    stat: "2x",
    statLabel: "contact rate",
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


const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://skawk.io/#organization",
      name: "Skawk",
      url: "https://skawk.io",
      logo: {
        "@type": "ImageObject",
        url: "https://skawk.io/skawk-logo.png",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@skawk.io",
        contactType: "customer support",
      },
      legalName: "Skawk",
    },
    {
      "@type": "WebSite",
      "@id": "https://skawk.io/#website",
      url: "https://skawk.io",
      name: "Skawk",
      description:
        "AI-powered voice calling platform for outbound campaign automation",
      publisher: { "@id": "https://skawk.io/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Skawk",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://skawk.io",
      description:
        "Automate outbound and inbound phone calls with AI voice agents. Run lead qualification, appointment reminders, surveys, and follow-up campaigns at scale.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "AUD",
        description: "Contact us to discuss your requirements",
      },
      featureList: [
        "AI voice agents",
        "Outbound call campaigns",
        "Inbound call handling",
        "SMS campaigns",
        "Visual pathway builder",
        "Knowledge bases (RAG)",
        "A/B testing",
        "Emotion analysis",
        "Disposition tracking",
        "Persistent memory across calls",
        "Custom AI personas",
        "Voice cloning",
        "Custom mid-call API tools",
        "TCPA and AU Spam Act guard rails",
        "AI disclosure and opt-out handling",
        "Client portal (branded read-only)",
        "Full REST API access",
        "Real-time webhook pipeline",
        "Campaign analytics with CSV/PDF export",
        "12+ industry campaign templates",
        "40+ language support",
        "10,000 simultaneous calls",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I get started with Skawk?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sign up for a free account with 50 calls included. No credit card required. Launch your first campaign in minutes using one of our 12+ templates, or connect via API.",
          },
        },
        {
          "@type": "Question",
          name: "How many calls can Skawk make at once?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Skawk can run up to 10,000 simultaneous calls. Batch campaigns can be launched with a single API call or via the dashboard.",
          },
        },
        {
          "@type": "Question",
          name: "What languages does Skawk support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Skawk supports 40+ languages including English (AU, US, UK), Spanish, French, German, Japanese, Chinese, Korean, and more. Babel mode auto-detects and switches mid-call.",
          },
        },
        {
          "@type": "Question",
          name: "Is Skawk TCPA and Spam Act compliant?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Built-in compliance presets cover Australian Spam Act, US TCPA, and EU GDPR. One click applies AI disclosure, opt-out handling, and recording consent rules to every call.",
          },
        },
        {
          "@type": "Question",
          name: "Can Skawk handle both inbound and outbound calls?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Outbound campaigns call thousands of contacts in parallel. Inbound numbers let you purchase a phone number and configure an AI agent to answer calls 24/7 with pre-built persona templates.",
          },
        },
        {
          "@type": "Question",
          name: "How much does Skawk cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Free plan: 50 calls, no cost. Starter: $149/mo for 300 calls. Pro: $499/mo for 1,500 calls. Agency: $599/mo for multi-client management. Enterprise: custom pricing.",
          },
        },
        {
          "@type": "Question",
          name: "How does the API work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Simple REST API. Send a POST to /api/v1/calls with a phone number, prompt, and optional analysis schema. Skawk handles the call, transcription, and data extraction. Results come back via webhook.",
          },
        },
        {
          "@type": "Question",
          name: "How does voice cloning work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Upload a short audio clip and Skawk generates a cloned voice model you can assign to any persona. No studio time or specialist software required.",
          },
        },
        {
          "@type": "Question",
          name: "Is white-labelling available?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Enterprise plans include a white-label option with a custom domain, branded client portal, and your own logo throughout the platform.",
          },
        },
        {
          "@type": "Question",
          name: "Can Skawk integrate with my existing CRM?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We integrate with Salesforce, HubSpot, GoHighLevel, and any system via webhooks, Zapier, or our REST API. Call results can be pushed to your CRM automatically.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a2e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "Use Cases", "Contact"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
            <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              API Docs
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/demo" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Demo
            </Link>
            <Link href="/help" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Help
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
              Voice · SMS · A/B Testing · Compliance · AI Personas, all in one platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
              One API call.
              <br />
              <span className="text-gradient">One phone call.</span>
              <br />
              Structured data back.
            </h1>

            <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              Agentic voice orchestration for developers. AI voice agents that follow conversational pathways, extract structured JSON, and trigger actions mid-call. 10 to 10,000 simultaneous calls.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="tel:+61411199904"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-medium text-white hover:bg-white/5 transition-colors"
              >
                <Phone className="w-5 h-5 text-green-400" />
                Call our AI: 0411 199 904
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/40">
              <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                <Check className="w-3.5 h-3.5 text-green-400" /> No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                <Check className="w-3.5 h-3.5 text-green-400" /> 50 free calls
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                <Check className="w-3.5 h-3.5 text-green-400" /> Up and running in minutes
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                <Shield className="w-3.5 h-3.5 text-green-400" /> TCPA &amp; Spam Act compliant
              </span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {[
                { value: "< 300ms", label: "Avg Latency" },
                { value: "10K+", label: "Simultaneous Calls" },
                { value: "40+", label: "Languages" },
                { value: "99.9%", label: "Uptime SLA" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-black text-accent">{s.value}</p>
                  <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mini call visualization */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-3">Live calls</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              Every tool you need to automate calling, run compliant campaigns, and convert more, without adding headcount.
            </p>
          </div>
          <FeaturesTabs features={FEATURES} />
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
                desc: "Pick a template or build your own. Set voice, persona, pathways, knowledge base, and compliance rules. Done in minutes.",
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

      {/* Miracle simulations — live monitor, intelligence, ROI */}
      <MiracleSimulations />

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
                Simple REST API. Send a POST with a phone number and a prompt. Skawk handles the conversation, transcription, and data extraction. All contacts must be opted-in before calling.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Single or batch up to 10,000 calls",
                  "Built-in consent & Do Not Call verification",
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
              If your business makes phone calls, Skawk can automate them for a fraction of the cost.
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
      <section id="integrations" className="py-20 px-6 bg-muted">
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

      {/* Case Study — Fuel Map */}
      <section className="py-24 px-6 bg-primary text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-bold uppercase tracking-wider mb-3 text-white/70">Built with Skawk</p>
            <h2 className="text-4xl font-black mb-6">7,000 fuel stations. Every day. Zero humans.</h2>
          </div>
          <p className="text-lg text-white/80 leading-relaxed text-center max-w-3xl mx-auto mb-8">
            An AI voice agent calls thousands of fuel stations across Australia to check
            what&apos;s in stock. Each call asks about fuel types, availability, and pricing.
            Structured data comes back as clean JSON. The results feed a live map that
            anyone can search. Around 4 to 5 cents per call.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mt-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-black">7,000</div>
              <div className="text-sm text-white/60 mt-1">Calls per day</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">~$0.05</div>
              <div className="text-sm text-white/60 mt-1">Per call</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">0</div>
              <div className="text-sm text-white/60 mt-1">Human operators</div>
            </div>
          </div>

          {/* Example JSON structure */}
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 text-center">Example data returned per station</p>
            <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[10px] text-white/30 ml-2 font-mono">call.analysis</span>
              </div>
              <pre className="p-5 text-xs font-mono text-white/70 overflow-x-auto leading-relaxed">{`{
  "station": "BP Parramatta Road, Auburn",
  "status": "open",
  "fuels": {
    "unleaded_91": { "available": true,  "price_per_litre": 1.89 },
    "unleaded_95": { "available": true,  "price_per_litre": 2.05 },
    "premium_98": { "available": false, "price_per_litre": null },
    "diesel":     { "available": true,  "price_per_litre": 1.95 },
    "e10":        { "available": true,  "price_per_litre": 1.82 },
    "lpg":        { "available": false, "price_per_litre": null }
  },
  "queue_length": "moderate",
  "estimated_wait": "10-15 minutes",
  "purchase_limit": "40 litres per vehicle",
  "last_delivery": "this morning",
  "notes": "Premium and LPG sold out since yesterday"
}`}</pre>
            </div>
          </div>

          {/* CTA to try it */}
          <div className="text-center">
            <a
              href="https://fuel-map-omega.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-primary hover:bg-white/90 transition-all"
            >
              Try the Fuel Map
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <p className="text-xs text-white/40 mt-3">Live site powered by Skawk voice calls</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Get Started</p>
          <h2 className="text-4xl font-black mb-4">Talk to us</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Tell us what you are building. We will show you how Skawk can power it.
          </p>
          <a
            href="mailto:hello@skawk.io?subject=Skawk%20inquiry"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary-hover transition-all glow-orange"
          >
            Talk to Us
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-6 text-sm text-muted-foreground">hello@skawk.io</p>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

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
          <p className="text-sm text-white/30 mt-6">No credit card required. 50 calls free. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <Image src="/skawk-logo.png" alt="Skawk" width={100} height={33} className="h-8 w-auto mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                AI-powered calling for opted-in contacts that sounds human, scales instantly, and converts more leads. We never make cold calls. Every contact must have given prior consent.
              </p>
              <p className="text-sm text-muted-foreground mt-3">skawk.io</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Use Cases", href: "#use-cases" },
                  { label: "Integrations", href: "#integrations" },
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
              <h4 className="font-bold mb-4 text-sm">Contact</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:hello@skawk.io" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    hello@skawk.io
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Skawk
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
