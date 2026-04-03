import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import AcceptInviteClient from "./accept-invite-client";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login");
  }

  // Look up invitation (use service client to bypass RLS complications with anon)
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  const { data: invitation, error } = await serviceClient
    .from("org_invitations")
    .select("id, org_id, email, role, accepted_at, expires_at, organizations(name)")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Invalid Invitation</h1>
          <p className="text-white/60 mb-6">
            This invitation link is invalid or has already been used.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (invitation.accepted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Already Accepted</h1>
          <p className="text-white/60 mb-6">
            This invitation has already been accepted.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (invitation.expires_at < now) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Invitation Expired</h1>
          <p className="text-white/60 mb-6">
            This invitation has expired. Please ask your team to send a new invite.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Check if there's a logged-in user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const org = invitation.organizations as unknown as { name: string } | null;
  const orgName = org?.name ?? "the organization";

  return (
    <AcceptInviteClient
      token={token}
      invitationId={invitation.id}
      orgName={orgName}
      role={invitation.role}
      invitedEmail={invitation.email}
      isLoggedIn={!!user}
      loggedInEmail={user?.email ?? null}
    />
  );
}
