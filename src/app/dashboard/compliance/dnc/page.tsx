import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DNCManager } from './dnc-manager'
import { ShieldAlert } from 'lucide-react'

export default async function DNCPage() {
  const userClient = await createClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) redirect('/login')

  const supabase = createServiceClient()

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const dncNumbers = membership
    ? await supabase
        .from('dnc_numbers')
        .select('*')
        .eq('org_id', membership.org_id)
        .order('created_at', { ascending: false })
        .then(({ data }) => data ?? [])
    : []

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Do Not Call List{' '}
            <span className="ml-2 text-base font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
              {dncNumbers.length}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage numbers that should never be called by your campaigns.
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
        <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Numbers on this list are automatically excluded from all campaigns before launch.
          Numbers are also added automatically when a call ends with a <strong className="text-foreground">DO_NOT_CALL</strong> disposition.
        </p>
      </div>

      <DNCManager initialNumbers={dncNumbers} />
    </div>
  )
}
