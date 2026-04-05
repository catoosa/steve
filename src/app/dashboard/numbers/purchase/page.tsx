"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Loader2 } from "lucide-react";

const COUNTRIES = [
  { code: "AU", label: "Australia (+61)" },
  { code: "US", label: "United States (+1)" },
  { code: "GB", label: "United Kingdom (+44)" },
];

export default function PurchaseNumberPage() {
  const router = useRouter();
  const [country, setCountry] = useState("AU");
  const [areaCode, setAreaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode, country }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to purchase number");
      }

      // Redirect to the configure page for the new number
      const numberId =
        data.id || data.phone_number_id || data.number_id || "";
      if (numberId) {
        router.push(`/dashboard/numbers/${numberId}`);
      } else {
        router.push("/dashboard/numbers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link
        href="/dashboard/numbers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Numbers
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Purchase Number</h1>
          <p className="text-sm text-muted-foreground">
            Buy a new inbound phone number for AI-answered calls.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Area Code</label>
          <input
            type="text"
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value)}
            placeholder="e.g. 02, 415, 020"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Enter the area code for the region you want a number in.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Phone numbers incur a monthly fee. Charges will appear on your
            next billing cycle.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !areaCode}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Purchasing..." : "Purchase Number"}
        </button>
      </form>
    </div>
  );
}
