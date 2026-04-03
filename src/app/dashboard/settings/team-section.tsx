"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Trash2, X, Clock } from "lucide-react";
import InviteForm from "./invite-form";

type Member = {
  user_id: string;
  role: string;
  email: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
};

export default function TeamSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/team/members");
    if (!res.ok) return;
    const data = await res.json();
    setMembers(data.members ?? []);
    setInvitations(data.invitations ?? []);
    setOrgId(data.orgId ?? "");
    setCurrentUserId(data.currentUserId ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canManage = ["owner", "admin"].includes(currentMember?.role ?? "");

  async function handleRemove(userId: string) {
    setRemovingUserId(userId);
    const res = await fetch("/api/team/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    }
    setRemovingUserId(null);
  }

  async function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    const res = await fetch("/api/team/revoke", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });

    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    }
    setRevokingId(null);
  }

  function roleBadgeClass(role: string) {
    switch (role) {
      case "owner":
        return "bg-primary/20 text-primary";
      case "admin":
        return "bg-blue-500/20 text-blue-400";
      case "viewer":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  function formatExpiry(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-xl p-6 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Team Members</h2>
        </div>
        <p className="text-sm text-muted-foreground">Loading team...</p>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6 space-y-6 mt-8">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Team Members</h2>
      </div>

      {/* Current members */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Members ({members.length})
        </h3>
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0 uppercase">
                  {(member.email ?? "?")[0]}
                </div>
                <span className="text-sm truncate">{member.email ?? member.user_id}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeClass(member.role)}`}
                >
                  {member.role}
                </span>
                {canManage &&
                  member.user_id !== currentUserId &&
                  member.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={removingUserId === member.user_id}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Pending Invitations ({invitations.length})
          </h3>
          <ul className="space-y-2">
            {invitations.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm truncate block">{invite.email}</span>
                    <span className="text-xs text-muted-foreground">
                      Expires {formatExpiry(invite.expires_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeClass(invite.role)}`}
                  >
                    {invite.role}
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(invite.id)}
                      disabled={revokingId === invite.id}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Revoke invitation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite form */}
      {canManage && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Invite a Member</h3>
          <InviteForm onInvited={loadData} />
        </div>
      )}

      {!canManage && !loading && (
        <p className="text-sm text-muted-foreground">
          Only owners and admins can invite or remove members.
        </p>
      )}
    </div>
  );
}
