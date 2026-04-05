"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Brain,
  Zap,
  Activity,
  AlertTriangle,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const pipelineSteps = [
  { title: "Call initiated", sub: "Connects to +61 412 345 678", time: "0.0s" },
  { title: "Agent speaks", sub: "Follows the prompt, natural conversation", time: "0.2s" },
  { title: "Patient responds", sub: "Speech-to-text, intent detected", time: "3.1s" },
  { title: "Mid-call API action", sub: "Checks calendar system for Thursday slots", time: "18.2s" },
  { title: "Agent confirms new time", sub: "Thursday 10am offered and accepted", time: "19.4s" },
  { title: "Call completed", sub: "38 seconds total, clean disconnect", time: "38.0s" },
  { title: "Analysis extracted", sub: "Structured JSON from analysis prompt", time: "38.3s" },
  { title: "Webhook fired", sub: "POST to your.crm/hook with full payload", time: "38.5s" },
  { title: "Calendar updated", sub: "Old slot freed, new slot booked automatically", time: "38.8s" },
  { title: "SMS confirmation sent", sub: "Patient receives: Appt moved to Thu 10am", time: "39.0s" },
];

const transcript = [
  {
    who: "agent" as const,
    text: "Hi, this is a reminder from Dr Chen\u2019s practice. You have a dental appointment tomorrow at 2pm. Can you confirm you\u2019ll be attending?",
  },
  {
    who: "human" as const,
    text: "Oh right, tomorrow is no good actually. I have a work thing. Can we move it to Thursday?",
  },
  {
    who: "agent" as const,
    text: "Let me check Thursday for you.",
    action: "Checking calendar API\u2026",
  },
  {
    who: "agent" as const,
    text: "Thursday the 10th has a 10am slot available with Dr Chen. Shall I book that for you?",
  },
  {
    who: "human" as const,
    text: "Yes, 10am Thursday is perfect. Thanks.",
  },
  {
    who: "agent" as const,
    text: "Done. Your appointment has been moved to Thursday the 10th at 10am. You\u2019ll receive an SMS confirmation shortly. Have a great day.",
  },
];

const jsonResult = `{
  "status": "completed",
  "duration_seconds": 38,
  "answered_by": "human",
  "analysis": {
    "confirmed": false,
    "rescheduled": true,
    "new_date": "2026-04-10",
    "new_time": "10:00",
    "reason": "work conflict"
  },
  "actions_taken": [
    "calendar_check",
    "calendar_update",
    "sms_confirmation"
  ]
}`;

const apiCode = `curl -X POST https://skawk.io/api/v1/calls \\
  -H "x-api-key: sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "0412345678",
    "prompt": "Confirm dental appointment
      tomorrow 2pm with Dr Chen.
      Reschedule if needed.",
    "analysis_prompt": "Extract:
      {confirmed, rescheduled,
       new_date, new_time, reason}",
    "tools": ["calendar_check"],
    "webhook": "https://your.crm/hook"
  }'`;

// ─── Voice ───────────────────────────────────────────────────────────────────

function speak(text: string, isAgent: boolean) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = isAgent ? 1.1 : 0.85;
  const voices = window.speechSynthesis.getVoices();
  const auVoice =
    voices.find((v) => v.lang === "en-AU" && v.name.includes(isAgent ? "Female" : "Male")) ||
    voices.find((v) => v.lang === "en-AU") ||
    voices.find((v) => v.lang.startsWith("en"));
  if (auVoice) utterance.voice = auVoice;
  window.speechSynthesis.speak(utterance);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [callStatus, setCallStatus] = useState<"ringing" | "connected" | "ended" | null>(null);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);
  const voiceRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep ref in sync
  useEffect(() => {
    voiceRef.current = voiceOn;
  }, [voiceOn]);

  // Load voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase("idle");
    setCallStatus(null);
    setVisibleLines([]);
    setActiveStep(-1);
    setDoneSteps([]);
    setShowJson(false);
    setShowWebhook(false);
    setShowSummary(false);
    setElapsed("");
  }, [clearTimers]);

  const addLine = useCallback(
    (index: number) => {
      setVisibleLines((p) => [...p, index]);
      if (voiceRef.current) {
        speak(transcript[index].text, transcript[index].who === "agent");
      }
    },
    []
  );

  const play = useCallback(() => {
    reset();
    setPhase("playing");
    const d: ReturnType<typeof setTimeout>[] = [];
    let t = 0;

    // Ringing
    t += 400;
    d.push(setTimeout(() => { setCallStatus("ringing"); setElapsed("00:00"); }, t));

    // Connected + step 0
    t += 1200;
    d.push(setTimeout(() => { setCallStatus("connected"); setActiveStep(0); }, t));

    // Step 1: Agent speaks + transcript line 0
    t += 600;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 0]); setActiveStep(1); addLine(0); }, t));

    // Step 2: Patient responds + transcript line 1
    t += 1800;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 1]); setActiveStep(2); addLine(1); setElapsed("00:18"); }, t));

    // Step 3: Mid-call API + transcript line 2 (checking calendar)
    t += 1200;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 2]); setActiveStep(3); addLine(2); }, t));

    // Step 4: Agent confirms + transcript line 3
    t += 1000;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 3]); setActiveStep(4); addLine(3); }, t));

    // Transcript line 4 (patient confirms)
    t += 1200;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 4]); addLine(4); setElapsed("00:34"); }, t));

    // Transcript line 5 (agent wraps up)
    t += 800;
    d.push(setTimeout(() => { addLine(5); }, t));

    // Step 5: Call completed
    t += 1000;
    d.push(setTimeout(() => { setActiveStep(5); setCallStatus("ended"); setElapsed("00:38"); }, t));

    // Step 6: Analysis
    t += 600;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 5]); setActiveStep(6); }, t));

    // Show JSON
    t += 500;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 6]); setShowJson(true); }, t));

    // Step 7: Webhook
    t += 500;
    d.push(setTimeout(() => { setActiveStep(7); }, t));

    // Webhook delivered
    t += 400;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 7]); setShowWebhook(true); setActiveStep(8); }, t));

    // Step 8: Calendar updated
    t += 500;
    d.push(setTimeout(() => { setDoneSteps((p) => [...p, 8]); setActiveStep(9); }, t));

    // Step 9: SMS sent → done
    t += 500;
    d.push(setTimeout(() => {
      setDoneSteps((p) => [...p, 9]);
      setActiveStep(-1);
      setShowSummary(true);
      setPhase("done");
    }, t));

    timersRef.current = d;
  }, [reset, addLine]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const dotColor =
    callStatus === "ringing" ? "bg-yellow-400" : callStatus === "connected" ? "bg-green-500" : callStatus === "ended" ? "bg-primary" : "bg-transparent";
  const statusLabel =
    callStatus === "ringing" ? "Ringing" : callStatus === "connected" ? "Connected" : callStatus === "ended" ? "Completed" : "";

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#c9d1d9]">
      {/* Nav */}
      <header className="border-b border-[#21262d] sticky top-0 z-50 bg-[#0D1117]/95 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white">Skawk</Link>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="text-sm text-[#8b949e] hover:text-white transition-colors">How It Works</Link>
            <Link href="/help" className="text-sm text-[#8b949e] hover:text-white transition-colors">Help</Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold tracking-widest uppercase text-primary mb-3">See it work</p>
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-white mb-4">
            One API call. One phone call. Structured data back.
          </h1>
          <p className="text-base text-[#8b949e] max-w-[560px] mx-auto leading-relaxed">
            A dental practice sends one POST request. The AI calls the patient, handles a reschedule mid-call, and returns clean JSON. Watch.
          </p>
        </div>

        {/* Two-column demo */}
        <div className="flex gap-6 flex-wrap lg:flex-nowrap">

          {/* ── Left column: API + Transcript ── */}
          <div className="w-full lg:w-[340px] lg:shrink-0">
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-3">Your API call</p>
            <div className="bg-[#161b22] border border-[#21262d] rounded-[10px] p-3.5 font-mono text-[11px] leading-relaxed text-[#c9d1d9] mb-3 overflow-x-auto whitespace-pre-wrap">
              {apiCode}
            </div>

            {/* Call status */}
            {callStatus && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] mb-3 animate-fade-in">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${callStatus === "ringing" ? "animate-pulse" : ""}`} />
                <span className="text-xs text-[#8b949e]">
                  <strong className="text-[#c9d1d9]">{statusLabel}</strong> {elapsed}
                </span>
                <button
                  onClick={() => setVoiceOn(!voiceOn)}
                  className="ml-auto p-1 rounded hover:bg-[#21262d] transition-colors"
                  title={voiceOn ? "Mute voice" : "Enable voice"}
                >
                  {voiceOn ? (
                    <Volume2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-[#484f58]" />
                  )}
                </button>
              </div>
            )}

            <p className="text-[11px] font-bold tracking-widest uppercase text-[#00D4FF] mt-4 mb-3">Live transcript</p>
            <div className="bg-[#161b22] border border-[#21262d] rounded-[10px] p-3.5 min-h-[160px] max-h-[240px] overflow-y-auto">
              {transcript.map((line, i) => (
                <div
                  key={i}
                  className="text-xs leading-relaxed mb-1.5 transition-opacity duration-300"
                  style={{ opacity: visibleLines.includes(i) ? 1 : 0.12 }}
                >
                  <span className={`font-bold text-[11px] ${line.who === "agent" ? "text-[#00D4FF]" : "text-[#FFB830]"}`}>
                    {line.who === "agent" ? "Skawk" : "Patient"}:
                  </span>{" "}
                  <span className="text-[#c9d1d9]">{line.text}</span>
                  {"action" in line && line.action && (
                    <span className="text-[10px] font-semibold bg-green-500/10 text-green-500 px-2 py-0.5 rounded ml-1">
                      {line.action}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: Pipeline + JSON ── */}
          <div className="flex-1 min-w-[300px]">
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-3">What Skawk does</p>

            <div className="flex flex-col gap-0.5">
              {pipelineSteps.map((s, i) => {
                const isActive = activeStep === i;
                const isDone = doneSteps.includes(i);
                const isVisible = isActive || isDone;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 py-1.5 px-3 rounded-lg transition-all duration-300 ${
                      isActive ? "bg-[#00D4FF]/5" : ""
                    }`}
                    style={{ opacity: isVisible ? 1 : 0.2 }}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border transition-all duration-300 ${
                        isActive
                          ? "bg-primary border-primary text-white"
                          : isDone
                          ? "bg-[#0D1117] border-green-500 text-green-500"
                          : "bg-[#161b22] border-[#21262d] text-[#484f58]"
                      }`}
                    >
                      {isDone ? "\u2713" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#e6edf3]">{s.title}</p>
                      <p className="text-[10px] text-[#484f58]">{s.sub}</p>
                    </div>
                    <span className="text-[10px] text-[#30363d] font-mono shrink-0">{s.time}</span>
                  </div>
                );
              })}
            </div>

            {/* JSON result */}
            <div className="mt-5">
              <p className="text-[11px] font-bold tracking-widest uppercase text-green-500 mb-2.5">Structured JSON returned</p>
              <div
                className="bg-[#161b22] border border-[#21262d] rounded-[10px] p-3.5 transition-all duration-500"
                style={{
                  opacity: showJson ? 1 : 0.15,
                  transform: showJson ? "translateY(0)" : "translateY(4px)",
                }}
              >
                <pre className="font-mono text-[11px] leading-relaxed text-[#c9d1d9] whitespace-pre m-0">
                  {jsonResult}
                </pre>
              </div>
            </div>

            {/* Webhook confirmation */}
            {showWebhook && (
              <div className="mt-2 py-2.5 px-3.5 rounded-lg bg-green-500/5 border border-green-500/20 text-green-500 text-xs font-semibold text-center animate-fade-in">
                Webhook delivered to your.crm/hook &mdash; 200 OK
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={play}
            disabled={phase === "playing"}
            className={`px-8 py-3 rounded-lg text-sm font-bold text-white transition-all ${
              phase === "playing"
                ? "bg-[#30363d] cursor-default"
                : "bg-primary hover:bg-primary/90 cursor-pointer"
            }`}
          >
            {phase === "idle" ? "Send the API call" : phase === "playing" ? "Running\u2026" : "Run it again"}
          </button>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg border border-[#21262d] text-sm font-medium text-[#8b949e] hover:text-white hover:border-[#30363d] transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Summary */}
        {showSummary && (
          <p className="text-center mt-6 text-sm text-[#8b949e] leading-relaxed max-w-[600px] mx-auto animate-fade-in">
            One API call. One phone call. The patient rescheduled, the calendar updated, and an SMS went out.{" "}
            <strong className="text-primary">Structured JSON returned in 39 seconds.</strong>{" "}
            Your code never left the terminal.
          </p>
        )}
      </div>

      {/* What just happened */}
      <section className="border-t border-[#21262d] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-white mb-8 text-center">What just happened</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Phone,
                color: "text-green-500",
                bg: "bg-green-500/10",
                title: "Voice",
                desc: "An AI agent conducted a natural phone conversation \u2014 including a mid-call calendar lookup and real-time rescheduling.",
              },
              {
                icon: Brain,
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                title: "Insight",
                desc: "Structured JSON extracted from the call. Confirmation status, new date/time, reason \u2014 any schema you define.",
              },
              {
                icon: Zap,
                color: "text-yellow-400",
                bg: "bg-yellow-400/10",
                title: "Action",
                desc: "Webhook delivered, calendar updated, SMS sent. All automated. No human touched a keyboard.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mx-auto mb-3`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-[#8b949e]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-[#21262d] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-white mb-8 text-center">Works everywhere phones ring</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Dental & Medical", detail: "Appointment reminders, rescheduling, pre-visit forms" },
              { label: "Real Estate", detail: "Buyer qualification, inspection bookings, off-market alerts" },
              { label: "Solar & Energy", detail: "Lead qualification, roof type, budget extraction" },
              { label: "Debt Recovery", detail: "Promise-to-pay, compliant scripting, DNC management" },
              { label: "Recruitment", detail: "Candidate screening, availability, skill matching" },
              { label: "Insurance", detail: "Claims follow-up, renewals, quote qualification" },
            ].map((item, i) => (
              <div key={i} className="border border-[#21262d] rounded-lg p-4 hover:border-[#30363d] transition-colors">
                <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
                <p className="text-xs text-[#484f58]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#21262d] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to automate your calls?</h2>
          <p className="text-[#8b949e] mb-8">50 free calls. Full platform access. No credit card required.</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary/90 transition-all"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-[#21262d] px-8 py-4 text-base font-medium text-[#8b949e] hover:text-white hover:border-[#30363d] transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#21262d] py-8 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-[#484f58]">
          <p>&copy; 2026 CareplanAI Pty Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#8b949e] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#8b949e] transition-colors">Terms</Link>
            <Link href="mailto:hello@skawk.io" className="hover:text-[#8b949e] transition-colors">hello@skawk.io</Link>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease;
        }
      `}</style>
    </div>
  );
}
