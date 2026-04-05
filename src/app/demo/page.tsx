"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Brain,
  Zap,
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Activity,
  Shield,
  Calendar,
  Users,
  FileText,
  Heart,
  RefreshCw,
  Play,
  Home,
  DollarSign,
  Mail,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";

// ─── Transcript Lines ────────────────────────────────────────────────────────

interface TranscriptLine {
  speaker: "steve" | "david" | "system";
  text: string;
  annotation?: string;
  delay: number;
}

const TRANSCRIPT: TranscriptLine[] = [
  {
    speaker: "steve",
    text: "Hi David, it\u2019s Steve calling from Ray White Northbridge. I noticed you enquired about the four-bedroom on Cliff Street \u2014 have you got a minute to chat?",
    delay: 0,
  },
  {
    speaker: "david",
    text: "Oh yeah, hi Steve. Yeah I had a look online, it looks great actually. We\u2019ve been looking for a while.",
    delay: 1800,
  },
  {
    speaker: "steve",
    text: "Glad to hear it. Just so I can point you in the right direction \u2014 are you looking to buy or are you currently renting?",
    delay: 1500,
  },
  {
    speaker: "david",
    text: "We\u2019re looking to buy. We\u2019ve got pre-approval already, up to about 1.8 million.",
    delay: 1800,
  },
  {
    speaker: "steve",
    text: "Perfect, that puts you right in the range. And is it just the Northbridge area you\u2019re looking at, or are you open to nearby suburbs too?",
    annotation: "Pre-approved buyer \u2014 $1.8M",
    delay: 1500,
  },
  {
    speaker: "david",
    text: "We\u2019d consider Willoughby or Artarmon as well. Mainly want to be near the schools \u2014 we\u2019ve got two kids starting at Northbridge Public next year.",
    delay: 2200,
  },
  {
    speaker: "steve",
    text: "Great choice, that\u2019s a fantastic school. The Cliff Street property is actually in the catchment. We have an open inspection this Saturday at 10am \u2014 would you like me to book you in?",
    delay: 1800,
  },
  {
    speaker: "david",
    text: "Saturday works perfectly. Can you send me the details? And actually, if you have anything else coming up in that area with four bedrooms, I\u2019d love to know about it.",
    delay: 2200,
  },
  {
    speaker: "steve",
    text: "Absolutely, I\u2019ll send everything through. We actually have two off-market listings that might suit you \u2014 I\u2019ll include those as well. Looking forward to meeting you Saturday, David.",
    annotation: "Inspection booked + off-market interest",
    delay: 1500,
  },
  {
    speaker: "david",
    text: "Brilliant, thanks Steve. See you then.",
    delay: 1200,
  },
  {
    speaker: "system",
    text: "Call completed. Analysing transcript...",
    delay: 800,
  },
];

// ─── Analysis JSON ───────────────────────────────────────────────────────────

const ANALYSIS = {
  buyer_status: "pre-approved",
  budget: "$1.8M",
  property_type: "house",
  bedrooms: 4,
  suburbs: ["Northbridge", "Willoughby", "Artarmon"],
  motivation: "school catchment — Northbridge Public",
  timeline: "active — searching now",
  family: "2 children",
  inspection_booked: true,
  inspection_date: "Saturday 10am",
  off_market_interest: true,
  lead_score: "hot",
  summary: "Pre-approved buyer at $1.8M. Looking for 4-bed in Northbridge/Willoughby/Artarmon, driven by school catchment. Booked Saturday inspection. Interested in off-market listings.",
};

// ─── Action Chain ────────────────────────────────────────────────────────────

interface ActionStep {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  detail: string;
  duration: string;
}

const ACTIONS: ActionStep[] = [
  {
    icon: Brain,
    iconColor: "text-blue-500",
    title: "Lead data extracted from conversation",
    detail: 'Skawk extracted: buyer_status: "pre-approved", budget: "$1.8M", lead_score: "hot", suburbs: 3 target areas',
    duration: "0.3s",
  },
  {
    icon: Star,
    iconColor: "text-yellow-500",
    title: "Lead scored and prioritised",
    detail: "Pre-approved + active search + booked inspection = HOT lead. Moved to top of pipeline.",
    duration: "0.7s",
  },
  {
    icon: Zap,
    iconColor: "text-primary",
    title: "CRM updated via webhook",
    detail: "Contact record created in CRM with full qualification data. Assigned to Agent: Sarah Chen.",
    duration: "1.1s",
  },
  {
    icon: Calendar,
    iconColor: "text-green-500",
    title: "Inspection booked",
    detail: "Saturday 10am inspection at 14 Cliff Street added to calendar. Attendee: David + partner.",
    duration: "1.5s",
  },
  {
    icon: Mail,
    iconColor: "text-purple-500",
    title: "Property pack sent",
    detail: "Automated email with Cliff Street listing details, floor plan, strata report, and 2 off-market matches.",
    duration: "2.0s",
  },
  {
    icon: MessageSquare,
    iconColor: "text-teal-500",
    title: "SMS confirmation sent",
    detail: '"Hi David, you\u2019re booked for 14 Cliff Street this Saturday 10am. Details in your inbox. See you there! \u2014 Ray White Northbridge"',
    duration: "2.4s",
  },
  {
    icon: Home,
    iconColor: "text-indigo-500",
    title: "Off-market matches queued",
    detail: "2 off-market 4-bed listings in Willoughby matched to David\u2019s criteria. Agent Sarah notified to follow up.",
    duration: "2.8s",
  },
  {
    icon: Users,
    iconColor: "text-pink-500",
    title: "Agent notified",
    detail: "Sarah Chen received push notification: \u201cHot lead \u2014 David, $1.8M pre-approved, Saturday inspection booked.\u201d",
    duration: "3.2s",
  },
  {
    icon: Activity,
    iconColor: "text-cyan-500",
    title: "Contact timeline updated",
    detail: "Full call transcript, qualification data, inspection booking, and all actions recorded in unified timeline.",
    duration: "3.5s",
  },
  {
    icon: Clock,
    iconColor: "text-orange-500",
    title: "Follow-up sequence enrolled",
    detail: "David enrolled in buyer nurture sequence: Friday reminder SMS \u2192 Monday post-inspection call \u2192 Wednesday market update.",
    duration: "3.8s",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [phase, setPhase] = useState<"idle" | "transcript" | "analysis" | "actions" | "done">("idle");
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleActions, setVisibleActions] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const actionStartRef = useRef(0);
  const rafRef = useRef<number>(0);

  const clearAllTimeouts = useCallback(() => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    clearAllTimeouts();
    setPhase("idle");
    setVisibleLines(0);
    setVisibleActions(0);
    setShowAnalysis(false);
    setElapsedTime(0);
  }, [clearAllTimeouts]);

  const startDemo = useCallback(() => {
    reset();
    setPhase("transcript");

    let totalDelay = 300;
    TRANSCRIPT.forEach((line, i) => {
      totalDelay += line.delay;
      const t = setTimeout(() => setVisibleLines(i + 1), totalDelay);
      timeoutRef.current.push(t);
    });

    totalDelay += 1500;
    const t1 = setTimeout(() => {
      setPhase("analysis");
      setShowAnalysis(true);
    }, totalDelay);
    timeoutRef.current.push(t1);

    totalDelay += 2500;
    const t2 = setTimeout(() => {
      setPhase("actions");
      actionStartRef.current = Date.now();

      const tick = () => {
        const elapsed = (Date.now() - actionStartRef.current) / 1000;
        setElapsedTime(Math.min(elapsed, 3.8));
        if (elapsed < 4.0) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);

      ACTIONS.forEach((_, i) => {
        const actionDelay = (i + 1) * 380;
        const t = setTimeout(() => setVisibleActions(i + 1), actionDelay);
        timeoutRef.current.push(t);
      });

      const tDone = setTimeout(() => setPhase("done"), ACTIONS.length * 380 + 800);
      timeoutRef.current.push(tDone);
    }, totalDelay);
    timeoutRef.current.push(t2);
  }, [reset]);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">Skawk</Link>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help</Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Interactive Demo</p>
          <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            Voice to insight to action
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            One conversation. Ten actions. Zero data entry.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A buyer enquires about a property listing. Watch what happens when Skawk picks up the phone.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-6 pb-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-primary">
              {phase === "idle" ? "10" : visibleActions}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Actions</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-primary">
              {phase === "actions" || phase === "done" ? `${elapsedTime.toFixed(1)}s` : "3.8s"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Seconds</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">Keystrokes</p>
          </div>
        </div>
      </section>

      {/* Play Button */}
      {phase === "idle" && (
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto text-center">
            <button
              onClick={startDemo}
              className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
            >
              <Play className="w-5 h-5" />
              Play Demo
            </button>
          </div>
        </section>
      )}

      {/* Main Demo Area */}
      {phase !== "idle" && (
        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Transcript */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold">Steve&apos;s lead qualification call</span>
                {phase === "transcript" && visibleLines < TRANSCRIPT.length && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-green-500">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                {TRANSCRIPT.slice(0, visibleLines).map((line, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      line.speaker === "system" ? "justify-center" : ""
                    }`}
                    style={{ animation: "fadeSlideIn 0.3s ease-out" }}
                  >
                    {line.speaker === "system" ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-full px-4 py-2">
                        <Brain className="w-3.5 h-3.5 text-blue-500" />
                        {line.text}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            line.speaker === "steve"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {line.speaker === "steve" ? "S" : "D"}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-0.5 capitalize">{line.speaker === "steve" ? "Steve" : "David"}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{line.text}</p>
                          {line.annotation && (
                            <div className="inline-flex items-center gap-1.5 mt-2 text-xs bg-green-500/10 text-green-600 rounded-full px-3 py-1">
                              <TrendingUp className="w-3 h-3" />
                              {line.annotation}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis JSON */}
            {showAnalysis && (
              <div className="bg-[#0d1117] border border-border rounded-xl overflow-hidden" style={{ animation: "fadeSlideIn 0.5s ease-out" }}>
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs text-white/40 ml-2 font-mono">call.analysis — structured data extracted</span>
                </div>
                <pre className="p-5 text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">
                  {JSON.stringify(ANALYSIS, null, 2)}
                </pre>
              </div>
            )}

            {/* Workflow Banner */}
            {(phase === "actions" || phase === "done") && visibleActions === 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse py-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Hot lead detected. Orchestrating workflows...
              </div>
            )}

            {/* Action Chain */}
            {visibleActions > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold">Skawk&apos;s automated action chain</span>
                </div>
                <div className="divide-y divide-border">
                  {ACTIONS.slice(0, visibleActions).map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-5 py-3.5"
                      style={{ animation: "fadeSlideIn 0.3s ease-out" }}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${action.iconColor} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{action.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {phase === "done" && (
              <div style={{ animation: "fadeSlideIn 0.5s ease-out" }}>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                  <p className="text-2xl font-black mb-2">
                    3.8 seconds. One call became ten actions.
                  </p>
                  <p className="text-muted-foreground">
                    Qualified, scored, booked, emailed, texted, matched, notified, and enrolled in a follow-up sequence. No human entered a single data point.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Play again
                  </button>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* What just happened */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-8 text-center">What just happened</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-1">Voice</h3>
              <p className="text-sm text-muted-foreground">
                Steve, an AI sales agent, qualified a buyer lead with a natural conversation. Custom voice, script, and personality.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-1">Insight</h3>
              <p className="text-sm text-muted-foreground">
                Structured buyer data extracted in real time. Budget, suburbs, timeline, motivation, lead score — any schema you define.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold mb-1">Action</h3>
              <p className="text-sm text-muted-foreground">
                Workflows scored the lead, updated the CRM, booked the inspection, sent confirmations, and enrolled in a nurture sequence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className="py-16 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-4">Other tools make the call.<br />Skawk runs the system.</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Most voice AI platforms fire a webhook when the call ends and wish you luck. Skawk evaluates the data, chains actions, scores leads, and runs multi-day follow-up sequences — automatically.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            {[
              { label: "Workflows", desc: "Condition \u2192 action chains", icon: Zap },
              { label: "Sequences", desc: "Multi-day call + SMS journeys", icon: Activity },
              { label: "Escalations", desc: "Priority alerts for humans", icon: AlertTriangle },
              { label: "Timeline", desc: "Full contact history", icon: Clock },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <item.icon className="w-4 h-4 text-primary mb-2" />
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-8 text-center">Works for every industry that picks up the phone</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Real Estate", detail: "Buyer qualification, inspection bookings, off-market matching" },
              { label: "Solar & Energy", detail: "Lead qualification, roof type, budget extraction, auto-CRM" },
              { label: "Debt Recovery", detail: "Promise-to-pay, compliant scripting, DNC management" },
              { label: "Healthcare", detail: "Patient follow-up, clinical escalation, medication checks" },
              { label: "Recruitment", detail: "Candidate screening, availability checks, skill matching" },
              { label: "Insurance", detail: "Claims follow-up, renewal reminders, quote qualification" },
            ].map((item, i) => (
              <div key={i} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <p className="text-sm font-semibold mb-1">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Ready to automate your calls?</h2>
          <p className="text-muted-foreground mb-8">
            50 free calls. Full platform access. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary/90 transition-all"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-medium hover:bg-muted transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <p>&copy; 2026 CareplanAI Pty Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="mailto:hello@skawk.io" className="hover:text-foreground transition-colors">hello@skawk.io</Link>
          </div>
        </div>
      </footer>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
