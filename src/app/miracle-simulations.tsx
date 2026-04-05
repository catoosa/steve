"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio,
  Phone,
  PhoneCall,
  Brain,
  Zap,
  AlertTriangle,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Play,
  RefreshCw,
} from "lucide-react";

// ─── Miracle 1: Live Monitor Simulation ──────────────────────────────────────

const SIMULATED_CALLS = [
  { phone: "+61 412 ***", name: "Margaret W.", campaign: "Post-Discharge", status: "in_progress", duration: 0, sentiment: "neutral" },
  { phone: "+61 498 ***", name: "David Chen", campaign: "Solar Leads", status: "in_progress", duration: 0, sentiment: "positive" },
  { phone: "+61 411 ***", name: "Sarah K.", campaign: "Appointment Reminder", status: "ringing", duration: 0, sentiment: "neutral" },
  { phone: "+61 423 ***", name: "James O.", campaign: "Post-Discharge", status: "in_progress", duration: 0, sentiment: "positive" },
  { phone: "+61 456 ***", name: "Priya M.", campaign: "Solar Leads", status: "ringing", duration: 0, sentiment: "neutral" },
];

const LIVE_EVENTS = [
  { type: "connected", phone: "+61 411 ***", name: "Sarah K." },
  { type: "sentiment", phone: "+61 412 ***", name: "Margaret W.", sentiment: "anxious" },
  { type: "completed", phone: "+61 498 ***", name: "David Chen", disposition: "INTERESTED", duration: 42 },
  { type: "connected", phone: "+61 456 ***", name: "Priya M." },
  { type: "escalation", phone: "+61 412 ***", name: "Margaret W.", reason: "Pain level 8/10" },
  { type: "completed", phone: "+61 411 ***", name: "Sarah K.", disposition: "CONFIRMED", duration: 28 },
  { type: "completed", phone: "+61 423 ***", name: "James O.", disposition: "FOLLOW_UP", duration: 55 },
];

function LiveMonitorSim() {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<typeof LIVE_EVENTS>([]);
  const [activeCount, setActiveCount] = useState(5);
  const [completedCount, setCompletedCount] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setRunning(false);
    setEvents([]);
    setActiveCount(5);
    setCompletedCount(0);
  }, []);

  const start = useCallback(() => {
    reset();
    setRunning(true);
    LIVE_EVENTS.forEach((event, i) => {
      const t = setTimeout(() => {
        setEvents((prev) => [event, ...prev]);
        if (event.type === "completed") {
          setActiveCount((c) => Math.max(0, c - 1));
          setCompletedCount((c) => c + 1);
        }
      }, (i + 1) * 1200);
      timersRef.current.push(t);
    });
    const tDone = setTimeout(() => setRunning(false), LIVE_EVENTS.length * 1200 + 500);
    timersRef.current.push(tDone);
  }, [reset]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-[10px] text-white/40">Active</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{completedCount}</p>
          <p className="text-[10px] text-white/40">Completed</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-accent">{completedCount > 0 ? `${Math.round((completedCount / (completedCount + activeCount)) * 100)}%` : "0%"}</p>
          <p className="text-[10px] text-white/40">Answer Rate</p>
        </div>
      </div>

      {/* Event Feed */}
      <div className="space-y-1.5 min-h-[200px] max-h-[240px] overflow-hidden">
        {events.length === 0 && !running && (
          <div className="text-center py-8">
            <Radio className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">Press play to simulate live calls</p>
          </div>
        )}
        {events.map((event, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs"
            style={{ animation: "fadeSlideIn 0.3s ease" }}
          >
            {event.type === "connected" && (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Phone className="w-3 h-3 text-green-400" />
                <span className="text-white/70"><strong className="text-white">{event.name}</strong> connected</span>
              </>
            )}
            {event.type === "sentiment" && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <AlertTriangle className="w-3 h-3 text-yellow-400" />
                <span className="text-white/70"><strong className="text-white">{event.name}</strong> sentiment: <span className="text-yellow-400">{event.sentiment}</span></span>
              </>
            )}
            {event.type === "completed" && (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                <span className="text-white/70"><strong className="text-white">{event.name}</strong> &middot; {event.disposition} &middot; {event.duration}s</span>
              </>
            )}
            {event.type === "escalation" && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-white/70"><strong className="text-red-400">{event.name}</strong> ESCALATION: {event.reason}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        onClick={running ? reset : start}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors"
      >
        {running ? <><RefreshCw className="w-4 h-4" /> Reset</> : <><Play className="w-4 h-4" /> Simulate Live Calls</>}
      </button>
    </div>
  );
}

// ─── Miracle 2: Intelligence Simulation ──────────────────────────────────────

function IntelligenceSim() {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {!visible ? (
        <div className="text-center py-6">
          <Brain className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-xs text-white/30 mb-4">AI analyses all call transcripts and generates insights</p>
          <button
            onClick={() => setVisible(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <Brain className="w-4 h-4" /> Generate Intelligence Report
          </button>
        </div>
      ) : (
        <div className="space-y-3" style={{ animation: "fadeSlideIn 0.5s ease" }}>
          {/* Summary */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Executive Summary</p>
            <p className="text-xs text-white/70 leading-relaxed">
              Campaign achieved 68% answer rate across 247 calls. Primary objection was timing/scheduling conflicts (34%). Agent phrases emphasising flexibility and same-day booking showed 2.4x higher conversion. Recommend adding a &ldquo;best time to call back&rdquo; extraction field.
            </p>
          </div>

          {/* Sentiment bar */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Sentiment</p>
            <div className="flex h-3 rounded-full overflow-hidden mb-1.5">
              <div className="bg-green-500" style={{ width: "52%" }} />
              <div className="bg-gray-500" style={{ width: "31%" }} />
              <div className="bg-red-500" style={{ width: "17%" }} />
            </div>
            <div className="flex gap-4 text-[10px] text-white/50">
              <span>Positive 52%</span>
              <span>Neutral 31%</span>
              <span>Negative 17%</span>
            </div>
          </div>

          {/* Objections */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Top Objections</p>
            {[
              { text: "Bad timing / too busy", freq: 34, quote: "Now isn't a great time, can you call back?" },
              { text: "Already have a provider", freq: 22, quote: "We're already sorted with someone else" },
              { text: "Need to discuss with partner", freq: 18, quote: "I'd need to talk to my wife first" },
            ].map((obj, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80 font-medium">{obj.text}</span>
                  <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{obj.freq}%</span>
                </div>
                <p className="text-[10px] text-white/30 italic mt-0.5">&ldquo;{obj.quote}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Winning Phrases */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Winning Phrases</p>
            {[
              { phrase: "I can check availability right now", why: "Reduces friction, leads to 2.4x more bookings" },
              { phrase: "Would mornings or afternoons work better?", why: "Choice framing increases commitment" },
            ].map((p, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <p className="text-xs text-green-400 font-medium">&ldquo;{p.phrase}&rdquo;</p>
                <p className="text-[10px] text-white/40">{p.why}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setVisible(false)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-medium text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Miracle 3: ROI Simulation ───────────────────────────────────────────────

function RoiSim() {
  const [calls, setCalls] = useState(500);
  const costPerCall = 0.35;
  const humanCostPerCall = 4.0; // $30/hr ÷ 7.5 calls/hr
  const skawkCost = calls * costPerCall;
  const humanCost = calls * humanCostPerCall;
  const savings = humanCost - skawkCost;
  const roi = skawkCost > 0 ? Math.round((savings / skawkCost) * 100) : 0;
  const humanDays = Math.ceil(calls / 60);

  return (
    <div>
      {/* Slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/50">Monthly calls</p>
          <p className="text-sm font-bold text-white">{calls.toLocaleString()}</p>
        </div>
        <input
          type="range"
          min={50}
          max={10000}
          step={50}
          value={calls}
          onChange={(e) => setCalls(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #e85d04 ${(calls / 10000) * 100}%, rgba(255,255,255,0.1) 0%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-white/30 mt-1">
          <span>50</span>
          <span>10,000</span>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-white/40 mb-1">Human Team</p>
          <p className="text-xl font-bold text-white">${humanCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-white/30">{humanDays} days @ $30/hr</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <p className="text-[10px] text-primary mb-1">Skawk</p>
          <p className="text-xl font-bold text-primary">${skawkCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-white/30">Done in minutes</p>
        </div>
      </div>

      {/* Savings */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
        <p className="text-[10px] text-green-400 uppercase tracking-wider font-bold mb-1">You save</p>
        <p className="text-3xl font-black text-green-400">
          ${savings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-green-400/60 mt-1">{roi}% ROI</p>
      </div>

      {/* Fine print */}
      <p className="text-[10px] text-white/20 mt-3 text-center leading-relaxed">
        Based on $30/hr human caller making 60 calls/day vs Skawk at $0.35/call avg.
      </p>
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function MiracleSimulations() {
  return (
    <section className="py-24 px-6 bg-[#0D1117]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">See what&apos;s possible</p>
          <h2 className="text-4xl font-black text-white mb-4">Three things no one else can do</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            These aren&apos;t mockups. These are live simulations of real dashboard features. Every Skawk user gets this on day one.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Monitor */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#21262d] flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-white">Live Call Monitor</span>
              <span className="ml-auto text-[10px] text-white/30">Real-time</span>
            </div>
            <div className="p-5">
              <LiveMonitorSim />
            </div>
          </div>

          {/* Intelligence */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#21262d] flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Campaign Intelligence</span>
              <span className="ml-auto text-[10px] text-white/30">AI-powered</span>
            </div>
            <div className="p-5">
              <IntelligenceSim />
            </div>
          </div>

          {/* ROI */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#21262d] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-white">ROI Calculator</span>
              <span className="ml-auto text-[10px] text-white/30">Interactive</span>
            </div>
            <div className="p-5">
              <RoiSim />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e85d04;
          cursor: pointer;
          border: 2px solid #0D1117;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e85d04;
          cursor: pointer;
          border: 2px solid #0D1117;
        }
      `}</style>
    </section>
  );
}
