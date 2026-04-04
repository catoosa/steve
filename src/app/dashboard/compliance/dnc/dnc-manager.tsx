'use client'

import { useState, useTransition } from 'react'
import { Trash2, Plus, Download } from 'lucide-react'

interface DNCNumber {
  id: string
  phone: string
  reason: string | null
  source: string
  created_at: string
}

interface DNCManagerProps {
  initialNumbers: DNCNumber[]
}

export function DNCManager({ initialNumbers }: DNCManagerProps) {
  const [numbers, setNumbers] = useState<DNCNumber[]>(initialNumbers)
  const [textarea, setTextarea] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleAdd() {
    setError(null)
    setSuccessMsg(null)
    const phones = textarea
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (phones.length === 0) {
      setError('Enter at least one phone number.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/dnc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phones, reason: reason || undefined }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Failed to add numbers')
          return
        }
        // Refresh list
        const listRes = await fetch('/api/dnc')
        const listJson = await listRes.json()
        setNumbers(listJson.data ?? [])
        setTextarea('')
        setReason('')
        setSuccessMsg(`${json.added} number(s) added to DNC list.`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    })
  }

  async function handleRemove(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/dnc/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error || 'Failed to remove')
          return
        }
        setNumbers((prev) => prev.filter((n) => n.id !== id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="bg-background border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Add Numbers</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Phone numbers (one per line)
            </label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={"+61400000000\n+61411111111\n+1234567890"}
              value={textarea}
              onChange={(e) => setTextarea(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Reason (optional)
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Customer request, opt-out"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {successMsg && (
            <p className="text-sm text-success">{successMsg}</p>
          )}
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isPending ? 'Adding...' : 'Add to DNC'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">
            DNC Numbers{' '}
            <span className="ml-1.5 text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {numbers.length}
            </span>
          </h2>
          <a
            href="/api/dnc/export"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </a>
        </div>

        {numbers.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">
            No numbers on the DNC list yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {numbers.map((n) => (
              <div
                key={n.id}
                className="px-6 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-sm">{n.phone}</span>
                  {n.reason && (
                    <span className="text-sm text-muted-foreground truncate">
                      {n.reason}
                    </span>
                  )}
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                    {n.source}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRemove(n.id)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    title="Remove from DNC"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
