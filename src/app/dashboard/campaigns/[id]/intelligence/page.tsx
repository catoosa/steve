"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Brain,
  AlertTriangle,
  Zap,
  Users,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface IntelligenceReport {
  summary?: string;
  sentiment_breakdown?: { positive: number; neutral: number; negative: number };
  objections?: Array<{ text: string; frequency: number; example_quote: string }>;
  winning_phrases?: Array<{ phrase: string; context: string; frequency: number }>;
  contact_archetypes?: Array<{ name: string; description: string; percentage: number }>;
  recommendations?: string[];
  generated_at?: string;
  cached?: boolean;
  call_count?: number;
  error?: string;
}

export default function IntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  async function fetchIntelligence(force = false) {
    const setter = force ? setRegenerating : setLoading;
    setter(true);
    setError("");
    try {
      const res = await fetch(`/api/campaigns/${id}/intelligence${force ? "?force=true" : ""}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate intelligence");
        setReport(null);
      } else {
        setReport(data);
      }
    } catch {
      setError("Failed to connect");
    } finally {
      setter(false);
    }
  }

  useEffect(() => {
    fetchIntelligence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sentiment = report?.sentiment_breakdown;
  const sentimentTotal = sentiment ? sentiment.positive + sentiment.neutral + sentiment.negative : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/campaigns/${id}`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Campaign Intelligence
            </h1>
            {report?.generated_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Generated {new Date(report.generated_at).toLocaleString()}
                {report.cached && " (cached)"}
                {report.call_count && ` · ${report.call_count} calls analysed`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchIntelligence(true)}
          disabled={regenerating || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-3" />
              <div className="h-3 bg-muted rounded animate-pulse w-full mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
            AI is reading all your call transcripts...
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Not enough data yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Report */}
      {report && !loading && !error && (
        <div className="space-y-5">
          {/* Summary */}
          {report.summary && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" /> Executive Summary
              </h2>
              <p className="text-base leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Sentiment */}
          {sentiment && sentimentTotal > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Sentiment Breakdown
              </h2>
              <div className="flex h-6 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${(sentiment.positive / sentimentTotal) * 100}%` }}
                />
                <div
                  className="bg-gray-400 transition-all duration-500"
                  style={{ width: `${(sentiment.neutral / sentimentTotal) * 100}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${(sentiment.negative / sentimentTotal) * 100}%` }}
                />
              </div>
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Positive {sentiment.positive}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gray-400" />
                  Neutral {sentiment.neutral}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Negative {sentiment.negative}%
                </span>
              </div>
            </div>
          )}

          {/* Objections */}
          {report.objections && report.objections.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Top Objections
              </h2>
              <div className="space-y-4">
                {report.objections.map((obj, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{obj.text}</span>
                      <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                        {obj.frequency}x
                      </span>
                    </div>
                    {obj.example_quote && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 italic">
                        &ldquo;{obj.example_quote}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winning Phrases */}
          {report.winning_phrases && report.winning_phrases.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Winning Phrases
              </h2>
              <div className="space-y-4">
                {report.winning_phrases.map((phrase, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">&ldquo;{phrase.phrase}&rdquo;</span>
                      <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                        {phrase.frequency}x
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{phrase.context}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archetypes */}
          {report.contact_archetypes && report.contact_archetypes.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Contact Archetypes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.contact_archetypes.map((arch, i) => (
                  <div key={i} className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{arch.name}</span>
                      <span className="text-xs font-bold text-primary">{arch.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full mb-2">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${arch.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{arch.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Recommendations
              </h2>
              <ol className="space-y-3">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed">{rec}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
