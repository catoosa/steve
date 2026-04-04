'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  total: number
  completed: number
  answered: number
  inProgress: number
  queued: number
}

interface LiveStatsProps {
  campaignId: string
  campaignStatus: string
  initialStats: Stats
}

export function LiveStats({ campaignId, campaignStatus, initialStats }: LiveStatsProps) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [isLive, setIsLive] = useState(campaignStatus === 'active')

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/stats`)
      if (!res.ok) return
      const data = await res.json()
      setStats({
        total: data.total ?? 0,
        completed: data.completed ?? 0,
        answered: data.answered ?? 0,
        inProgress: data.in_progress ?? 0,
        queued: data.queued ?? 0,
      })
    } catch {
      // silently ignore refresh errors
    }
  }, [campaignId])

  useEffect(() => {
    if (campaignStatus !== 'active') return

    const supabase = createClient()

    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          refreshStats()
        }
      )
      .subscribe()

    return () => {
      setIsLive(false)
      supabase.removeChannel(channel)
    }
  }, [campaignId, campaignStatus, refreshStats])

  const answerRate =
    stats.completed > 0
      ? Math.round((stats.answered / stats.completed) * 100)
      : 0

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {/* In Progress — large counter with live indicator */}
      <div className="bg-background border border-border rounded-xl p-4 col-span-1">
        <div className="flex items-center gap-2 mb-1">
          {isLive && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
          )}
          <p className="text-sm text-muted-foreground">
            {isLive ? 'Live — In Progress' : 'In Progress'}
          </p>
        </div>
        <p className="text-xl font-bold mt-1">
          {stats.inProgress + stats.queued}
        </p>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Calls Completed</p>
        <p className="text-xl font-bold mt-1">{stats.completed}</p>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Calls Answered</p>
        <p className="text-xl font-bold mt-1">{stats.answered}</p>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Answer Rate</p>
        <p className="text-xl font-bold mt-1">
          {stats.completed > 0 ? `${answerRate}%` : '—'}
        </p>
      </div>
    </div>
  )
}
