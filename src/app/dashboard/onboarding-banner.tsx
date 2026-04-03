"use client";

import Link from "next/link";
import { Check, Circle, X } from "lucide-react";
import { useState, useEffect } from "react";

interface OnboardingBannerProps {
  hasPersona: boolean;
  hasCampaign: boolean;
}

export function OnboardingBanner({ hasPersona, hasCampaign }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    const isDismissed = localStorage.getItem("skawk_onboarding_dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  if (dismissed) return null;

  const steps = [
    {
      done: true,
      label: "Account created",
      link: null,
    },
    {
      done: hasPersona,
      label: "Create your first AI persona",
      link: "/dashboard/personas/new",
    },
    {
      done: hasCampaign,
      label: "Launch your first campaign",
      link: "/dashboard/campaigns/new",
    },
  ];

  function handleDismiss() {
    localStorage.setItem("skawk_onboarding_dismissed", "true");
    setDismissed(true);
  }

  return (
    <div className="relative mb-8 rounded-2xl bg-card border border-border overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />

      <div className="pl-6 pr-4 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-base font-semibold mb-3">Get started with Skawk</h2>
            <div className="flex flex-wrap gap-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {step.done ? (
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Circle className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span
                    className={`text-sm ${
                      step.done ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.done || !step.link ? (
                      step.label
                    ) : (
                      <Link
                        href={step.link}
                        className="text-primary hover:underline font-medium"
                      >
                        {step.label}
                      </Link>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss onboarding banner"
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
