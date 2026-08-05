'use client'

import { useEffect, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth-context'

export interface NotificationPayload {
  id: number
  type: string
  title: string
  content: string
  createdAt: string
}

let globalSocket: Socket | null = null
let listenerCount = 0

function getOrCreateSocket(): Socket {
  if (globalSocket?.connected) return globalSocket

  if (globalSocket) {
    globalSocket.disconnect()
  }

  globalSocket = io(window.location.origin, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
  })

  globalSocket.on('notification', (notification: NotificationPayload) => {
    window.dispatchEvent(new CustomEvent('ws-notification', { detail: notification }))
  })

  return globalSocket
}

function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect()
    globalSocket = null
  }
}

export function useSocket() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      if (listenerCount === 0) {
        disconnectSocket()
      }
      return
    }

    getOrCreateSocket()
    listenerCount++

    return () => {
      listenerCount--
      if (listenerCount <= 0) {
        listenerCount = 0
        disconnectSocket()
      }
    }
  }, [user])
}

export function useSocketNotification(handler: (notification: NotificationPayload) => void) {
  const handlerRef = { current: handler }
  handlerRef.current = handler

  useEffect(() => {
    const listener = (e: Event) => {
      handlerRef.current?.((e as CustomEvent<NotificationPayload>).detail)
    }
    window.addEventListener('ws-notification', listener)
    return () => window.removeEventListener('ws-notification', listener)
  }, [])
}
