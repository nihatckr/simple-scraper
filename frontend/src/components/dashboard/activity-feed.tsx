'use client'

import { useEffect, useState } from 'react'
import { RecentActivity } from './recent-activity'
import { useDashboardPolling } from '@/hooks/use-polling'
import { statsApi } from '@/lib/api'
import { Product } from '@/lib/types'

interface ActivityFeedProps {
  initialData?: Product[]
}

export function ActivityFeed({ initialData }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Product[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  const refreshActivities = async () => {
    try {
      const data = await statsApi.dashboard()
      if (data.recentActivity) {
        setActivities(data.recentActivity)
        setError(null)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch activities',
      )
    } finally {
      setLoading(false)
    }
  }

  const { isPolling, lastUpdate } = useDashboardPolling(
    refreshActivities,
    30000,
  )

  // Initial load if no initial data
  useEffect(() => {
    if (!initialData) {
      refreshActivities()
    }
  }, [])

  return (
    <div className="space-y-2">
      <RecentActivity activities={activities} loading={loading} />

      {/* Polling indicator */}
      {isPolling && (
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Canlı güncelleme aktif</span>
            <span>•</span>
            <span>
              Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive text-center">
          Güncelleme hatası: {error}
        </div>
      )}
    </div>
  )
}
