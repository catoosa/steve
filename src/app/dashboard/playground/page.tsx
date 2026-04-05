"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Phone,
  PhoneOff,
  Bot,
  User,
  Loader2,
  Zap,
  FileJson,
  Lightbulb,
} from "lucide-react";

interface Message {
  role: "agent" | "caller";
  content: string;
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("You are calling to confirm a dental appointment tomorrow at 2pm with Dr Chen. If the patient can't make it, offer to reschedule. Check the calendar for available times.");
  const [firstSentence, setFirstSentence] = useState("Hi, this is a reminder call from Dr Chen's dental practice. You have an appointment tomorrow at 2pm — are you still able to make it?");
  const [analysisPrompt, setAnalysisPrompt] = useState('{"confirmed": boolean, "rescheduled": boolean, "new_date": string or null, "new_time": string or null, "reason": string or null}');
  const [callerPersona, setCallerPersona] = useState("A busy professional who might need to reschedule. Be natural and a bit distracted.");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function step(currentMessages: Message[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          first_sentence: firstSentence,
          analysis_prompt: analysisPrompt,
          caller_persona: callerPersona,
          messages: currentMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newMessages = data.messages || [...currentMessages, { role: data.role, content: data.content }];
      setMessages(newMessages);

      if (data.done) {
        setDone(true);
        if (data.analysis) setAnalysis(data.analysis);
      }

      return { messages: newMessages, done: data.done };
    } catch (err) {
      console.error("Playground error:", err);
      return { messages: currentMessages, done: true };
    } finally {
      setLoading(false);
    }
  }

  async function startCall() {
    setMessages([]);
    setDone(false);
    setAnalysis(null);

    // Get first agent message
    const result = await step([]);
    if (!result || result.done) return;

    if (autoPlay) {
      await runConversation(result.messages);
    }
  }

  async function runConversation(currentMessages: Message[]) {
    let msgs = currentMessages;
    let finished = false;
    let turns = 0;

    while (!finished && turns < 12) {
      // Small delay between turns for readability
      await new Promise((r) => setTimeout(r, 600));

      const result = await step(msgs);
      if (!result) break;
      msgs = result.messages;
      finished = result.done;
      turns++;
    }

    if (!finished) {
      setDone(true);
    }
  }

  async function nextTurn() {
    if (done || loading) return;
    const result = await step(messages);
    if (result && !result.done && autoPlay) {
      await new Promise((r) => setTimeout(r, 600));
      await step(result.messages);
    }
  }

  function reset() {
    setMessages([]);
    setDone(false);
    setAnalysis(null);
  }

  const isActive = messages.length > 0 && !done;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Call Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test your prompts without making real calls. Free. Unlimited.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Config */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">Agent Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="You are calling to..."
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">First Sentence</label>
            <input
              type="text"
              value={firstSentence}
              onChange={(e) => setFirstSentence(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Hi, this is..."
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">Analysis Prompt</label>
            <textarea
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder='{"field": "type", ...}'
            />
            <p className="text-[10px] text-muted-foreground mt-1">Extracted as JSON when the call ends</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Caller Persona (who picks up)</label>
            <textarea
              value={callerPersona}
              onChange={(e) => setCallerPersona(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="A busy professional who..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button
                type="button"
                onClick={() => setAutoPlay(!autoPlay)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoPlay ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoPlay ? "left-5" : "left-0.5"}`} />
              </button>
              Auto-play full conversation
            </label>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isActive && !done && (
              <button
                onClick={startCall}
                disabled={loading || !prompt}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {loading ? "Connecting..." : "Start Call"}
              </button>
            )}
            {isActive && !autoPlay && (
              <button
                onClick={nextTurn}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Next Turn
              </button>
            )}
            {(isActive || done) && (
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Right: Conversation */}
        <div className="space-y-4">
          {/* Call status */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg">
              {isActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-600">Call in progress</span>
                  {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
                </>
              ) : done ? (
                <>
                  <PhoneOff className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Call ended &middot; {messages.length} turns</span>
                </>
              ) : null}
            </div>
          )}

          {/* Transcript */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Live Transcript</span>
            </div>
            <div ref={scrollRef} className="p-4 space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lightbulb className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Configure your prompt and hit Start Call
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    No real calls made. No cost. Iterate until it&apos;s perfect.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-3" style={{ animation: "fadeSlideIn 0.3s ease" }}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "agent" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {msg.role === "agent" ? (
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-muted-foreground">
                      {msg.role === "agent" ? "Agent" : "Caller"}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {messages.length > 0 && messages[messages.length - 1].role === "agent" ? "Caller thinking..." : "Agent responding..."}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Result */}
          {analysis && (
            <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ animation: "fadeSlideIn 0.5s ease" }}>
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <FileJson className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold">Extracted Analysis</span>
              </div>
              <pre className="p-4 text-xs font-mono text-green-600 overflow-x-auto bg-green-500/5">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
