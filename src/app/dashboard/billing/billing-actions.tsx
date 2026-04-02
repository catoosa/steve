"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, Loader2, Settings } from "lucide-react";

export function SuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.replace("/dashboard/billing");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!success) return null;

  return (
    <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-8 flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-success shrink-0" />
      <div>
        <p className="font-medium text-success">Subscription activated!</p>
        <p className="text-sm text-muted-foreground">
          Your plan has been upgraded. Changes may take a moment to reflect.
        </p>
      </div>
    </div>
  );
}

export function UpgradeButton({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);

  if (plan === "enterprise") {
    return (
      <a
        href="mailto:hello@skawk.io"
        className="block w-full text-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        Contact Sales
      </a>
    );
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          Upgrade <ArrowRight className="w-3.5 h-3.5" />
        </>
      )}
    </button>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Settings className="w-4 h-4" />
          Manage Subscription
        </>
      )}
    </button>
  );
}
