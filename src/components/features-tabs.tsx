"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
// The FEATURES array lives HERE (not in the server page): icon components are
// functions and cannot cross the server->client prop boundary — passing them
// from app/page.tsx fails prerender for the whole route.
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Clock,
  Code2,
  DollarSign,
  FileText,
  Fingerprint,
  FlaskConical,
  GitBranch,
  Globe,
  LayoutTemplate,
  ListOrdered,
  MessageSquare,
  Mic,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Radio,
  Shield,
  Tag,
  Users,
  Webhook,
  Zap,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  hover?: string;
  category: string;
}

const CATEGORY_ORDER = [
  "All",
  "Campaign Intelligence",
  "AI Agents",
  "Channels",
  "Compliance",
  "Platform",
  "Automation",
];

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

export function FeaturesTabs() {
  const features: Feature[] = FEATURES;
  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? features
      : features.filter((f) => f.category === active);

  const counts = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] =
        cat === "All"
          ? features.length
          : features.filter((f) => f.category === cat).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              active === cat
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
            <span
              className={`ml-1.5 text-xs ${
                active === cat ? "text-white/70" : "text-muted-foreground/60"
              }`}
            >
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {filtered.map((f) => (
          <div
            key={f.title}
            className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {f.desc}
            </p>
            {f.hover && (
              <div className="absolute inset-0 bg-card/98 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  How it works
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {f.hover}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
