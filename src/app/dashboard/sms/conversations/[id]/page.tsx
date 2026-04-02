"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";

interface Message {
  id?: string;
  role: "sent" | "received" | "outbound" | "inbound";
  content: string;
  text?: string;
  message?: string;
  created_at?: string;
  timestamp?: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchConversation() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sms/conversations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load conversation");

      // Normalize messages from different possible response shapes
      const msgs: Message[] = Array.isArray(data.messages)
        ? data.messages
        : Array.isArray(data)
        ? data
        : data.data ?? [];

      setMessages(msgs);
      setPhone(
        String(data.phone_number || data.to || data.phone || "Unknown")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");

      // Optimistic update
      setMessages((prev) => [
        ...prev,
        { role: "sent", content: reply, created_at: new Date().toISOString() },
      ]);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`/api/sms/conversations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            "Summarize this SMS conversation. What was discussed? What is the outcome? Are there any action items?",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(
        typeof data === "string"
          ? data
          : data.analysis || data.summary || JSON.stringify(data)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function isSent(msg: Message) {
    return msg.role === "sent" || msg.role === "outbound";
  }

  function getMessageText(msg: Message) {
    return msg.content || msg.text || msg.message || "";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/dashboard/sms"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold font-mono">{phone}</h1>
          <p className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || messages.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Analyze
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-xs">AI Analysis</span>
          </div>
          <p className="text-muted-foreground">{analysis}</p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 py-4 px-2"
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages in this conversation.
          </p>
        )}
        {messages.map((msg, i) => {
          const sent = isSent(msg);
          const text = getMessageText(msg);
          const time = msg.created_at || msg.timestamp;
          return (
            <div
              key={msg.id || i}
              className={`flex ${sent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  sent
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%] ml-auto"
                    : "bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]"
                }
              >
                <p className="text-sm">{text}</p>
                {time && (
                  <p
                    className={`text-[10px] mt-1 ${
                      sent
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(time).toLocaleTimeString("en-AU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      <form
        onSubmit={handleReply}
        className="flex items-center gap-3 pt-4 border-t border-border"
      >
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="rounded-lg bg-primary p-2.5 text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
