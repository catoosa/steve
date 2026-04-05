import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email: string; role: "admin" | "member" | "viewer" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  if (!["admin", "member", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Look up user's org and org name
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const orgId = membership.org_id;
  const org = membership.organizations as unknown as { id: string; name: string } | null;
  const orgName = org?.name ?? "your organization";

  // Check for existing pending invite for this email+org
  const { data: existingInvite } = await supabase
    .from("org_invitations")
    .select("id")
    .eq("org_id", orgId)
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      { error: "A pending invitation already exists for this email address." },
      { status: 409 }
    );
  }

  // Check if user is already a member
  const serviceClient = createServiceClient();
  const { data: existingUser } = await serviceClient.auth.admin.listUsers();
  const inviteeUser = (existingUser?.users as { id: string; email?: string }[] | undefined)?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (inviteeUser) {
    const { data: existingMember } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", inviteeUser.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a member of your organization." },
        { status: 409 }
      );
    }
  }

  // Insert invitation
  const { data: invitation, error: insertError } = await supabase
    .from("org_invitations")
    .insert({
      org_id: orgId,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
    })
    .select("id, token")
    .single();

  if (insertError || !invitation) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create invitation" },
      { status: 500 }
    );
  }

  const inviterName = user.email ?? "A teammate";
  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.skawk.io"}/accept-invite?token=${invitation.token}`;

  // Send invite email via Resend
  await getResend().emails.send({
    from: "Skawk <hello@skawk.io>",
    to: email,
    subject: `${inviterName} has invited you to join ${orgName} on Skawk`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Logo area -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Skawk</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:40px;">
              <p style="margin:0 0 8px;font-size:14px;color:#888888;text-transform:uppercase;letter-spacing:1px;">You're invited</p>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
                Join ${orgName} on Skawk
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#aaaaaa;line-height:1.6;">
                <strong style="color:#ffffff;">${inviterName}</strong> has invited you to join
                <strong style="color:#ffffff;">${orgName}</strong> as a <strong style="color:#ffffff;">${role}</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#666666;line-height:1.6;">
                Skawk is an AI voice calling platform. Once you accept, you'll have access to the team's campaigns and call data.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#f97316;border-radius:10px;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#555555;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#444444;word-break:break-all;">
                <a href="${acceptUrl}" style="color:#f97316;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#444444;">
                This invitation expires in 7 days. If you didn't expect this email, you can ignore it.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#333333;">
                &copy; ${new Date().getFullYear()} Skawk &mdash; skawk.io
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });

  return NextResponse.json({ success: true });
}
