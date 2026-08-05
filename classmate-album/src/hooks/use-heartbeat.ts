'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export function useHeartbeat() {
  const { user } = useAuth()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sendHeartbeat = useCallback(async () => {
    if (!navigator.onLine) return
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      })
    } catch {}
  }, [])

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!user) {
      cleanup()
      return
    }

    sendHeartbeat()

    intervalRef.current = setInterval(sendHeartbeat, 45000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const handlePageHide = () => {
      cleanup()
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/heartbeat')
      }
    }
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      cleanup()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [user, sendHeartbeat, cleanup])
}
