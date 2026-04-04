"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  PhoneCall,
  Bot,
  Mic,
  Megaphone,
  GitBranch,
  BookOpen,
  Brain,
  MessageSquare,
  Zap,
  ListOrdered,
  AlertTriangle,
  Shield,
  Activity,
  Wrench,
  Key,
  CreditCard,
  Building2,
  Plug,
  Search,
  ChevronDown,
  ChevronRight,
  Globe,
  BarChart3,
  Users,
  Lock,
  FileJson,
  Webhook,
} from "lucide-react";

interface Feature {
  title: string;
  description: string;
  details: string[];
  dashboardPath?: string;
  apiEndpoint?: string;
}

interface FeatureCategory {
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  features: Feature[];
}

const CATEGORIES: FeatureCategory[] = [
  {
    name: "Voice Calling",
    icon: Phone,
    color: "text-green-500",
    bg: "bg-green-500/10",
    features: [
      {
        title: "Outbound Calls",
        description: "AI-powered outbound calls at scale — up to 10,000 simultaneous calls",
        details: [
          "Single or batch calls via API",
          "Custom voice agent prompts",
          "First sentence customization",
          "Call duration limits (configurable)",
          "Voicemail detection",
          "40+ language support with auto-detection",
        ],
        dashboardPath: "/dashboard/calls",
        apiEndpoint: "POST /api/v1/calls",
      },
      {
        title: "Inbound Numbers",
        description: "Purchase phone numbers and receive calls 24/7 with AI agents",
        details: [
          "Purchase numbers by area code",
          "Configure per-number voice agent",
          "Custom prompt and voice per number",
          "Auto-answer with AI",
        ],
        dashboardPath: "/dashboard/numbers",
      },
      {
        title: "Call Recording & Transcripts",
        description: "Every call is recorded with full transcript and AI-corrected text",
        details: [
          "Automatic call recording",
          "Full transcript generation",
          "AI-corrected transcripts",
          "Recording URL access",
        ],
        dashboardPath: "/dashboard/calls",
      },
    ],
  },
  {
    name: "AI Personas",
    icon: Bot,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    features: [
      {
        title: "Custom Personas",
        description: "Create reusable AI agent identities with specific voices, languages, and personalities",
        details: [
          "Name, voice, and language configuration",
          "Custom system prompts",
          "Reusable across campaigns",
          "Version management",
        ],
        dashboardPath: "/dashboard/personas",
        apiEndpoint: "POST /api/v1/personas",
      },
      {
        title: "Voice Cloning",
        description: "Clone any voice from a short audio clip for a custom agent voice",
        details: [
          "Upload audio clip (30s minimum)",
          "Automatic voice model creation",
          "Use cloned voices in any campaign",
        ],
        dashboardPath: "/dashboard/voices",
        apiEndpoint: "POST /api/v1/voices/clone",
      },
    ],
  },
  {
    name: "Campaigns",
    icon: Megaphone,
    color: "text-primary",
    bg: "bg-primary/10",
    features: [
      {
        title: "Campaign Management",
        description: "Organize calls into campaigns with contacts, scheduling, and tracking",
        details: [
          "12+ industry templates (Solar, Aged Care, Debt Recovery, etc.)",
          "CSV contact upload",
          "Calling hours and timezone control",
          "Campaign status tracking (Draft → Active → Completed)",
          "Denormalized stats for fast dashboards",
        ],
        dashboardPath: "/dashboard/campaigns",
      },
      {
        title: "A/B Testing",
        description: "Split-test different prompts and first sentences to optimize conversion",
        details: [
          "Create A/B variants with different scripts",
          "Configurable traffic split percentage",
          "Contacts randomly distributed",
          "Compare answer rates and dispositions per variant",
        ],
        dashboardPath: "/dashboard/campaigns/new",
      },
      {
        title: "Structured Data Extraction",
        description: "Extract structured JSON from every call using analysis prompts",
        details: [
          "Custom analysis prompts per campaign",
          "Structured JSON output (any schema you define)",
          "Disposition tracking (INTERESTED, NOT_INTERESTED, FOLLOW_UP, etc.)",
          "Custom dispositions",
          "Emotion analysis (happy, neutral, angry, sad)",
        ],
        apiEndpoint: "POST /api/v1/calls/[id]/analyze",
      },
    ],
  },
  {
    name: "Workflows",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    features: [
      {
        title: "Post-Call Automation",
        description: "Trigger automated actions when calls complete based on conditions",
        details: [
          "Trigger on: call completed, no answer, voicemail",
          "Condition engine: field paths, operators (eq, gt, lt, contains, etc.)",
          "AND/OR condition grouping",
          "Dot-notation access into analysis JSON (e.g. analysis.pain_level > 7)",
          "Template variables in actions: {{contact.name}}, {{analysis.summary}}",
        ],
        dashboardPath: "/dashboard/workflows",
        apiEndpoint: "POST /api/v1/workflows",
      },
      {
        title: "Workflow Actions",
        description: "7 built-in actions that chain together in any order",
        details: [
          "Send SMS — follow-up text to the contact",
          "Schedule Callback — new call in X hours with custom script",
          "Create Escalation — priority alert for human review",
          "Webhook — POST to external system with call data",
          "Update Contact — modify contact metadata or status",
          "Add to DNC — auto-add phone to Do Not Call list",
          "Enroll in Sequence — start a multi-touch sequence",
        ],
        dashboardPath: "/dashboard/workflows/new",
      },
      {
        title: "Execution Tracking",
        description: "Full audit trail of every workflow execution and step result",
        details: [
          "Per-workflow execution history",
          "Per-step success/failure/skipped status",
          "Error logging and diagnostics",
          "Dashboard view of all executions",
        ],
        dashboardPath: "/dashboard/workflows",
      },
    ],
  },
  {
    name: "Sequences",
    icon: ListOrdered,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    features: [
      {
        title: "Multi-Touch Sequences",
        description: "Chain calls, SMS, and waits into automated sequences over days or weeks",
        details: [
          "Step types: Call, SMS, Wait, Webhook",
          "Configurable delay between steps (hours)",
          "Example: Day 1 Call → Day 3 SMS → Day 7 Call",
          "Contact enrollment and progress tracking",
          "Auto-pause when sequence is disabled",
          "Cron-based execution (every 5 minutes)",
        ],
        dashboardPath: "/dashboard/sequences",
        apiEndpoint: "POST /api/v1/sequences",
      },
      {
        title: "Enrollment Management",
        description: "Enroll contacts manually, via API, or automatically from workflows",
        details: [
          "Bulk enrollment via API",
          "Auto-enrollment from workflow actions",
          "Track progress per contact (current step, status)",
          "Pause/cancel individual enrollments",
        ],
        apiEndpoint: "POST /api/v1/sequences/[id]/enroll",
      },
    ],
  },
  {
    name: "Escalations",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    features: [
      {
        title: "Priority Escalation System",
        description: "Flag critical outcomes for human review with priority routing",
        details: [
          "Priority levels: Critical, High, Medium, Low",
          "Auto-created by workflows (e.g. pain > 7 → critical)",
          "Manual creation via API",
          "Status tracking: Open → Acknowledged → Resolved",
          "Assigned-to for team routing",
          "Dashboard with priority-sorted view",
        ],
        dashboardPath: "/dashboard/escalations",
        apiEndpoint: "POST /api/v1/escalations",
      },
    ],
  },
  {
    name: "SMS",
    icon: MessageSquare,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    features: [
      {
        title: "SMS Messaging",
        description: "Send single or batch SMS messages, view conversations",
        details: [
          "Single and batch SMS sending",
          "Conversation threading",
          "SMS analysis with custom prompts",
          "Auto-triggered from workflows and sequences",
        ],
        dashboardPath: "/dashboard/sms",
        apiEndpoint: "POST /api/v1/sms",
      },
    ],
  },
  {
    name: "Pathways",
    icon: GitBranch,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    features: [
      {
        title: "Conversation Flows",
        description: "Visual builder for complex conversation trees with branching logic",
        details: [
          "Drag-and-drop pathway builder",
          "AI-generate from text description",
          "Test via chat interface",
          "Version control with promote-to-production",
        ],
        dashboardPath: "/dashboard/pathways",
        apiEndpoint: "POST /api/v1/pathways",
      },
    ],
  },
  {
    name: "Knowledge Bases",
    icon: BookOpen,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    features: [
      {
        title: "RAG Knowledge Bases",
        description: "Upload documents so AI agents can answer questions about your products and services",
        details: [
          "Upload PDF, DOCX, TXT documents",
          "Scrape web URLs",
          "Query knowledge base via chat",
          "Attach to campaigns for real-time agent access",
        ],
        dashboardPath: "/dashboard/knowledge",
        apiEndpoint: "POST /api/v1/knowledge",
      },
    ],
  },
  {
    name: "Contact Timeline",
    icon: Activity,
    color: "text-green-400",
    bg: "bg-green-400/10",
    features: [
      {
        title: "Unified Activity Feed",
        description: "Every interaction with a contact in one place: calls, SMS, escalations, workflow actions",
        details: [
          "Event types: call, sms, escalation, workflow action, status change, sequence step",
          "Chronological feed per contact",
          "Automatic recording from all Skawk systems",
        ],
        apiEndpoint: "GET /api/v1/contacts/[id]/timeline",
      },
    ],
  },
  {
    name: "Compliance",
    icon: Shield,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    features: [
      {
        title: "Guard Rails & DNC",
        description: "Built-in compliance for Australian Spam Act, TCPA (US), GDPR (EU)",
        details: [
          "One-click compliance presets per jurisdiction",
          "Do Not Call (DNC) list management",
          "Auto-DNC on opt-out disposition",
          "DNC scrubbing before campaign launch",
          "Calling hours enforcement by timezone",
          "CSV export for audit",
        ],
        dashboardPath: "/dashboard/compliance",
      },
    ],
  },
  {
    name: "Analytics & Reporting",
    icon: BarChart3,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    features: [
      {
        title: "Campaign Analytics",
        description: "Answer rates, disposition breakdowns, duration stats, emotion analysis",
        details: [
          "Campaign-level and call-level stats",
          "Answer rate tracking",
          "Disposition funnel",
          "Export to CSV and PDF",
        ],
        dashboardPath: "/dashboard/analytics",
      },
    ],
  },
  {
    name: "Agency & White-Label",
    icon: Building2,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    features: [
      {
        title: "Agency Sub-Accounts",
        description: "Manage multiple client accounts with per-client call limits and branding",
        details: [
          "Create up to 10 sub-accounts (Agency plan)",
          "Per-client call limits",
          "Usage reporting and CSV export",
          "White-label client portal",
        ],
        dashboardPath: "/dashboard/agency",
      },
      {
        title: "Client Portal",
        description: "Read-only campaign dashboards for your clients — no login required",
        details: [
          "Shareable link with org_id + key",
          "Custom domain support",
          "Campaign stats and call outcomes",
          "Branded with your logo",
        ],
        dashboardPath: "/dashboard/settings",
      },
    ],
  },
  {
    name: "Integrations",
    icon: Plug,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    features: [
      {
        title: "GoHighLevel (GHL)",
        description: "Sync call outcomes to GHL contacts as notes",
        details: [
          "Auto-search contact by phone",
          "Add call result notes (status, disposition, duration, summary)",
          "Location-based configuration",
        ],
        dashboardPath: "/dashboard/integrations",
      },
      {
        title: "Custom Webhooks",
        description: "Receive real-time call events at your endpoint",
        details: [
          "call.completed event with full payload",
          "Custom webhook URL per organization",
          "Workflow webhook action for per-step delivery",
        ],
        dashboardPath: "/dashboard/settings",
      },
      {
        title: "Custom Tools",
        description: "Give your AI agent the ability to call external APIs mid-conversation",
        details: [
          "Define webhook-based tools",
          "Agent calls tool during live conversation",
          "Result integrated into call context",
        ],
        dashboardPath: "/dashboard/tools",
        apiEndpoint: "POST /api/v1/tools",
      },
    ],
  },
  {
    name: "API & Developer",
    icon: Key,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    features: [
      {
        title: "RESTful API",
        description: "Full API access to all Skawk features with API key authentication",
        details: [
          "x-api-key or Bearer token auth",
          "Calls, campaigns, personas, voices, pathways",
          "Workflows, sequences, escalations",
          "Knowledge bases, SMS, tools, numbers",
          "Contact timeline",
        ],
        dashboardPath: "/dashboard/api",
      },
      {
        title: "Memory System",
        description: "Persistent context that carries across multiple calls with the same contact",
        details: [
          "Create memory entries",
          "Enable/disable per campaign",
          "Cross-call context retention",
        ],
        dashboardPath: "/dashboard/memory",
        apiEndpoint: "POST /api/v1/memory",
      },
    ],
  },
  {
    name: "Billing",
    icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    features: [
      {
        title: "Plans & Pricing",
        description: "Free tier + paid plans with monthly call allowances",
        details: [
          "Free: 50 calls, 1 persona",
          "Starter ($149/mo): 300 calls, 3 personas, CSV upload, pathways",
          "Pro ($499/mo): 1,500 calls, unlimited personas, voice cloning, full API",
          "Agency ($599/mo): 10 sub-accounts, white-label portal",
          "Enterprise: Custom pricing, SSO, dedicated infrastructure",
          "Low-balance email alerts at 50, 25, 10 calls remaining",
        ],
        dashboardPath: "/dashboard/billing",
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const filtered = search
    ? CATEGORIES.map((cat) => ({
        ...cat,
        features: cat.features.filter(
          (f) =>
            f.title.toLowerCase().includes(search.toLowerCase()) ||
            f.description.toLowerCase().includes(search.toLowerCase()) ||
            f.details.some((d) => d.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter((cat) => cat.features.length > 0)
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Skawk
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API Docs
            </Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Header */}
      <section className="py-12 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black mb-3">Help & Features</h1>
          <p className="text-muted-foreground mb-6">
            Everything Skawk can do — browse by category or search.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto space-y-3">
          {filtered.map((category) => {
            const isExpanded = expandedCategory === category.name || !!search;
            return (
              <div key={category.name} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded && !search ? null : category.name)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg ${category.bg} flex items-center justify-center`}>
                    <category.icon className={`w-5 h-5 ${category.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="font-semibold">{category.name}</h2>
                    <p className="text-xs text-muted-foreground">{category.features.length} feature{category.features.length !== 1 ? "s" : ""}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {category.features.map((feature) => {
                      const featureKey = `${category.name}-${feature.title}`;
                      const featureExpanded = expandedFeature === featureKey || !!search;
                      return (
                        <div key={feature.title} className="px-6">
                          <button
                            onClick={() => setExpandedFeature(featureExpanded && !search ? null : featureKey)}
                            className="w-full flex items-center gap-3 py-4 text-left"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{feature.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                            </div>
                            {featureExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {featureExpanded && (
                            <div className="pb-4 pl-1">
                              <ul className="space-y-1.5 mb-3">
                                {feature.details.map((detail, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <span className="text-primary mt-0.5">•</span>
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                              <div className="flex items-center gap-3">
                                {feature.dashboardPath && (
                                  <Link
                                    href={feature.dashboardPath}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                  >
                                    Open in Dashboard <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}
                                {feature.apiEndpoint && (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    <FileJson className="w-3 h-3" />
                                    {feature.apiEndpoint}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "API Documentation", href: "/docs", icon: Key },
              { label: "Healthcare Demo", href: "/demo", icon: Activity },
              { label: "Privacy Policy", href: "/privacy", icon: Lock },
              { label: "Terms of Service", href: "/terms", icon: FileJson },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
              >
                <link.icon className="w-4 h-4 text-muted-foreground" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Need help? Email us at{" "}
            <a href="mailto:hello@skawk.io" className="text-primary hover:underline">
              hello@skawk.io
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
