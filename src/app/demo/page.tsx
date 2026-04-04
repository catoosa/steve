"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Brain,
  Zap,
  AlertTriangle,
  MessageSquare,
  Clock,
  Database,
  ChevronRight,
  Activity,
  Shield,
  ListOrdered,
  CheckCircle2,
} from "lucide-react";

const ANALYSIS_JSON = `{
  "pain_level": 8,
  "medication_adherence": false,
  "mobility": "assisted",
  "mood": "anxious",
  "escalation_needed": true,
  "next_appointment_confirmed": false,
  "summary": "Patient reports sharp hip pain at 8/10, has not been taking prescribed Panadol Osteo. Using walker but unsteady. Anxious about recovery timeline.",
  "key_concerns": ["severe pain", "medication non-adherence", "fall risk"]
}`;

const WORKFLOW_STEPS = [
  {
    icon: Phone,
    title: "AI calls patient",
    desc: "Emma, your AI care nurse, calls each patient with a warm, empathetic check-in",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "Extracts clinical data",
    desc: "Structured JSON extraction: pain level, medication adherence, mobility, mood, escalation flags",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "Workflows evaluate",
    desc: "Conditions engine checks: pain > 7? Medication missed? Fall risk? Each triggers specific actions",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Escalations fire",
    desc: "Critical clinical flags create instant escalations for the nursing team with priority routing",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: MessageSquare,
    title: "SMS follow-ups sent",
    desc: "Patients get immediate reassurance. Care team gets alerted. External systems get webhooks",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Clock,
    title: "Callbacks scheduled",
    desc: "Medication non-adherence? Auto-schedule a 24h follow-up call with a tailored script",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

const SEQUENCE_STEPS = [
  { day: "Day 1", type: "call", desc: "Initial check-in call — pain, medication, mobility, mood" },
  { day: "Day 3", type: "sms", desc: "SMS check-in — medication reminder + encouragement" },
  { day: "Day 7", type: "call", desc: "Final follow-up call — recovery progress, GP appointment confirmed" },
];

const DIFFERENTIATORS = [
  {
    feature: "Post-call automation",
    bland: "Webhook fires. You build the rest.",
    skawk: "Workflows evaluate conditions and chain actions automatically",
  },
  {
    feature: "Escalations",
    bland: "Not available",
    skawk: "Priority-based clinical escalation with routing and tracking",
  },
  {
    feature: "Multi-touch sequences",
    bland: "Not available",
    skawk: "Call → Wait → SMS → Wait → Call chains with auto-progression",
  },
  {
    feature: "Contact timeline",
    bland: "Not available",
    skawk: "Unified activity feed: calls, SMS, escalations, workflow actions",
  },
  {
    feature: "Structured data extraction",
    bland: "Raw JSON, you parse it",
    skawk: "Extracted data drives automated workflows in real-time",
  },
  {
    feature: "Compliance",
    bland: "DIY",
    skawk: "DNC management, guard rails, calling hours, consent tracking",
  },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"flow" | "api" | "compare">("flow");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Skawk
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium mb-6">
            <Activity className="w-4 h-4" />
            Healthcare Demo
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Post-Discharge Patient Follow-Up
            <br />
            <span className="text-primary">Fully Automated</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            One API call triggers an AI nurse call. Structured clinical data comes back.
            Workflows escalate, follow up, and notify — automatically.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary/90 transition-all"
            >
              Try It Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-medium hover:bg-muted transition-colors"
            >
              API Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 pb-4">
        <div className="max-w-4xl mx-auto flex gap-2 border-b border-border">
          {[
            { key: "flow" as const, label: "How It Works", icon: Zap },
            { key: "api" as const, label: "API Response", icon: Database },
            { key: "compare" as const, label: "vs Bland.ai", icon: Shield },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Flow Tab */}
          {activeTab === "flow" && (
            <div className="space-y-6 pt-8">
              <h2 className="text-2xl font-bold mb-2">What happens when a call completes</h2>
              <p className="text-muted-foreground mb-8">
                Every call result flows through the workflow engine. No code needed after initial setup.
              </p>
              <div className="space-y-4">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full ${step.bg} flex items-center justify-center`}>
                        <step.icon className={`w-5 h-5 ${step.color}`} />
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7-Day Sequence */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <ListOrdered className="w-6 h-6 text-primary" />
                  7-Day Post-Discharge Sequence
                </h2>
                <p className="text-muted-foreground mb-6">
                  Multi-touch automation that no one else offers. Define once, runs for every patient.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {SEQUENCE_STEPS.map((step, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5">
                      <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{step.day}</div>
                      <div className="flex items-center gap-2 mb-2">
                        {step.type === "call" ? (
                          <Phone className="w-4 h-4 text-green-500" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm font-semibold capitalize">{step.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API Tab */}
          {activeTab === "api" && (
            <div className="pt-8">
              <h2 className="text-2xl font-bold mb-2">Structured clinical data from every call</h2>
              <p className="text-muted-foreground mb-6">
                The analysis prompt extracts structured JSON. This drives the entire automation engine.
              </p>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground ml-2 font-mono">call.analysis</span>
                </div>
                <pre className="p-6 text-sm font-mono overflow-x-auto text-green-400 bg-[#0d1117]">
                  {ANALYSIS_JSON}
                </pre>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Workflow Triggered
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                      <span>Critical Pain Escalation</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">pain_level (8) &gt; 7 → escalation created</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-500" />
                      <span>Medication Reminder Callback</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">medication_adherence = false → 24h callback scheduled</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    Actions Executed
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Escalation created (priority: critical)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>SMS sent to patient</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Webhook sent to clinical system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Callback scheduled (24h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Timeline event recorded</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === "compare" && (
            <div className="pt-8">
              <h2 className="text-2xl font-bold mb-2">Skawk vs Bland.ai</h2>
              <p className="text-muted-foreground mb-6">
                Bland makes the call. Skawk turns it into a system.
              </p>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 text-left font-medium text-muted-foreground w-1/4">Feature</th>
                      <th className="px-6 py-4 text-left font-medium text-muted-foreground w-[37.5%]">Bland.ai</th>
                      <th className="px-6 py-4 text-left font-medium w-[37.5%]">
                        <span className="text-primary font-bold">Skawk</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {DIFFERENTIATORS.map((d, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">{d.feature}</td>
                        <td className="px-6 py-4 text-muted-foreground">{d.bland}</td>
                        <td className="px-6 py-4">
                          <span className="text-green-500 font-medium">{d.skawk}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Ready to automate your calls?</h2>
          <p className="text-muted-foreground mb-8">
            50 free calls. No credit card required. Set up in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary/90 transition-all"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
