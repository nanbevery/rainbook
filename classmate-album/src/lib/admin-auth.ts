'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface AdminPayload {
  adminId: number
  username: string
  role: string
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const data = await apiFetch<AdminPayload>('/api/admin/me')
      setAdmin(data)
    } catch {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore
    }
    setAdmin(null)
  }, [])

  return { admin, loading, logout, refresh: checkAuth }
}
