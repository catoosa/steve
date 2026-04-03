"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";

type Props = {
  token: string;
  invitationId: string;
  orgName: string;
  role: string;
  invitedEmail: string;
  isLoggedIn: boolean;
  loggedInEmail: string | null;
};

export default function AcceptInviteClient({
  token,
  orgName,
  role,
  invitedEmail,
  isLoggedIn,
  loggedInEmail,
}: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to accept invitation.");
      setAccepting(false);
      return;
    }

    router.push("/dashboard");
  }

  const roleLabelMap: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/skawk-logo.png"
              alt="Skawk"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto"
            />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mx-auto">
            <Users className="w-7 h-7 text-primary" />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold mb-1">You&apos;re invited</h1>
            <p className="text-sm text-muted-foreground">
              Join <strong className="text-foreground">{orgName}</strong> as a{" "}
              <strong className="text-foreground">{roleLabelMap[role] ?? role}</strong>
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
              {error}
            </div>
          )}

          {isLoggedIn ? (
            <div className="space-y-3">
              {loggedInEmail && (
                <p className="text-xs text-muted-foreground text-center">
                  Accepting as <strong className="text-foreground">{loggedInEmail}</strong>
                </p>
              )}
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all glow-orange"
              >
                {accepting ? "Accepting..." : "Accept Invitation"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                You need to be signed in to accept this invitation.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                This invite is for <strong className="text-foreground">{invitedEmail}</strong>.
                Sign in with that email or create a new account, then return to this link.
              </p>
              <Link
                href={`/login?redirect=/accept-invite?token=${encodeURIComponent(token)}`}
                className="block w-full text-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all glow-orange"
              >
                Sign In
              </Link>
              <Link
                href={`/signup?redirect=/accept-invite?token=${encodeURIComponent(token)}`}
                className="block w-full text-center rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                Create an Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
