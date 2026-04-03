"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Megaphone, BarChart2, X } from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "Create AI Personas",
    description: "Build named agents with custom voices and personalities",
  },
  {
    icon: Megaphone,
    title: "Launch Campaigns",
    description: "Upload contacts and let AI handle thousands of calls",
  },
  {
    icon: BarChart2,
    title: "Analyse Results",
    description: "Emotion analysis, dispositions, A/B testing built in",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const welcomed = localStorage.getItem("skawk_welcomed");
    if (!welcomed) {
      setOpen(true);
    }
  }, []);

  function close() {
    localStorage.setItem("skawk_welcomed", "true");
    setOpen(false);
  }

  function handleGetStarted() {
    close();
    router.push("/dashboard/campaigns/new");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close welcome modal"
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-primary mb-1">Welcome to Skawk</h2>
            <p className="text-sm text-muted-foreground">AI-powered calling campaigns in minutes</p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mb-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleGetStarted}
              className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started
            </button>
            <button
              onClick={close}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
