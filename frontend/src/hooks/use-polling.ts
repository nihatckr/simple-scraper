'use client'

import { useEffect, useRef, useState } from 'react'

interface UsePollingOptions {
  interval: number
  immediate?: boolean
  enabled?: boolean
}

export function usePolling(
  callback: () => Promise<void> | void,
  options: UsePollingOptions,
) {
  const { interval, immediate = true, enabled = true } = options
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const startPolling = () => {
    if (intervalRef.current) return

    setIsPolling(true)
    intervalRef.current = setInterval(async () => {
      try {
        await callbackRef.current()
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, interval)
  }

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsPolling(false)
    }
  }

  const restartPolling = () => {
    stopPolling()
    startPolling()
  }

  useEffect(() => {
    if (enabled) {
      if (immediate) {
        callbackRef.current()
      }
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, interval, immediate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  return {
    isPolling,
    startPolling,
    stopPolling,
    restartPolling,
  }
}

// Specialized hook for dashboard data polling
export function useDashboardPolling(
  refreshCallback: () => Promise<void>,
  interval = 30000, // 30 seconds
) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const wrappedCallback = async () => {
    await refreshCallback()
    setLastUpdate(new Date())
  }

  const polling = usePolling(wrappedCallback, {
    interval,
    immediate: false,
    enabled: true,
  })

  return {
    ...polling,
    lastUpdate,
  }
}
