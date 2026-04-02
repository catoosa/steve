import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)

  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const confirmation_url = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

    const { error } = await resend.emails.send({
      from: 'Skawk <hello@skawk.io>',
      to: [user.email],
      subject: 'Confirm your Skawk account',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Skawk account</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a2e;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;text-align:center;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">SKAWK</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;letter-spacing:1px;text-transform:uppercase;">AI Voice Calling Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;background:#ffffff;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.3;">
                Confirm your account
              </h1>
              <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
                Thanks for signing up to Skawk. You're one click away from automating your outbound calls with AI voice agents.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6;">
                Click the button below to confirm your email address and activate your account.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);border-radius:10px;padding:0;">
                    <a href="${confirmation_url}"
                       style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:-0.2px;">
                      Confirm my account →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Why this email -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                  <strong style="color:#374151;">Why am I receiving this?</strong><br>
                  You signed up for a Skawk account using this email address. If you didn't create an account, you can safely ignore this email — nothing will happen.
                </p>
              </div>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmation_url}" style="color:#f97316;word-break:break-all;">${confirmation_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Skawk &mdash; AI Voice Calling Platform<br>
                A product of <strong>CareplanAI Pty Ltd</strong><br>
                <a href="https://skawk.io" style="color:#f97316;text-decoration:none;">skawk.io</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:hello@skawk.io" style="color:#f97316;text-decoration:none;">hello@skawk.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      throw error
    }

    console.log('Confirmation email sent to:', user.email)
  } catch (error) {
    console.error('Error in send-confirmation-email:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
